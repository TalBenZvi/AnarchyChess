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

  private registerMove(playerIndex: number, moveRequest: Move, moveArrivalTime: number) {
    let playerLocation: Square = this.position.getPlayerLocation(playerIndex);
    if (playerLocation != null) {
      let move: Move = this.position.locateMoveForPlayer(
        playerIndex,
        moveRequest
      );
      if (move != null) {
        this.position.move(playerIndex, move.row, move.column);
        let movingPiece: Piece = this.position.getPieceByPlayer(playerIndex);
        if (move.isPromotion && moveRequest.promotionType != null) {
          let promotionType: PieceType = moveRequest.promotionType;
          move.promotionType = promotionType;
          this.position.promotePieceAt(move.row, move.column, promotionType);
        }
        if (move.isCastle) {
          let startRow: number = movingPiece.color === PieceColor.white ? 0 : 7;
          let startColumn: number =
            move.castleSide === CastleSide.kingSide ? 7 : 0;
          let destColumn: number =
            move.castleSide === CastleSide.kingSide ? 5 : 3;
          this.position.moveFrom(startRow, startColumn, startRow, destColumn);
        }
        this.isOnCooldown[playerIndex] = true;
        let cooldown: number = movingPiece.cooldown;
        setTimeout(() => {
          this.isOnCooldown[playerIndex] = false;
          if (this.moveRequests[playerIndex] != null) {
            this.registerMove(playerIndex, this.moveRequests[playerIndex], new Date().getTime());
          }
        }, cooldown * 1000 - (new Date().getTime() - moveArrivalTime));
        this.gameServer.broadcastEvent({
          type: EventType.move,
          info: new Map<EventInfo, string>([
            [EventInfo.playerIndex, playerIndex.toString()],
            [EventInfo.move, JSON.stringify(move, replacer)],
            [EventInfo.cooldown, cooldown.toString()],
          ]),
        });
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
          if (!this.isOnCooldown[playerIndex]) {
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
