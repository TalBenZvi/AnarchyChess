import {
  PieceColor,
  Move,
  Square,
  Position,
} from "../../src/game_flow_util/game_elements";
import { AI, GameChannel } from "../bots/base_bot";

export class BaseAI implements AI {
  private gameChannel: GameChannel = null as any;

  setGameChannel(gameChannel: GameChannel): void {
    this.gameChannel = gameChannel;
  }

  protected getPosition(): Position {
    return this.gameChannel == null
      ? (null as any)
      : this.gameChannel.getPosition();
  }

  protected playMove(move: Move) {
    if (this.gameChannel !== null) {
      this.gameChannel.playMove(move);
    }
  }

  onGameStart(playerIndex: number, initialCooldown: number): void {}

  onGameEnd(winningColor: PieceColor): void {}

  onReturnToLobby(): void {}

  onMove(
    playerIndex: number,
    move: Move,
    respawnTimer: number,
    enPassantRespawnTimer: number,
    cooldown: number
  ): void {}

  onRespawn(playerIndex: number, respawnSquare: Square): void {}
}
