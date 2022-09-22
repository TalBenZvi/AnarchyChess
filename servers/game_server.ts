import { Move, NUM_OF_PLAYERS } from "../src/game_flow_util/game_elements.js";
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
    this.clients.forEach((client: any, userID: string) => {
      this.sendGameEvent(userID, gameEvent);
    });
  }

  private startGame(
    roleAssignemnts: Map<string, number>,
    initialPlayerCooldowns: number[]
  ) {
    this.clients.forEach((client: any, userID: string) => {
      let playerIndex = roleAssignemnts.get(userID);
      this.sendGameEvent(userID, {
        type: GameEventType.gameStarted,
        info: new Map([
          [GameEventInfo.playerIndex, playerIndex],
          [GameEventInfo.initialCooldown, initialPlayerCooldowns[playerIndex]],
        ]),
      } as GameEvent);
    });
  }

  notify(
    notification: MechanicsEngineNotificationType,
    notificationInfo: Map<MechanicsEngineNotificationInfo, any>
  ): void {
    switch (notification) {
      case MechanicsEngineNotificationType.gameStarted: {
        let roleAssignemnts: Map<string, number> = notificationInfo.get(
          MechanicsEngineNotificationInfo.roleAssignemnts
        );
        let initialPlayerCooldowns: number[] = notificationInfo.get(
          MechanicsEngineNotificationInfo.initialPlayerCooldowns
        );
        this.startGame(roleAssignemnts, initialPlayerCooldowns);
      }
    }
  }
}
