import { shuffle } from "../../src/communication/communication_util.js";
import {
  Move,
  Position,
  reverseColor,
} from "../../src/game_flow_util/game_elements.js";
import { BaseAI } from "./base_ai.js";

export class ThreatAvoidingAI extends BaseAI {
  private playerIndex: number = null as any;

  onGameStart(playerIndex: number, initialCooldown: number): void {
    this.playerIndex = playerIndex;
  }

  onMove(
    playerIndex: number,
    move: Move,
    respawnTimer: number,
    enPassantRespawnTimer: number,
    cooldown: number
  ): void {
    if (this.playerIndex !== null) {
      let position: Position = this.getPosition();
      if (position.isPlayerUnderThreat(this.playerIndex)) {
        let availableMoves: Move[] = position.findAvaillableMovesForPlayer(
          this.playerIndex
        );
        shuffle(availableMoves);
        if (this.playerIndex === 16) {
          console.log(JSON.stringify(availableMoves));
        }
        for (let move of availableMoves) {
          if (
            !position.isSquareUnderThreat(
              move.row,
              move.column,
              reverseColor(Position.getColorByPlayer(this.playerIndex))
            )
          ) {
            this.playMove(move);
            break;
          }
        }
      }
    }
  }
}
