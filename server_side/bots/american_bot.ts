import { User } from "../../src/communication/communication_util";
import { PieceType } from "../../src/game_flow_util/game_elements";
import { BaseAI } from "../AIs/base_ai";
import { MoveCountingAI } from "../AIs/move_counting_ai";
import { GameMechanicsEngine } from "../flow/game_mechanics_engine";
import { AI } from "./base_bot";
import { CustomByPieceTypeBot } from "./custom_by_piece_type_bot";

// king does nothing, every other piece moves around randomly
export class AmericanBot extends CustomByPieceTypeBot {
  constructor(user: User, mechanicsEngine: GameMechanicsEngine) {
    let moveCountingAI = new MoveCountingAI();
    let baseAI = new BaseAI();
    super(
      user,
      mechanicsEngine,
      new Map([
        [PieceType.pawn, moveCountingAI],
        [PieceType.knight, moveCountingAI],
        [PieceType.bishop, moveCountingAI],
        [PieceType.rook, moveCountingAI],
        [PieceType.queen, moveCountingAI],
        [PieceType.king, baseAI as AI],
      ])
    );
  }
}
