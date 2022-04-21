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
} from "../game_flow_util/communication";

export class ServerFlowEngine implements ServerObserver {
  private gameServer: GameServer;
  private position: Position = new Position();
  private isGameRunning: boolean = false;
  private moveRequests: Move[] = [...Array(NUM_OF_PLAYERS)].fill(null);
  private isOnCooldown: boolean[] = [...Array(NUM_OF_PLAYERS)].fill(false);
  private isAlive: boolean[] = [...Array(NUM_OF_PLAYERS)].fill(true);

  constructor() {
    this.gameServer = new GameServer(this);
  }

  acceptConnections(gameID: string): void {
    this.gameServer.acceptConnections(gameID);
  }

  private startGame(): void {
    this.position.setToStartingPosition();
    this.isGameRunning = true;
    this.gameServer.startGame();
  }

  private killPlayer(playerIndex: number): number {
    this.isAlive[playerIndex] = false;
    let respawnTimer: number = Position.getStartPieceByPlayer(playerIndex).respawnTimer;
    this.position.killPlayer(playerIndex);
    this.isOnCooldown[playerIndex] = false;
    this.moveRequests[playerIndex] = null as any;
    setTimeout(() => {
      this.respawnPlayer(playerIndex);
    }, respawnTimer * 1000);
    return respawnTimer;
  }

  private respawnPlayer(playerIndex: number) {
    let respawnSquare: Square = this.position.getRespawnSquareForPlayer(playerIndex);
    this.position.respawnPlayerAt(playerIndex, respawnSquare);
    this.isAlive[playerIndex] = true;
    this.gameServer.broadcastEvent({
      type: EventType.respawn,
      info: new Map<EventInfo, string>([
        [EventInfo.playerIndex, playerIndex.toString()],
        [EventInfo.respawnSquare, JSON.stringify(respawnSquare, replacer)]
      ])
    });
    if (this.moveRequests[playerIndex] != null) {
      this.registerMove(playerIndex, this.moveRequests[playerIndex], new Date().getTime());
    }
  }

  private registerMove(playerIndex: number, moveRequest: Move, moveArrivalTime: number) {
    let playerLocation: Square = this.position.getPlayerLocation(playerIndex);
    if (playerLocation != null) {
      let move: Move = this.position.locateMoveForPlayer(
        playerIndex,
        moveRequest
      );
      // move is valid
      if (move != null) {
        let event: Event = {
          type: EventType.move,
          info: new Map<EventInfo, string>([
            [EventInfo.playerIndex, playerIndex.toString()],
          ]),
        }
        // isCapture
        if (move.isCapture) {
          let dyingPlayerIndex = this.position.playerAt(move.row, move.column);
          let respawnTimer: number = this.killPlayer(dyingPlayerIndex);
          event.info.set(EventInfo.respawnTimer, respawnTimer.toString());
        }
        // isEnpassant
        if (move.isEnPassant) {
          let enPassantedPlayerIndex = this.position.playerAt(playerLocation.row, move.column);
          let enPassantRespawnTimer: number = this.killPlayer(enPassantedPlayerIndex);
          event.info.set(EventInfo.enPassantRespawnTimer, enPassantRespawnTimer.toString());
        }
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
        // cooldown
        this.isOnCooldown[playerIndex] = true;
        this.moveRequests[playerIndex] = null as any;
        let cooldown: number = movingPiece.cooldown;
        setTimeout(() => {
          this.isOnCooldown[playerIndex] = false;
          if (this.moveRequests[playerIndex] != null) {
            this.registerMove(playerIndex, this.moveRequests[playerIndex], new Date().getTime());
          }
        }, cooldown * 1000 - (new Date().getTime() - moveArrivalTime));
        event.info.set(EventInfo.cooldown, cooldown.toString());
        this.gameServer.broadcastEvent(event);
      }
    }
  }

  async notify(
    notification: ServerNotificationType,
    notificationInfo: Map<ServerNotificationInfo, any>
  ) {
    switch (notification) {
      case ServerNotificationType.filledServer: {
        console.log("server full");
        await new Promise((f) => setTimeout(f, 3000));
        this.startGame();
        break;
      }
      case ServerNotificationType.receivedMove: {
        let moveArrivalTime: number = new Date().getTime();
        if (this.isGameRunning) {
          let playerIndex: number = notificationInfo.get(
            ServerNotificationInfo.playerIndex
          );
          let moveRequest: Move = notificationInfo.get(
            ServerNotificationInfo.move
          );
          this.moveRequests[playerIndex] = moveRequest;
          if (!this.isOnCooldown[playerIndex] && this.isAlive[playerIndex]) {
            this.registerMove(
              playerIndex,
              moveRequest,
              moveArrivalTime
            );
          }
        }
        break;
      }
    }
  }
}
