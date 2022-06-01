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
} from "../game_flow_util/communication";
import { User } from "../database/database_util";
import { Authentication } from "../database/authentication";

const COOLDOWN_VARIANCE = 0.2;

export class ServerFlowEngine implements ServerObserver {
  private gameServer: GameServer;
  private _gameID: string = null as any;
  private _players: User[] = [...Array(NUM_OF_PLAYERS)].fill(null);
  private position: Position = new Position("server");
  private isGameRunning: boolean = false;
  private moveRequests: Move[] = [...Array(NUM_OF_PLAYERS)].fill(null);
  private isOnCooldown: boolean[] = [...Array(NUM_OF_PLAYERS)].fill(false);
  private isAlive: boolean[] = [...Array(NUM_OF_PLAYERS)].fill(true);

  constructor() {
    this.gameServer = new GameServer(this);
  }

  get gameID(): string {
    return this._gameID;
  }

  get players(): User[] {
    return [...this._players];
  }

  acceptConnections(gameID: string): void {
    this._gameID = gameID;
    this.gameServer.acceptConnections(gameID);
  }

  destroyConnections(): void {
    if (this.gameServer != null) {
      this.gameServer.destroyConenctions();
    }
  }

  startGame(): void {
    this.position.setToStartingPosition();
    this.isGameRunning = true;
    let initialPlayerCooldowns: number[] = [...Array(NUM_OF_PLAYERS)].map(
      (_, i: number) => this.putPlayerOnCooldown(i, new Date().getTime())
    );
    this.gameServer.startGame(initialPlayerCooldowns);
  }

  private killPlayer(playerIndex: number): number {
    this.isAlive[playerIndex] = false;
    let respawnTimer: number =
      Position.getStartPieceByPlayer(playerIndex).respawnTimer;
    this.position.killPlayer(playerIndex);
    this.isOnCooldown[playerIndex] = false;
    this.moveRequests[playerIndex] = null as any;
    setTimeout(() => {
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
          // temp
          if (
            this.position.getPieceByPlayer(dyingPlayerIndex).type ===
            PieceType.king
          ) {
            return;
          }
          let respawnTimer: number = this.killPlayer(dyingPlayerIndex);
          event.info.set(EventInfo.respawnTimer, respawnTimer.toString());
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
      }
    }
  }

  private handleConnection(playerIndex: number, user: User) {
    this._players[playerIndex] = user;
    //console.log([...this.players].filter((player) => player != null).length);
    //console.log([...this.players]);
    this.gameServer.broadcastEvent({
      index: null as any,
      type: EventType.playerListUpdate,
      info: new Map<EventInfo, string>([
        [
          EventInfo.connectedPlayers,
          JSON.stringify(
            this._players.filter((player: User) => player != null)
          ),
        ],
      ]),
    });
    Authentication.updateLobbyMembers(
      this._gameID,
      this._players.map((player: User) =>
        player == null ? (null as any) : player.id
      )
    );
  }

  private handleDisconnection(playerIndex: number) {
    console.log("here");
    this._players[playerIndex] = null as any;
    this.gameServer.broadcastEvent({
      index: null as any,
      type: EventType.playerListUpdate,
      info: new Map<EventInfo, string>([
        [
          EventInfo.connectedPlayers,
          JSON.stringify(
            this._players.filter((player: User) => player != null)
          ),
        ],
      ]),
    });
    Authentication.updateLobbyMembers(
      this._gameID,
      this._players.map((player: User) =>
        player == null ? (null as any) : player.id
      )
    );
  }

  private async handleRequest(
    playerIndex: number,
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
        this.handleConnection(playerIndex, user);
        break;
      }
      // disconnection
      case RequestType.disconnection: {
        this.handleDisconnection(playerIndex);
        break;
      }
      // move
      case RequestType.move: {
        if (this.isGameRunning) {
          let moveRequest: Move = JSON.parse(
            request.info.get(RequestInfo.move) as string,
            reviver
          );
          this.moveRequests[playerIndex] = moveRequest;
          if (!this.isOnCooldown[playerIndex] && this.isAlive[playerIndex]) {
            this.registerMove(playerIndex, moveRequest, requestArrivalTime);
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
        let playerIndex: number = notificationInfo.get(
          ServerNotificationInfo.playerIndex
        );
        this.handleDisconnection(playerIndex);
        break;
      }
      case ServerNotificationType.filledServer: {
        console.log("server full");
        break;
      }
      case ServerNotificationType.receivedRequest: {
        let requestArrivalTime: number = new Date().getTime();
        let request: Request = notificationInfo.get(
          ServerNotificationInfo.request
        );
        this.handleRequest(
          notificationInfo.get(ServerNotificationInfo.playerIndex),
          request,
          requestArrivalTime
        );
        break;
      }
    }
  }
}
