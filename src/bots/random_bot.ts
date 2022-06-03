import { BaseBot } from "./base_bot";
import { PieceType, Move } from "../game_flow_util/game_elements";

const PROMOTION_TYPES: PieceType[] = [
  PieceType.knight,
  PieceType.bishop,
  PieceType.rook,
  PieceType.queen,
];
// in seconds
const MOVE_INTERVAL: number = 2;

export class RandomBot extends BaseBot {
  private playerIndex: number = null as any;

  protected onRoleAssignment(playerIndex: number): void {
    this.playerIndex = playerIndex;
  }

  protected onGameStart(initialCooldown: number) {
    setInterval(() => {
      let position = this.getPosition();
      let availableMoves: Move[] = position.findAvaillableMovesForPlayer(
        this.playerIndex
      );
      if (availableMoves.length !== 0) {
        let chosenMove: Move =
          availableMoves[Math.floor(Math.random() * availableMoves.length)];
        if (chosenMove.isPromotion) {
          chosenMove.promotionType =
            PROMOTION_TYPES[Math.floor(Math.random() * PROMOTION_TYPES.length)];
        }
        this.playMove(chosenMove);
      }
    }, MOVE_INTERVAL * 1000);
  }
}
