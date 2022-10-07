import { BaseBot } from "./base_bot";
import {
  PieceType,
  Move,
  PieceColor,
} from "../../src/game_flow_util/game_elements";

const PROMOTION_TYPES: PieceType[] = [
  PieceType.knight,
  PieceType.bishop,
  PieceType.rook,
  PieceType.queen,
];

export class TestBot extends BaseBot {}
