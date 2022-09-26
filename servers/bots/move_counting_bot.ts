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

const MOVES_TO_WAIT: number = 10;

export class MoveCountingBot extends BaseBot {
  private playerIndex: number = null as any;
  private moveCount: number = null as any;

  private playRandomMove = () => {
    if (this.playerIndex !== 4 && this.playerIndex !== 28) {
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
    }
  };

  protected onGameStart(playerIndex: number, initialCooldown: number) {
    this.playerIndex = playerIndex;
    this.moveCount = Math.floor(Math.random() * MOVES_TO_WAIT);
    this.playRandomMove();
    // if (this.moveCount === 0) {
    //     this.playRandomMove();
    // }
  }

  protected onMove(
    playerIndex: number,
    move: Move,
    respawnTimer: number,
    enPassantRespawnTimer: number,
    cooldown: number
  ): void {
    this.moveCount = (this.moveCount + 1) % MOVES_TO_WAIT;
    if (this.moveCount === 0) {
      this.playRandomMove();
    }
  }
}
