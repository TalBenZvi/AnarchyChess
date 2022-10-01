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
import { PlayerList } from "../src/game_flow_util/player_list.js";
import {
  replacer,
  reviver,
  GameStatus,
  User,
  GAME_START_DELAY,
} from "../src/communication/communication_util.js";
import { BaseBot } from "./bots/base_bot.js";
import { CustomBot } from "./bots/custom_bot.js";
import { MoveCountingAI } from "./AIs/move_counting_ai.js";
import { ThreatAvoidingAI } from "./AIs/threat_avoiding_ai.js";
import { RussianBot } from "./bots/russian_bot.js";

const INITIAL_COOLDOWN_VARIANCE: number = 0.7;
const COOLDOWN_VARIANCE: number = 0.2;
const COOLDOWN_FACTOR = 2.5;

const RESPAWN_FACTOR: number = 2;

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
  private gameStatus: GameStatus = GameStatus.waitingForPlayers;
  private roleAssignemnts: Map<string, number> = null as any;
  private moveRequests: Move[] = [...Array(NUM_OF_PLAYERS)].fill(null);
  private isOnCooldown: boolean[] = [...Array(NUM_OF_PLAYERS)].fill(false);
  private isAlive: boolean[] = [...Array(NUM_OF_PLAYERS)].fill(true);
  private respawnTimeouts: any[] = [...Array(NUM_OF_PLAYERS)].fill(null);
  private cooldownTimeouts: any[] = [...Array(NUM_OF_PLAYERS)].fill(null);
  private newGameTimeout: NodeJS.Timeout = null as any;

  private bots: BaseBot[] = [];

  constructor(
    private observer: MechanicsEngineObserver,
    areTeamsPrearranged: boolean
  ) {
    this.playerList = new PlayerList(areTeamsPrearranged);
  }

  //debug
  private setRoleForAdmin(playerIndex: number) {
    for (let i = 0; i < NUM_OF_PLAYERS - 1; i++) {
      if (this.roleAssignemnts.get(`bot_${i + 1}`) === playerIndex) {
        this.roleAssignemnts.set(
          `bot_${i + 1}`,
          this.roleAssignemnts.get("6316513d45193eb2fa495db4") as number
        );
        this.roleAssignemnts.set("6316513d45193eb2fa495db4", playerIndex);
      }
    }
  }

  private notifyObservers(
    type: MechanicsEngineNotificationType,
    info: Map<MechanicsEngineNotificationInfo, any>
  ) {
    this.observer.notify(type, info);
    for (let bot of this.bots) {
      bot.notify(type, info);
    }
  }

  getPlayerListJSON(): string {
    return JSON.stringify(this.playerList, replacer);
  }

  addPlayer(player: User) {
    this.playerList.addPlayer(player);
  }

  removePlayer(userID: string) {
    this.playerList.removePlayer(userID);
    if (userID.includes("bot")) {
      this.bots = this.bots.filter((bot: BaseBot) => bot.user.id !== userID);
    }
  }

  changePlayerTeam(playerID: string) {
    this.playerList.changePlayerTeam(playerID);
  }

  fillWithBots() {
    this.bots = [
      ...Array(NUM_OF_PLAYERS - this.playerList.getConnectedUsers().length),
    ].map((_, i: number) => {
      return new RussianBot(
        {
          id: `bot_${i + 1}`,
          username: `Bot ${i + 1}`,
        },
        this
      );
    });
    for (let bot of this.bots) {
      this.addPlayer(bot.user);
    }
  }

  removeAllBots() {
    for (let bot of this.bots) {
      this.removePlayer(bot.user.id);
    }
    this.bots = [];
  }

  getPosition(): Position {
    return this.position;
  }

  private resetGameplayElements(): void {
    for (let respawnTimeout of this.respawnTimeouts) {
      clearTimeout(respawnTimeout);
    }
    for (let cooldownTimeout of this.cooldownTimeouts) {
      clearTimeout(cooldownTimeout);
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
      // this.setRoleForAdmin(1);
      let initialPlayerCooldowns: number[] = [...Array(NUM_OF_PLAYERS)].map(
        (_, i: number) =>
          this.putPlayerOnCooldown(i, new Date().getTime(), true)
      );
      this.notifyObservers(
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
      this.notifyObservers(
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
      this.notifyObservers(
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
      Position.getStartPieceByPlayer(playerIndex).respawnTimer * RESPAWN_FACTOR;
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
    this.notifyObservers(
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
    updateArrivalTime: number,
    isInitial: boolean
  ): number {
    this.isOnCooldown[playerIndex] = true;
    let cooldown: number =
      this.position.getPieceByPlayer(playerIndex).cooldown *
      ((Math.random() * 2 - 1) *
        (isInitial ? INITIAL_COOLDOWN_VARIANCE : COOLDOWN_VARIANCE) +
        1) *
      COOLDOWN_FACTOR;
    let delay: number = cooldown;
    if (isInitial) {
      delay += GAME_START_DELAY;
    }
    this.cooldownTimeouts[playerIndex] = setTimeout(() => {
      this.isOnCooldown[playerIndex] = false;
      if (this.moveRequests[playerIndex] != null && this.isAlive[playerIndex]) {
        this.registerMove(
          playerIndex,
          this.moveRequests[playerIndex],
          new Date().getTime()
        );
      }
    }, delay * 1000);
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
          moveArrivalTime,
          false
        );
        moveInfo.set(MechanicsEngineNotificationInfo.cooldown, cooldown as any);
        this.notifyObservers(MechanicsEngineNotificationType.move, moveInfo);
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
