import {
  ClientFlowEngine,
  ClientFlowEngineObserver,
  ClientEventType,
  ClientEventInfo,
} from "../client_side/client_flow_engine";
import { Move, Square, Piece, Position } from "../game_flow_util/game_elements";
import { User } from "../database/database_util";
import { OptionalConnectionCallbacks } from "../game_flow_util/communication";

export class BaseBot implements ClientFlowEngineObserver {
  private clientFlowEngine: ClientFlowEngine = null as any;

  constructor(user: User) {
    this.clientFlowEngine = new ClientFlowEngine(user);
    this.clientFlowEngine.addObserver(this);
  }

  // returns whether or not the connection was successfull
  attemptToConnect(
    gameID: string,
    serverIndex: number,
    optionalConnectionCallbacks: OptionalConnectionCallbacks
  ) {
    this.clientFlowEngine.attemptToConnect(
      gameID,
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

  protected onPlayerListUpdate(playerList: User[]): void {}

  protected onGameStart(playerIndex: number, initialCooldown: number): void {}

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
      case ClientEventType.gameStarted: {
        this.onGameStart(
          info.get(ClientEventInfo.playerIndex),
          info.get(ClientEventInfo.initialCooldown)
        );
        break;
      }
      case ClientEventType.move: {
        this.onMoveReceived(
          info.get(ClientEventInfo.movingPlayerIndex),
          info.get(ClientEventInfo.destSquare),
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
