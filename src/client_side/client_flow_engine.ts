import {
  Board,
  Position,
  PlayingPiece,
  NUM_OF_PLAYERS,
  BOARD_SIZE,
} from "../game_flow_util/game_elements";

export class ClientFlowEngine {
  private _position: Position = new Position();
  private _board?: Board;

  set board(board: Board) {
    this._board = board;
  }

  async test(): Promise<void> {
    if (this._board != null) {
      this._position.setToStartingPosition();
      this._board.setPieces(this._position.playingPieces);
      while (true) {
        let movingPieceIndex: number = 0
        let destRow: number = Math.floor(Math.random() * BOARD_SIZE);
        let destColumn: number = Math.floor(Math.random() * BOARD_SIZE);
        await new Promise((f) => setTimeout(f, 1000));
        this._position.move(movingPieceIndex, destRow, destColumn);
        this._board.setPieces(this._position.playingPieces, movingPieceIndex);
      }
    }
  }
}
