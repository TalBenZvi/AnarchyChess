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
import { PlayerList } from "../src/game_flow_util/player_list.js";

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
    if (this.clients.size < NUM_OF_PLAYERS) {
      this._lobby.capacity++;
      this.mechanicsEngine.addPlayer(user);
      this.broadcastPlayerListUpdate();
      this.clients.set(user.id, client);
      return true;
    }
    return false;
  }

  // returns whether or not the lobby was closed
  removePlayer(userID: string): boolean {
    if (userID === this._lobby.creatorID) {
      this.broadcastGameEvent({
        type: GameEventType.disconnectedFromLobby,
        info: new Map(),
      });
      this.clients.clear();
      return true;
    } else {
      this.mechanicsEngine.removePlayer(userID);
      this.clients.delete(userID);
      this._lobby.capacity--;
      this.broadcastPlayerListUpdate();
      return false;
    }
  }

  handleMoveRequest(moveRequest: Move, userID: string) {
    this.mechanicsEngine.handleMoveRequest(moveRequest, userID);
  }

  getPlayerListJSON(): string {
    return this.mechanicsEngine.getPlayerListJSON();
  }

  private sendGameEvent(userID: string, gameEvent: GameEvent) {
    this.clients.get(userID).send(
      JSON.stringify(
        {
          type: WSRequestType.inGame,
          info: new Map([[WSResponseInfo.gameEvent, gameEvent]]),
        } as WSResponse,
        replacer
      )
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
