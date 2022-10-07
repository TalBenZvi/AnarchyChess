import { User } from "../../src/communication/communication_util";
import { BaseAI } from "../AIs/base_ai";
import { GameMechanicsEngine } from "../flow/game_mechanics_engine";
import { AI, BaseBot } from "./base_bot";

export class CustomByPlayerIndexBot extends BaseBot {
  constructor(
    user: User,
    mechanicsEngine: GameMechanicsEngine,
    private aiSelection: Map<number, AI>
  ) {
    super(user, mechanicsEngine);
  }

  protected onGameStart(playerIndex: number, initialCooldown: number): void {
    if (this.aiSelection.has(playerIndex)) {
      this.setAI(this.aiSelection.get(playerIndex) as AI);
    } else {
      this.setAI(new BaseAI());
    }
  }
}
