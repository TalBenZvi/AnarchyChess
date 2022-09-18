import {
  ClientFlowEngine,
  ClientFlowEngineObserver,
  ClientEventType,
  ClientEventInfo,
} from "../client_side/client_flow_engine";
import {
  Move,
  Square,
  Piece,
  Position,
  PieceColor,
} from "../game_flow_util/game_elements";
import { Lobby } from "../database/database_util";
import { User } from "../communication/communication_util";
import { PlayerList } from "../game_flow_util/player_list";

export class BaseBot implements ClientFlowEngineObserver {
  private clientFlowEngine: ClientFlowEngine = null as any;

  constructor(public user: User) {
    this.clientFlowEngine = new ClientFlowEngine(user);
    this.clientFlowEngine.addObserver(this);
  }

  // returns whether or not the connection was successfull
  attemptToConnect(
    lobby: Lobby,
    serverIndex: number,
    optionalConnectionCallbacks: any
  ) {
    this.clientFlowEngine.attemptToConnect(
      lobby,
      serverIndex,
      optionalConnectionCallbacks
    );
  }

  disconnect() {
    this.clientFlowEngine.destroyConnection();
  }

  protected getPosition(): Position {
    return this.clientFlowEngine.getPosition();
  }

  protected playMove(move: Move): void {
    this.clientFlowEngine.sendMove(move);
  }

  protected onDisconnection(): void {}

  protected onPlayerListUpdate(playerList: PlayerList): void {}

  protected onRoleAssignment(playerIndex: number) {}

  protected onGameStart(initialCooldown: number): void {}

  protected onGameEnd(winningColor: PieceColor): void {}

  protected onReturnToLobby(): void {}

  protected onMoveReceived(
    movingPlayerIndex: number,
    destSquare: Square,
    cooldown: number
  ): void {}

  protected onPromotion(
    promotingPlayerIndex: number,
    promotionPiece: Piece
  ): void {}

  protected onDeath(dyingPlayerIndex: number, deathTimer: number): void {}

  protected onRespawn(
    respawningPlayerIndex: number,
    respawnSquare: Square
  ): void {}

  protected onMoveSent(sentMove: Move): void {}

  notify(eventType: ClientEventType, info: Map<ClientEventInfo, any>): void {
    switch (eventType) {
      case ClientEventType.disconnection: {
        this.onDisconnection();
        break;
      }
      case ClientEventType.playerListUpdate: {
        this.onPlayerListUpdate(info.get(ClientEventInfo.playerList));
        break;
      }
      case ClientEventType.roleAssigned: {
        this.onRoleAssignment(info.get(ClientEventInfo.playerIndex));
        break;
      }
      case ClientEventType.gameStarted: {
        this.onGameStart(info.get(ClientEventInfo.initialCooldown));
        break;
      }
      case ClientEventType.gameEnded: {
        this.onGameEnd(info.get(ClientEventInfo.winningColor));
        break;
      }
      case ClientEventType.returnToLobby: {
        this.onReturnToLobby();
        break;
      }
      case ClientEventType.move: {
        this.onMoveReceived(
          info.get(ClientEventInfo.movingPlayerIndex),
          info.get(ClientEventInfo.move),
          info.get(ClientEventInfo.cooldown)
        );
        break;
      }
      case ClientEventType.promotion: {
        this.onPromotion(
          info.get(ClientEventInfo.promotingPlayerIndex),
          info.get(ClientEventInfo.promotionPiece)
        );
        break;
      }
      case ClientEventType.death: {
        this.onDeath(
          info.get(ClientEventInfo.dyingPlayerIndex),
          info.get(ClientEventInfo.deathTimer)
        );
        break;
      }
      case ClientEventType.respawn: {
        this.onRespawn(
          info.get(ClientEventInfo.respawnSquare),
          info.get(ClientEventInfo.respawnSquare)
        );
        break;
      }
      case ClientEventType.moveSent: {
        this.onMoveSent(info.get(ClientEventInfo.sentMove));
        break;
      }
    }
  }
}
