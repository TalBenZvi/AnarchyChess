import { User } from "../../src/communication/communication_util";
import { PieceType, Position } from "../../src/game_flow_util/game_elements";
import { GameMechanicsEngine } from "../flow/game_mechanics_engine";
import { AI } from "./base_bot";
import { CustomByPlayerIndexBot } from "./custom_by_player_index_bot";

export class CustomByPieceTypeBot extends CustomByPlayerIndexBot {
  constructor(
    user: User,
    mechanicsEngine: GameMechanicsEngine,
    aiSelection: Map<PieceType, AI>
  ) {
    let aiSelectionByPlayerIndex: Map<number, AI> = new Map();
    for (let type of aiSelection.keys()) {
      let ai: AI = aiSelection.get(type) as AI;
      for (let playerIndex of Position.getPlayerIndicesByPieceType(type)) {
        aiSelectionByPlayerIndex.set(playerIndex, ai);
      }
    }
    super(user, mechanicsEngine, aiSelectionByPlayerIndex);
  }
}
