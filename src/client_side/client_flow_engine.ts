import {
  Board,
  Position,
  PlayingPiece,
  NUM_OF_PLAYERS,
  BOARD_SIZE,
  Move,
} from "../game_flow_util/game_elements";

export class ClientFlowEngine {
  private _position: Position = new Position();
  private _board?: Board;

  set board(board: Board) {
    this._board = board;
  }

  async sendMove(move: Move) {
    let playerIndex: number = 9;

    this._position.move(playerIndex, move.row, move.column);
    if (this._board != null) {
      this._board.setPieces(
        this._position.playingPieces,
        this._position.findAvaillableMovesForPlayer(playerIndex),
        playerIndex
      );
    }
    if (move.isPromotion) {
      this._position.promotePieceAt(move.row, move.column, move.promotionType);
      if (this._board != null) {
        await new Promise(f => setTimeout(f, 200));
        this._board.setPieces(
          this._position.playingPieces,
          this._position.findAvaillableMovesForPlayer(playerIndex),
          null as any,
        );
      }
    }
    
  }

  async test(): Promise<void> {
    if (this._board != null) {
      this._position.setToStartingPosition();
      this._board.setPieces(
        this._position.playingPieces,
        this._position.findAvaillableMovesForPlayer(9)
      );
    }
  }
}
