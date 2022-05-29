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

export interface GraveYardComponent {
  addPiece(piece: Piece, respawnCompletionTime: number): void;

  setPovColor(povColor: PieceColor): void;

  clear(): void;
}

export interface PromotionScreenComponent {
  show(move: Move, color: PieceColor): void;

  hide(): void;
}

export interface PlayerListComponent {
  setPlayers(players: User[]): void;
}
