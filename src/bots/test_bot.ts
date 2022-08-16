import { BaseBot } from "./base_bot";
import { Move, Square } from "../game_flow_util/game_elements";

// in seconds
const MOVE_INTERVAL: number = 2;

export class TestBot extends BaseBot {
  private playerIndex: number = null as any;

  private isOut: boolean = false;

  protected onRoleAssignment(playerIndex: number): void {
    this.playerIndex = playerIndex;
  }

  protected onGameStart(initialCooldown: number) {
    switch (this.playerIndex) {
      case 25: {
        setInterval(() => {
          if (this.isOut) {
            this.playMove(new Move(7, 1));
            this.isOut = false;
          } else {
            this.playMove(new Move(5, 2));
            this.isOut = true;
          }
        }, MOVE_INTERVAL * 1000);
        break;
      }
    }
  }

  protected onMoveReceived(
    movingPlayerIndex: number,
    destSquare: Square,
    cooldown: number
  ): void {
    if (movingPlayerIndex === 21) {
      setTimeout(() => this.playMove(new Move(5, 5)), 3 * 1000);
    }
  }
}
