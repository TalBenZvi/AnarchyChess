import { User } from "../../src/communication/communication_util";
import { GameMechanicsEngine } from "../flow/game_mechanics_engine";
import { AI, BaseBot } from "./base_bot";

export class CustomBot extends BaseBot {
  constructor(user: User, mechanicsEngine: GameMechanicsEngine, ai: AI) {
    super(user, mechanicsEngine);
    this.setAI(ai);
  }
}
