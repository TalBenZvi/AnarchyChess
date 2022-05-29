import {
  PieceColor,
  Piece,
  Move,
  Square,
  PlayingPiece,
} from "../game_flow_util/game_elements";
import { User } from "../database/database_util";

export interface ClientPageComponent {
  disconnect(): void;
}

export interface ChessBoardComponent {
  setPovColor(povColor: PieceColor): void;

  setPlayerSquare(playerSquare: Square): void;

  setPieces(playingPieces: PlayingPiece[]): void;

  setAvailableMoves(availableMoves: Move[]): void;

  setSelectedMove(selectedMove: Square): void;

  movePlayer(playerIndex: number, row: number, column: number): void;

  startCooldownTimer(cooldownCompletionTime: number, color: PieceColor): void;

  killPlayer(playerIndex: number): void;

  setRespawnPreview(respawnPreviewSquare: Square, respawnPiece: Piece): void;

  respawnPlayer(
    playerIndex: number,
    row: number,
    column: number,
    piece: Piece
  ): void;

  promotePlayer(playerIndex: number, promotionPiece: Piece): void;
}

export interface GraveYardComponent {
  addPiece(piece: Piece, respawnCompletionTime: number): void;

  setPovColor(povColor: PieceColor): void;

  clear(): void;
}

export interface DeathScreenComponent {
  show(respawnTimer: number): void;

  hide(): void;
}

export interface PromotionScreenComponent {
  show(move: Move, color: PieceColor): void;

  hide(): void;
}

export interface PlayerListComponent {
  setPlayers(players: User[]): void;
}
