import { BaseBot } from "./base_bot";
import { PieceType, Move } from "../game_flow_util/game_elements";

// in seconds
const MOVE_INTERVAL: number = 1;

export class TestBot extends BaseBot {
  private playerIndex: number = null as any;

  private isOut: boolean = false;

  protected onRoleAssignment(playerIndex: number): void {
    this.playerIndex = playerIndex;
  }

  protected onGameStart(initialCooldown: number) {
    switch (this.playerIndex) {
      case 20: {
        this.playMove(new Move(5, 4));
        break;
      }
      case 29: {
        setInterval(() => {
          if (this.isOut) {
            this.playMove(new Move(7, 5));
            this.isOut = false;
          } else {
            this.playMove(new Move(2, 0));
            this.isOut = true;
          }
        }, MOVE_INTERVAL * 1000);
        break;
      }
    }
  }
}
