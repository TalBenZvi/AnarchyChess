import {
  GameServer,
  ServerObserver,
  ServerNotificationType,
  ServerNotificationInfo,
} from "./game_server";
import {
  NUM_OF_PLAYERS,
  Position,
  Move,
  Square,
  PieceColor,
  Piece,
  PieceType,
  CastleSide,
  WHITE_KING_PLAYER_INDEX,
  BLACK_KING_PLAYER_INDEX,
} from "../game_flow_util/game_elements";
import {
  Event,
  EventType,
  EventInfo,
  replacer,
  Request,
  RequestType,
  RequestInfo,
  reviver,
  GameStatus,
} from "../communication/communication_util";
import { Lobby, User } from "../database/database_util";
import { Authentication } from "../database/authentication";
import { PlayerList } from "../game_flow_util/player_list";

const COOLDOWN_VARIANCE: number = 0.2;
// in seconds
const GAME_INTERVAL: number = 3;

export class ServerFlowEngine implements ServerObserver {
  private gameServer: GameServer;
  private _lobby: Lobby = null as any;
  private playerList: PlayerList = null as any;
  private position: Position = new Position("server");
  private gameStatus: GameStatus = GameStatus.inactive;
  private roleAssignemnts: number[] = null as any;
  private moveRequests: Move[] = [...Array(NUM_OF_PLAYERS)].fill(null);
  private isOnCooldown: boolean[] = [...Array(NUM_OF_PLAYERS)].fill(false);
  private isAlive: boolean[] = [...Array(NUM_OF_PLAYERS)].fill(true);
  private respawnTimeouts: any[] = [...Array(NUM_OF_PLAYERS)].fill(null);
  private newGameTimeout: NodeJS.Timeout = null as any;

  constructor() {
    this.gameServer = new GameServer(this);
  }

  get lobby(): Lobby {
    return this._lobby;
  }

  get players(): User[] {
    return this.playerList.getAllUsers();
  }

  acceptConnections(lobby: Lobby): void {
    if (this.gameStatus === GameStatus.inactive) {
      this.gameStatus = GameStatus.waitingForPlayers;
      this._lobby = lobby;
      this.gameServer.acceptConnections(lobby.id);
      this.playerList = new PlayerList(lobby.areTeamsPrearranged);
    }
  }

  destroyConnections(): void {
    if (this.gameServer != null) {
      this.gameServer.destroyConenctions();
    }
  }

  kickPlayer(player: User): void {
    let userIndex = this.playerList.indexOf(player);
    if (userIndex !== -1) {
      this.playerList.removePlayerAtIndex(userIndex);
      this.gameServer.disconnectFromUser(userIndex);
      this.sendPlayerListUpdates();
    }
  }

  kickAllBots() {
    for (let player of this.playerList.getAllUsers()) {
      if (player != null && player.id.includes("BOT")) {
        this.kickPlayer(player);
      }
    }
  }

  changePlayerTeam(player: User) {
    this.playerList.changePlayerTeam(player);
    this.sendPlayerListUpdates();
  }

  private resetGameplayElements(): void {
    for (let respawnTimeout of this.respawnTimeouts) {
      clearTimeout(respawnTimeout);
    }
    this.moveRequests = [...Array(NUM_OF_PLAYERS)].fill(null);
    this.isOnCooldown = [...Array(NUM_OF_PLAYERS)].fill(false);
    this.isAlive = [...Array(NUM_OF_PLAYERS)].fill(true);
    this.respawnTimeouts = [...Array(NUM_OF_PLAYERS)].fill(null);
  }

  startGame(): void {
    if (
      this.gameStatus === GameStatus.waitingForPlayers ||
      this.gameStatus === GameStatus.betweenRounds
    ) {
      this.gameStatus = GameStatus.running;
      this.resetGameplayElements();
      this.position.setToStartingPosition();
      this.roleAssignemnts = this.playerList.generateRoleAssignments();
      let initialPlayerCooldowns: number[] = [...Array(NUM_OF_PLAYERS)].map(
        (_, i: number) => this.putPlayerOnCooldown(i, new Date().getTime())
      );
      this.gameServer.startGame(
        [...this.roleAssignemnts],
        initialPlayerCooldowns
      );
    }
  }

  endGame(winningColor: PieceColor): void {
    if (this.gameStatus === GameStatus.running) {
      this.gameStatus = GameStatus.betweenRounds;
      this.resetGameplayElements();
      this.gameServer.endGame(winningColor);
      this.newGameTimeout = setTimeout(() => {
        this.startGame();
      }, GAME_INTERVAL * 1000);
    }
  }

  returnToLobby(): void {
    if (
      this.gameStatus === GameStatus.running ||
      this.gameStatus === GameStatus.betweenRounds
    ) {
      if (this.newGameTimeout != null) {
        clearTimeout(this.newGameTimeout);
      }
      this.gameStatus = GameStatus.waitingForPlayers;
      this.position = new Position();
      this.resetGameplayElements();
      this.gameServer.broadcastEvent({
        index: null as any,
        type: EventType.returnToLobby,
        info: new Map<EventInfo, string>(),
      });
    }
  }

  private killPlayer(playerIndex: number): number {
    this.isAlive[playerIndex] = false;
    this.isOnCooldown[playerIndex] = false;
    this.moveRequests[playerIndex] = null as any;
    let respawnTimer: number =
      Position.getStartPieceByPlayer(playerIndex).respawnTimer;
    this.position.killPlayer(playerIndex);
    this.respawnTimeouts[playerIndex] = setTimeout(() => {
      this.respawnPlayer(playerIndex);
    }, respawnTimer * 1000);
    return respawnTimer;
  }

  private respawnPlayer(playerIndex: number) {
    let respawnSquare: Square =
      this.position.getRespawnSquareForPlayer(playerIndex);
    this.position.respawnPlayerAt(playerIndex, respawnSquare);
    this.isAlive[playerIndex] = true;
    this.gameServer.broadcastEvent({
      index: null as any,
      type: EventType.respawn,
      info: new Map<EventInfo, string>([
        [EventInfo.playerIndex, playerIndex.toString()],
        [EventInfo.respawnSquare, JSON.stringify(respawnSquare, replacer)],
      ]),
    });
    if (this.moveRequests[playerIndex] != null) {
      this.registerMove(
        playerIndex,
        this.moveRequests[playerIndex],
        new Date().getTime()
      );
    }
  }

  // returns the chosen cooldown
  private putPlayerOnCooldown(
    playerIndex: number,
    updateArrivalTime: number
  ): number {
    this.isOnCooldown[playerIndex] = true;
    let cooldown: number =
      this.position.getPieceByPlayer(playerIndex).cooldown *
      ((Math.random() * 2 - 1) * COOLDOWN_VARIANCE + 1);
    setTimeout(() => {
      this.isOnCooldown[playerIndex] = false;
      if (this.moveRequests[playerIndex] != null && this.isAlive[playerIndex]) {
        this.registerMove(
          playerIndex,
          this.moveRequests[playerIndex],
          new Date().getTime()
        );
      }
    }, cooldown * 1000 - (new Date().getTime() - updateArrivalTime));
    return cooldown;
  }

  private registerMove(
    playerIndex: number,
    moveRequest: Move,
    moveArrivalTime: number
  ) {
    let playerLocation: Square = this.position.getPlayerLocation(playerIndex);
    if (playerLocation != null) {
      let move: Move = this.position.locateMoveForPlayer(
        playerIndex,
        moveRequest
      );
      // move is valid
      if (move != null) {
        let winningColor: PieceColor = null as any;
        let event: Event = {
          index: null as any,
          type: EventType.move,
          info: new Map<EventInfo, string>([
            [EventInfo.playerIndex, playerIndex.toString()],
          ]),
        };
        // isCapture
        if (move.isCapture) {
          let dyingPlayerIndex = this.position.playerAt(move.row, move.column);
          let respawnTimer: number = this.killPlayer(dyingPlayerIndex);
          event.info.set(EventInfo.respawnTimer, respawnTimer.toString());
          switch (dyingPlayerIndex) {
            case WHITE_KING_PLAYER_INDEX: {
              winningColor = PieceColor.black;
              break;
            }
            case BLACK_KING_PLAYER_INDEX: {
              winningColor = PieceColor.white;
              break;
            }
          }
        }
        // isEnpassant
        if (move.isEnPassant) {
          let enPassantedPlayerIndex = this.position.playerAt(
            playerLocation.row,
            move.column
          );
          let enPassantRespawnTimer: number = this.killPlayer(
            enPassantedPlayerIndex
          );
          event.info.set(
            EventInfo.enPassantRespawnTimer,
            enPassantRespawnTimer.toString()
          );
        }
        // execute move
        this.position.move(playerIndex, move.row, move.column);
        let movingPiece: Piece = this.position.getPieceByPlayer(playerIndex);
        // isPromotion
        if (move.isPromotion && moveRequest.promotionType != null) {
          let promotionType: PieceType = moveRequest.promotionType;
          move.promotionType = promotionType;
          this.position.promotePieceAt(move.row, move.column, promotionType);
        }
        event.info.set(EventInfo.move, JSON.stringify(move));
        // isCastle
        if (move.isCastle) {
          let startRow: number = movingPiece.color === PieceColor.white ? 0 : 7;
          let startColumn: number =
            move.castleSide === CastleSide.kingSide ? 7 : 0;
          let destColumn: number =
            move.castleSide === CastleSide.kingSide ? 5 : 3;
          this.position.moveFrom(startRow, startColumn, startRow, destColumn);
        }
        this.moveRequests[playerIndex] = null as any;
        let cooldown: number = this.putPlayerOnCooldown(
          playerIndex,
          moveArrivalTime
        );
        event.info.set(EventInfo.cooldown, cooldown.toString());
        this.gameServer.broadcastEvent(event);
        if (winningColor != null) {
          this.endGame(winningColor);
        }
      }
    }
  }

  private sendPlayerListUpdates() {
    this.gameServer.broadcastEvent({
      index: null as any,
      type: EventType.playerListUpdate,
      info: new Map<EventInfo, string>([
        [EventInfo.playerList, JSON.stringify(this.playerList)],
      ]),
    });
    Authentication.updateLobbyMembers(
      this.lobby.id,
      this.playerList
        .getAllUsers()
        .map((user: User) => (user == null ? (null as any) : user.id))
    );
  }

  private handleConnection(userIndex: number, user: User) {
    if (this.gameStatus === GameStatus.waitingForPlayers) {
      this.playerList.setPlayer(userIndex, user);
      this.sendPlayerListUpdates();
    }
  }

  private handleDisconnection(userIndex: number) {
    this.playerList.removePlayerAtIndex(userIndex);
    this.sendPlayerListUpdates();
  }

  private async handleRequest(
    userIndex: number,
    request: Request,
    requestArrivalTime: number
  ) {
    switch (request.type) {
      // connection
      case RequestType.connection: {
        let user: User = JSON.parse(
          request.info.get(RequestInfo.user) as string,
          reviver
        );
        this.handleConnection(userIndex, user);
        break;
      }
      // disconnection
      case RequestType.disconnection: {
        this.handleDisconnection(userIndex);
        break;
      }
      // move
      case RequestType.move: {
        if (this.gameStatus === GameStatus.running) {
          let moveRequest: Move = JSON.parse(
            request.info.get(RequestInfo.move) as string,
            reviver
          );
          let playerIndex: number = this.roleAssignemnts[userIndex];
          if (this.isAlive[playerIndex]) {
            this.moveRequests[playerIndex] = moveRequest;
            if (!this.isOnCooldown[playerIndex]) {
              this.registerMove(playerIndex, moveRequest, requestArrivalTime);
            }
          }
        }
        break;
      }
    }
  }

  async notify(
    notification: ServerNotificationType,
    notificationInfo: Map<ServerNotificationInfo, any>
  ) {
    switch (notification) {
      case ServerNotificationType.playerDisconnected: {
        let userIndex: number = notificationInfo.get(
          ServerNotificationInfo.userIndex
        );
        this.handleDisconnection(userIndex);
        break;
      }
      case ServerNotificationType.receivedRequest: {
        let requestArrivalTime: number = new Date().getTime();
        let request: Request = notificationInfo.get(
          ServerNotificationInfo.request
        );
        this.handleRequest(
          notificationInfo.get(ServerNotificationInfo.userIndex),
          request,
          requestArrivalTime
        );
        break;
      }
    }
  }
}
