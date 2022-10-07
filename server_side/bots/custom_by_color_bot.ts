import { User } from "../../src/communication/communication_util";
import {
  PieceColor,
  PieceType,
  Position,
} from "../../src/game_flow_util/game_elements";
import { GameMechanicsEngine } from "../flow/game_mechanics_engine";
import { AI } from "./base_bot";
import { CustomByPlayerIndexBot } from "./custom_by_player_index_bot";

export class CustomByColorBot extends CustomByPlayerIndexBot {
  constructor(
    user: User,
    mechanicsEngine: GameMechanicsEngine,
    aiSelection: Map<PieceColor, AI>
  ) {
    let aiSelectionByPlayerIndex: Map<number, AI> = new Map();
    for (let color of aiSelection.keys()) {
      let ai: AI = aiSelection.get(color) as AI;
      for (let playerIndex of Position.getPlayerIndicesByColor(color)) {
        aiSelectionByPlayerIndex.set(playerIndex, ai);
      }
    }
    super(user, mechanicsEngine, aiSelectionByPlayerIndex);
  }
}
