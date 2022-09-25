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
} from "../game_mechanics_engine";

export class BaseBot implements MechanicsEngineObserver {
  constructor(
    private _user: User,
    private mechanicsEngine: GameMechanicsEngine
  ) {}

  get user(): User {
    return this._user;
  }

  protected getPosition(): Position {
    return this.mechanicsEngine.getPosition();
  }

  protected playMove(move: Move): void {
    this.mechanicsEngine.handleMoveRequest(move, this._user.id);
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
        }
        break;
      case MechanicsEngineNotificationType.gameEnded:
        {
          this.onGameEnd(
            info.get(MechanicsEngineNotificationInfo.winningColor)
          );
        }
        break;
      case MechanicsEngineNotificationType.returningToLobby:
        {
          this.onReturnToLobby();
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
        }
        break;
      case MechanicsEngineNotificationType.respawn:
        {
          this.onRespawn(
            info.get(MechanicsEngineNotificationInfo.playerIndex),
            info.get(MechanicsEngineNotificationInfo.respawnSquare)
          );
        }
        break;
    }
  }
}
