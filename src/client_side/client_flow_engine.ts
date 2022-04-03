import {
  GameClient,
  ClientNotificationType,
  ClientNotificationInfo,
  ClientObserver,
} from "./game_client";
import {
  Board,
  Position,
  Move,
  Square,
  Piece,
  PieceColor,
  CastleSide,
  PieceType,
} from "../game_flow_util/game_elements";
import { Event, EventInfo, EventType } from "../game_flow_util/events";

export class ClientFlowEngine implements ClientObserver {
  private gameClient: GameClient = new GameClient(this);
  private position: Position = new Position();
  private _board: Board = null as any;

  private isGameRunning: boolean = false;
  private playerIndex: number = null as any;

  set board(board: Board) {
    this._board = board;
  }

  connect(port: number, ip: string): void {
    this.gameClient.connect(port, ip);
  }

  sendMove(move: Move) {
    this.gameClient.sendMove(move);
  }

  private updateBoard(movingPlayerIndex: number) {
    if (this._board != null) {
      this._board.setPieces(
        this.position.playingPieces,
        this.position.findAvaillableMovesForPlayer(this.playerIndex),
        movingPlayerIndex
      );
    }
  }

  private registerEvent(event: Event) {
    switch (event.type) {
      case EventType.gameStarted: {
        this.playerIndex = event.playerIndex;
        this.position.setToStartingPosition();
        this.updateBoard(null as any);
        break;
      }
      case EventType.move: {
        let move: Move = this.position.locateMoveForPlayer(
          event.playerIndex,
          event.info.get(EventInfo.move)
        );
        let movingPlayerIndex = event.playerIndex;
        let movingPlayerLocation: Square = this.position.getPlayerLocation(
          movingPlayerIndex
        );
        if (move != null) {
          this.position.move(movingPlayerIndex, move.row, move.column);
          if (move.isEnPassant) {
            this.position.killPlayerAt(movingPlayerLocation.row, move.column);
          }
          this.updateBoard(movingPlayerIndex);
          if (move.isPromotion) {
            let promotionType: PieceType = (event.info.get(
              EventInfo.move
            ) as Move).promotionType;
            if (promotionType != null) {
              this.position.promotePieceAt(
                move.row,
                move.column,
                move.promotionType
              );
              this.updateBoard(null as any);
            }
          }
          if (move.isCastle) {
            let movingPiece: Piece = this.position.getPieceByPlayer(
              movingPlayerIndex
            );
            let startRow: number =
              movingPiece.color === PieceColor.white ? 0 : 7;
            let startColumn: number =
              move.castleSide === CastleSide.kingSide ? 7 : 0;
            let destColumn: number =
              move.castleSide === CastleSide.kingSide ? 5 : 3;
            let movingRookIndex = this.position.playerAt(startRow, startColumn);
            this.position.move(movingRookIndex, startRow, destColumn);
            this.updateBoard(movingRookIndex);
          }
        }
        break;
      }
    }
  }

  notify(
    notification: ClientNotificationType,
    notificationInfo: Map<ClientNotificationInfo, any>
  ): void {
    switch (notification) {
      case ClientNotificationType.connectedToServer: {
        break;
      }
      case ClientNotificationType.disconnectedFromServer: {
        break;
      }
      case ClientNotificationType.receivedEvents: {
        for (let event of notificationInfo.get(
          ClientNotificationInfo.events
        ) as Event[]) {
          this.registerEvent(event);
        }
        break;
      }
    }
  }
}
