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

const CHANCE_TO_PLAY_MOVE_ON_START: number = 0.5;
const CHANCE_TO_PLAY_MOVE: number = 0.05;

export class ChanceToPlayBot extends BaseBot {
  private playerIndex: number = null as any;

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

  protected onGameStart(playerIndex: number, initialCooldown: number) {
    this.playerIndex = playerIndex;
    if (Math.random() < CHANCE_TO_PLAY_MOVE_ON_START) {
      this.playRandomMove();
    }
  }

  protected onMove(
    playerIndex: number,
    move: Move,
    respawnTimer: number,
    enPassantRespawnTimer: number,
    cooldown: number
  ): void {
    if (Math.random() < CHANCE_TO_PLAY_MOVE) {
      this.playRandomMove();
    }
  }
}
