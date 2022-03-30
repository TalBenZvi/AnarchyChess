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

  sendMove(move: Move): void {
    this._position.move(9, move.row, move.column);
    if (this._board != null) {
      this._board.setPieces(
        this._position.playingPieces,
        this._position.findAvaillableMovesForPlayer(9),
        9
      );
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
