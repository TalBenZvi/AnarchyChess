import { GameServer } from "./game_server.js";
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
} from "../src/game_flow_util/game_elements.js";

// import { Lobby } from "../src/communication/communication_util.js";
import { PlayerList } from "../src/game_flow_util/player_list.js";
import {
  replacer,
  reviver,
  GameStatus,
  User,
} from "../src/communication/communication_util.js";

const COOLDOWN_VARIANCE: number = 0.2;
// in seconds
const GAME_INTERVAL: number = 3;

export enum MechanicsEngineNotificationType {
  gameStarted,
  gameEnded,
  returningToLobby,
  move,
  respawn,
}

export enum MechanicsEngineNotificationInfo {
  // gameStarted
  roleAssignemnts,
  initialPlayerCooldowns,
  // gameEnded
  winningColor,
  // move, respawn
  playerIndex,
  // move
  move,
  respawnTimer,
  enPassantRespawnTimer,
  cooldown,
  // respawn
  respawnSquare,
}

export interface MechanicsEngineObserver {
  notify(
    notification: MechanicsEngineNotificationType,
    notificationInfo: Map<MechanicsEngineNotificationInfo, any>
  ): void;
}

export class GameMechanicsEngine {
  private playerList: PlayerList = null as any;
  private position: Position = new Position("server");
  private gameStatus: GameStatus = GameStatus.inactive;
  private roleAssignemnts: Map<string, number> = null as any;
  private moveRequests: Move[] = [...Array(NUM_OF_PLAYERS)].fill(null);
  private isOnCooldown: boolean[] = [...Array(NUM_OF_PLAYERS)].fill(false);
  private isAlive: boolean[] = [...Array(NUM_OF_PLAYERS)].fill(true);
  private respawnTimeouts: any[] = [...Array(NUM_OF_PLAYERS)].fill(null);
  private newGameTimeout: NodeJS.Timeout = null as any;

  constructor(
    private observer: MechanicsEngineObserver,
    areTeamsPrearranged: boolean
  ) {
    this.playerList = new PlayerList(areTeamsPrearranged);
  }

  getPlayerListJSON(): string {
    return JSON.stringify(this.playerList, replacer);
  }

  addPlayer(player: User) {
    this.playerList.addPlayer(player);
  }

  removePlayer(userID: string) {
    this.playerList.removePlayer(userID);
  }

  changePlayerTeam(playerID: string) {
    this.playerList.changePlayerTeam(playerID);
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
      this.observer.notify(
        MechanicsEngineNotificationType.gameStarted,
        new Map([
          [
            MechanicsEngineNotificationInfo.roleAssignemnts,
            this.roleAssignemnts as any,
          ],
          [
            MechanicsEngineNotificationInfo.initialPlayerCooldowns,
            initialPlayerCooldowns,
          ],
        ])
      );
    }
  }

  private endGame(winningColor: PieceColor): void {
    if (this.gameStatus === GameStatus.running) {
      this.gameStatus = GameStatus.betweenRounds;
      this.resetGameplayElements();
      this.observer.notify(
        MechanicsEngineNotificationType.gameEnded,
        new Map([[MechanicsEngineNotificationInfo.winningColor, winningColor]])
      );
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
      this.observer.notify(
        MechanicsEngineNotificationType.returningToLobby,
        new Map()
      );
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
    this.observer.notify(
      MechanicsEngineNotificationType.respawn,
      new Map([
        [MechanicsEngineNotificationInfo.playerIndex, playerIndex as any],
        [MechanicsEngineNotificationInfo.respawnSquare, respawnSquare as any],
      ])
    );
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
        let moveInfo: Map<MechanicsEngineNotificationInfo, any> = new Map([
          [MechanicsEngineNotificationInfo.playerIndex, playerIndex as any],
        ]);
        // isCapture
        if (move.isCapture) {
          let dyingPlayerIndex = this.position.playerAt(move.row, move.column);
          let respawnTimer: number = this.killPlayer(dyingPlayerIndex);
          moveInfo.set(
            MechanicsEngineNotificationInfo.respawnTimer,
            respawnTimer as any
          );
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
          moveInfo.set(
            MechanicsEngineNotificationInfo.enPassantRespawnTimer,
            enPassantRespawnTimer as any
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
        moveInfo.set(MechanicsEngineNotificationInfo.move, move as any);
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
        moveInfo.set(MechanicsEngineNotificationInfo.cooldown, cooldown as any);
        this.observer.notify(MechanicsEngineNotificationType.move, moveInfo);
        if (winningColor != null) {
          this.endGame(winningColor);
        }
      }
    }
  }

  handleMoveRequest(moveRequest: Move, userID: string) {
    if (this.gameStatus === GameStatus.running) {
      let playerIndex: number = this.roleAssignemnts.get(userID) as number;
      if (this.isAlive[playerIndex]) {
        this.moveRequests[playerIndex] = moveRequest;
        if (!this.isOnCooldown[playerIndex]) {
          this.registerMove(playerIndex, moveRequest, Date.now());
        }
      }
    }
  }
}
