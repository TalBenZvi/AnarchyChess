import {
  Move,
  NUM_OF_PLAYERS,
  PieceColor,
  Square,
} from "../src/game_flow_util/game_elements.js";
import {
  GameEvent,
  GameEventInfo,
  GameEventType,
  Lobby,
  User,
  WSRequestType,
  WSResponse,
  WSResponseInfo,
} from "../src/communication/communication_util.js";
import {
  GameMechanicsEngine,
  MechanicsEngineNotificationInfo,
  MechanicsEngineNotificationType,
  MechanicsEngineObserver,
} from "./game_mechanics_engine.js";

const CREATOR_CLIENT_INDEX: number = 0;

export class GameServer implements MechanicsEngineObserver {
  // maps user id to the user's client
  private clients: Map<string, any> = new Map();
  private engine: GameMechanicsEngine = new GameMechanicsEngine(this);

  constructor(creatorID: string, creatorClient: any, private lobby: Lobby) {
    this.clients.set(creatorID, creatorClient);
  }


  // returns whether or not the client was added successfully
  addClient(userID: string, client: any): boolean {
    if (this.clients.size < NUM_OF_PLAYERS) {
      this.clients.set(userID, client);
      this.lobby.capacity++;
      return true;
    }
    return false;
  }

  handleMoveRequest(moveRequest: Move, userID: string) {
    this.engine.handleMoveRequest(moveRequest, userID);
  }

  private sendGameEvent(userID: string, gameEvent: GameEvent) {
    this.clients.get(userID).send(
      JSON.stringify({
        type: WSRequestType.inGame,
        info: new Map([[WSResponseInfo.gameEvent, gameEvent]]),
      } as WSResponse)
    );
  }

  private broadcastGameEvent(gameEvent: GameEvent) {
    this.clients.forEach((_: any, userID: string) => {
      this.sendGameEvent(userID, gameEvent);
    });
  }

  private startGame(
    roleAssignemnts: Map<string, number>,
    initialPlayerCooldowns: number[]
  ) {
    this.clients.forEach((_: any, userID: string) => {
      let playerIndex = roleAssignemnts.get(userID) as number;
      this.sendGameEvent(userID, {
        type: GameEventType.gameStarted,
        info: new Map([
          [GameEventInfo.playerIndex, playerIndex],
          [GameEventInfo.initialCooldown, initialPlayerCooldowns[playerIndex]],
        ]),
      } as GameEvent);
    });
  }

  private endGame(winningColor: PieceColor) {
    this.broadcastGameEvent({
      type: GameEventType.gameEnded,
      info: new Map([[GameEventInfo.winningColor, winningColor]]),
    } as GameEvent);
  }

  private returnToLobby() {
    this.broadcastGameEvent({
      type: GameEventType.returnToLobby,
      info: new Map(),
    } as GameEvent);
  }

  private broacastMove(
    playerIndex: number,
    move: Move,
    respawnTimer: number | undefined,
    enPassantRespawnTimer: number | undefined,
    cooldown: number
  ) {
    let gameEventInfo: Map<GameEventInfo, any> = new Map([
      [GameEventInfo.playerIndex, playerIndex as any],
      [GameEventInfo.move, move as any],
      [GameEventInfo.cooldown, cooldown as any],
    ]);
    if (respawnTimer !== undefined) {
      gameEventInfo.set(GameEventInfo.respawnTimer, respawnTimer as any);
    }
    if (enPassantRespawnTimer !== undefined) {
      gameEventInfo.set(
        GameEventInfo.enPassantRespawnTimer,
        enPassantRespawnTimer as any
      );
    }
    this.broadcastGameEvent({
      type: GameEventType.move,
      info: gameEventInfo,
    } as GameEvent);
  }

  private broadcastRespawn(playerIndex: number, respawnSquare: Square) {
    this.broadcastGameEvent({
      type: GameEventType.respawn,
      info: new Map([
        [GameEventInfo.playerIndex, playerIndex as any],
        [GameEventInfo.respawnSquare, respawnSquare as any],
      ]),
    } as GameEvent);
  }

  notify(
    notification: MechanicsEngineNotificationType,
    notificationInfo: Map<MechanicsEngineNotificationInfo, any>
  ): void {
    switch (notification) {
      case MechanicsEngineNotificationType.gameStarted:
        {
          this.startGame(
            notificationInfo.get(
              MechanicsEngineNotificationInfo.roleAssignemnts
            ),
            notificationInfo.get(
              MechanicsEngineNotificationInfo.initialPlayerCooldowns
            )
          );
        }
        break;
      case MechanicsEngineNotificationType.gameEnded:
        {
          this.endGame(
            notificationInfo.get(MechanicsEngineNotificationInfo.winningColor)
          );
        }
        break;
      case MechanicsEngineNotificationType.returningToLobby:
        {
          this.returnToLobby();
        }
        break;
      case MechanicsEngineNotificationType.move:
        {
          this.broacastMove(
            notificationInfo.get(MechanicsEngineNotificationInfo.playerIndex),
            notificationInfo.get(MechanicsEngineNotificationInfo.move),
            notificationInfo.get(MechanicsEngineNotificationInfo.respawnTimer),
            notificationInfo.get(
              MechanicsEngineNotificationInfo.enPassantRespawnTimer
            ),
            notificationInfo.get(MechanicsEngineNotificationInfo.cooldown)
          );
        }
        break;
      case MechanicsEngineNotificationType.respawn:
        {
          this.broadcastRespawn(
            notificationInfo.get(MechanicsEngineNotificationInfo.playerIndex),
            notificationInfo.get(MechanicsEngineNotificationInfo.respawnSquare)
          );
        }
        break;
    }
  }
}
