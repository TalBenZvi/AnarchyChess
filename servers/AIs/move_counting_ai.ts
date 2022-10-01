import { Move, PieceType } from "../../src/game_flow_util/game_elements";
import { BaseAI } from "./base_ai";

const PROMOTION_TYPES: PieceType[] = [
  PieceType.knight,
  PieceType.bishop,
  PieceType.rook,
  PieceType.queen,
];

const MOVES_TO_WAIT: number = 10;

export class MoveCountingAI extends BaseAI {
  private playerIndex: number = null as any;
  private moveCount: number = null as any;

  private playRandomMove = () => {
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
  };

  onGameStart(playerIndex: number, initialCooldown: number) {
    this.playerIndex = playerIndex;
    this.moveCount = Math.floor(Math.random() * MOVES_TO_WAIT);
    this.playRandomMove();
  }

  onMove(
    playerIndex: number,
    move: Move,
    respawnTimer: number,
    enPassantRespawnTimer: number,
    cooldown: number
  ): void {
    this.moveCount++;
    if (this.moveCount === MOVES_TO_WAIT) {
      this.playRandomMove();
      this.moveCount = 0;
    }
  }
}
