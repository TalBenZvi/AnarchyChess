import {
  GameClient,
  ClientNotificationType,
  ClientNotificationInfo,
  ClientObserver,
  ConnectionStatus,
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
import {
  Event,
  EventInfo,
  EventType,
  GameStatus,
  replacer,
  reviver,
} from "../game_flow_util/communication";

export class ClientFlowEngine implements ClientObserver {
  private gameClient: GameClient;
  private position: Position = new Position();
  private _board: Board = null as any;

  private isGameRunning: boolean = false;
  private playerIndex: number = null as any;
  private playerID: string;

  // in seconds
  private cooldownTimer: number = null as any;
  // in millis
  private cooldownCompletionTime: number = null as any;
  private selectedMove: Square = null as any

  constructor(playerID: string) {
    this.playerID = playerID;
    this.gameClient = new GameClient(this, playerID);
  }

  set board(board: Board) {
    this._board = board;
  }

  async attemptToConnect(ip: string, gameID: string) {
    let connectionStatus: ConnectionStatus = await this.gameClient.attemptToConnect(
      ip,
      gameID
    );
    console.log(`${this.playerID}: ${connectionStatus}`);
  }

  sendMove(move: Move) {
    this.gameClient.sendMove(move);
    this.selectedMove = move == null ? null as any : new Square(move.row, move.column);
    this.updateBoard(null as any);
  }

  private updateBoard(movingPlayerIndex: number) {
    let now: number = new Date().getTime();
    let isOnCooldown: boolean =
      this.cooldownCompletionTime != null && this.cooldownCompletionTime > now;
    if (!isOnCooldown) {
      this.cooldownTimer = null as any;
      this.cooldownCompletionTime = null as any;
    }
    if (this._board != null) {
      this._board.setPieces(
        this.position.playingPieces,
        this.position.findAvaillableMovesForPlayer(this.playerIndex),
        movingPlayerIndex,
        isOnCooldown ? this.cooldownTimer : (null as any),
        isOnCooldown
          ? (this.cooldownCompletionTime - new Date().getTime()) / 1000
          : (null as any),
        this.selectedMove
      );
    }
  }

  private async registerEvent(event: Event) {
    switch (event.type) {
      case EventType.gameStarted: {
        let playerIndex: number = (JSON.parse(
          event.info.get(EventInfo.connectedPlayerIndices) as string,
          reviver
        ) as Map<string, number>).get(this.playerID) as number;
        this.playerIndex = playerIndex;
        this.gameClient.playerIndex = playerIndex;
        this.gameClient.gameStatus = GameStatus.running;
        if (this._board != null) {
          this._board.setPlayerIndex(playerIndex);
        }
        this.position.setToStartingPosition();
        this.updateBoard(null as any);
        break;
      }
      case EventType.move: {
        let moveUpdateTime = new Date().getTime();
        let moveRequest: Move = JSON.parse(
          event.info.get(EventInfo.move) as string
        );
        let move: Move = this.position.locateMoveForPlayer(
          parseInt(event.info.get(EventInfo.playerIndex) as string),
          moveRequest
        );
        let movingPlayerIndex: number = parseInt(
          event.info.get(EventInfo.playerIndex) as string
        );
        if (movingPlayerIndex === this.playerIndex) {
          this.cooldownTimer = parseInt(
            event.info.get(EventInfo.cooldown) as string
          );
          this.cooldownCompletionTime =
            moveUpdateTime + this.cooldownTimer * 1000;
        }
        let movingPlayerLocation: Square = this.position.getPlayerLocation(
          movingPlayerIndex
        );
        if (move != null) {
          this.position.move(movingPlayerIndex, move.row, move.column);
          if (move.isEnPassant) {
            this.position.killPlayerAt(movingPlayerLocation.row, move.column);
          }
          if (movingPlayerIndex === this.playerIndex) {
            this.selectedMove = null as any;
          }
          this.updateBoard(movingPlayerIndex);
          await new Promise((f) => setTimeout(f, 140));
          this.updateBoard(null as any);
          if (move.isPromotion) {
            let promotionType: PieceType = moveRequest.promotionType;
            if (promotionType != null) {
              this.position.promotePieceAt(
                move.row,
                move.column,
                moveRequest.promotionType
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
      case ClientNotificationType.disconnectedFromServer: {
        break;
      }
      case ClientNotificationType.receivedEvent: {
        this.registerEvent(notificationInfo.get(ClientNotificationInfo.event));
        break;
      }
    }
  }

  async runTest() {
    this.playerIndex = 0;
    this.position.setToStartingPosition();
    this.updateBoard(null as any);
  }
}
