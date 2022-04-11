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
import { Event, EventType, EventInfo, replacer } from "../game_flow_util/communication";

export class ServerFlowEngine implements ServerObserver {
  private gameServer: GameServer;
  private position: Position = new Position();
  private isGameRunning: boolean = false;

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

  private registerMove(playerIndex: number, moveRequest: Move) {
    let events: Event[] = [];
    let playerLocation: Square = this.position.getPlayerLocation(playerIndex);
    if (playerLocation != null) {
      let move: Move = this.position.locateMoveForPlayer(
        playerIndex,
        moveRequest
      );
      if (move != null) {
        this.position.move(playerIndex, move.row, move.column);
        if (move.isPromotion && moveRequest.promotionType != null) {
          let promotionType: PieceType = moveRequest.promotionType;
          move.promotionType = promotionType;
          this.position.promotePieceAt(move.row, move.column, promotionType);
        }
        events.push({
          type: EventType.move,
          info: new Map<EventInfo, string>([
            [EventInfo.playerIndex, playerIndex.toString()],
            [EventInfo.move, JSON.stringify(move, replacer)],
          ]),
        });
        if (move.isCastle) {
          let movingPiece: Piece = this.position.getPieceByPlayer(playerIndex);
          let startRow: number = movingPiece.color === PieceColor.white ? 0 : 7;
          let startColumn: number =
            move.castleSide === CastleSide.kingSide ? 7 : 0;
          let destColumn: number =
            move.castleSide === CastleSide.kingSide ? 5 : 3;
          this.position.moveFrom(startRow, startColumn, startRow, destColumn);
        }
      }
      this.gameServer.broadcastEvents(events);
    }
  }

  async notify(
    notification: ServerNotificationType,
    notificationInfo: Map<ServerNotificationInfo, any>
  ) {
    switch (notification) {
      case ServerNotificationType.filledServer: {
        console.log("server full");
        await new Promise((f) => setTimeout(f, 10000));
        this.startGame();
        break;
      }
      case ServerNotificationType.receivedMove: {
        if (this.isGameRunning) {
          this.registerMove(
            notificationInfo.get(ServerNotificationInfo.playerIndex),
            notificationInfo.get(ServerNotificationInfo.move)
          );
        }
        break;
      }
    }
  }
}
