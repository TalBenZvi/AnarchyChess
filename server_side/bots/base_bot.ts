import {
  Move,
  Square,
  Piece,
  Position,
  PieceColor,
} from "../../src/game_flow_util/game_elements";
import { User } from "../../src/communication/communication_util.js";

import {
  GameMechanicsEngine,
  MechanicsEngineNotificationInfo,
  MechanicsEngineNotificationType,
  MechanicsEngineObserver,
} from "../flow/game_mechanics_engine";
import { BaseAI } from "../AIs/base_ai";

export interface GameChannel {
  getPosition(): Position;

  playMove(move: Move): void;
}

export interface AI {
  setGameChannel(gameChannel: GameChannel): void;

  onGameStart(playerIndex: number, initialCooldown: number): void;

  onGameEnd(winningColor: PieceColor): void;

  onReturnToLobby(): void;

  onMove(
    playerIndex: number,
    move: Move,
    respawnTimer: number | undefined,
    enPassantRespawnTimer: number | undefined,
    cooldown: number
  ): void;

  onRespawn(playerIndex: number, respawnSquare: Square): void;
}

export class BaseBot implements MechanicsEngineObserver {
  private ai: AI = null as any;

  constructor(
    private _user: User,
    private mechanicsEngine: GameMechanicsEngine
  ) {
    this.setAI(new BaseAI());
  }

  get user(): User {
    return this._user;
  }

  protected setAI(ai: AI) {
    this.ai = ai;
    this.ai.setGameChannel({
      getPosition: () => this.mechanicsEngine.getPosition(),
      playMove: (move: Move) =>
        this.mechanicsEngine.handleMoveRequest(move, this._user.id),
    });
  }

  protected onGameStart(playerIndex: number, initialCooldown: number) {}

  protected onGameEnd(winningColor: PieceColor) {}

  protected onReturnToLobby() {}

  protected onMove(
    playerIndex: number,
    move: Move,
    respawnTimer: number | undefined,
    enPassantRespawnTimer: number | undefined,
    cooldown: number
  ) {}

  protected onRespawn(playerIndex: number, respawnSquare: Square) {}

  notify(
    eventType: MechanicsEngineNotificationType,
    info: Map<MechanicsEngineNotificationInfo, any>
  ): void {
    switch (eventType) {
      case MechanicsEngineNotificationType.gameStarted:
        {
          let playerIndex: number = info
            .get(MechanicsEngineNotificationInfo.roleAssignemnts)
            .get(this._user.id);
          this.onGameStart(
            playerIndex,
            info.get(MechanicsEngineNotificationInfo.initialPlayerCooldowns)[
              playerIndex
            ]
          );
          this.ai.onGameStart(
            playerIndex,
            info.get(MechanicsEngineNotificationInfo.initialPlayerCooldowns)[
              playerIndex
            ]
          );
        }
        break;
      case MechanicsEngineNotificationType.gameEnded:
        {
          this.onGameEnd(
            info.get(MechanicsEngineNotificationInfo.winningColor)
          );
          this.ai.onGameEnd(
            info.get(MechanicsEngineNotificationInfo.winningColor)
          );
        }
        break;
      case MechanicsEngineNotificationType.returningToLobby:
        {
          this.onReturnToLobby();
          this.ai.onReturnToLobby();
        }
        break;
      case MechanicsEngineNotificationType.move:
        {
          this.onMove(
            info.get(MechanicsEngineNotificationInfo.playerIndex),
            info.get(MechanicsEngineNotificationInfo.move),
            info.get(MechanicsEngineNotificationInfo.respawnTimer),
            info.get(MechanicsEngineNotificationInfo.enPassantRespawnTimer),
            info.get(MechanicsEngineNotificationInfo.cooldown)
          );
          this.ai.onMove(
            info.get(MechanicsEngineNotificationInfo.playerIndex),
            info.get(MechanicsEngineNotificationInfo.move),
            info.get(MechanicsEngineNotificationInfo.respawnTimer),
            info.get(MechanicsEngineNotificationInfo.enPassantRespawnTimer),
            info.get(MechanicsEngineNotificationInfo.cooldown)
          );
        }
        break;
      case MechanicsEngineNotificationType.respawn:
        {
          this.onRespawn(
            info.get(MechanicsEngineNotificationInfo.playerIndex),
            info.get(MechanicsEngineNotificationInfo.respawnSquare)
          );
          this.ai.onRespawn(
            info.get(MechanicsEngineNotificationInfo.playerIndex),
            info.get(MechanicsEngineNotificationInfo.respawnSquare)
          );
        }
        break;
    }
  }
}
