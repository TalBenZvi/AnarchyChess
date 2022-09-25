import { WebSocket } from "ws";

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
  replacer,
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

export class GameServer implements MechanicsEngineObserver {
  // maps user id to the user's client
  private clients: Map<string, any> = new Map();
  private mechanicsEngine: GameMechanicsEngine = null as any;

  constructor(creator: User, creatorClient: any, private _lobby: Lobby) {
    this.mechanicsEngine = new GameMechanicsEngine(
      this,
      _lobby.areTeamsPrearranged
    );
    this.addClient(creator, creatorClient);
  }

  get lobby(): Lobby {
    return this._lobby;
  }

  private broadcastPlayerListUpdate() {
    this.broadcastGameEvent({
      type: GameEventType.playerListUpdate,
      info: new Map([
        [
          GameEventInfo.playerListJSON,
          this.mechanicsEngine.getPlayerListJSON(),
        ],
      ]),
    });
  }

  // returns whether or not the client was added successfully
  addClient(user: User, client: any): boolean {
    if (this.lobby.capacity < NUM_OF_PLAYERS) {
      this._lobby.capacity++;
      this.mechanicsEngine.addPlayer(user);
      this.broadcastPlayerListUpdate();
      this.clients.set(user.id, client);
      return true;
    }
    return false;
  }

  // returns a list of every user id that was removed from the lobby
  removePlayer(userID: string): string[] {
    if (userID.includes("bot")) {
      // removing a bot
      this.mechanicsEngine.removePlayer(userID);
      this._lobby.capacity--;
      this.broadcastPlayerListUpdate();
      return [];
    } else if (userID === this._lobby.creatorID) {
      // removing the lobby creator
      this.broadcastGameEvent({
        type: GameEventType.disconnectedFromLobby,
        info: new Map(),
      });
      let userIDs: string[] = Array.from(this.clients.keys());
      this.clients.clear();
      return userIDs;
    } else {
      // removing a participant
      this.sendGameEvent(userID, {
        type: GameEventType.disconnectedFromLobby,
        info: new Map(),
      });
      this.mechanicsEngine.removePlayer(userID);
      this.clients.delete(userID);
      this._lobby.capacity--;
      this.broadcastPlayerListUpdate();
      return [userID];
    }
  }

  changePlayerTeam(userID: string) {
    this.mechanicsEngine.changePlayerTeam(userID);
    this.broadcastPlayerListUpdate();
  }

  fillWithBots() {
    this.mechanicsEngine.fillWithBots();
    this._lobby.capacity = NUM_OF_PLAYERS;
    this.broadcastPlayerListUpdate();
  }

  removeAllBots() {
    this.mechanicsEngine.removeAllBots();
    this._lobby.capacity = this.clients.size;
    this.broadcastPlayerListUpdate();
  }

  startGame() {
    this.mechanicsEngine.startGame();
  }

  returnToLobby() {
    this.mechanicsEngine.returnToLobby();
  }

  handleMoveRequest(moveRequest: Move, userID: string) {
    this.mechanicsEngine.handleMoveRequest(moveRequest, userID);
  }

  getPlayerListJSON(): string {
    return this.mechanicsEngine.getPlayerListJSON();
  }

  private sendGameEvent(userID: string, gameEvent: GameEvent) {
    let client = this.clients.get(userID);
    if (client.readyState === WebSocket.OPEN) {
      client.send(
        JSON.stringify(
          {
            type: WSRequestType.inGame,
            info: new Map([[WSResponseInfo.gameEvent, gameEvent]]),
          } as WSResponse,
          replacer
        )
      );
    }
  }

  private broadcastGameEvent(gameEvent: GameEvent) {
    this.clients.forEach((_: any, userID: string) => {
      this.sendGameEvent(userID, gameEvent);
    });
  }

  private onGameStart(
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

  private onReturnToLobby() {
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
          this.onGameStart(
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
          this.onReturnToLobby();
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
