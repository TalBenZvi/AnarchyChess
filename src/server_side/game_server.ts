import { NUM_OF_PLAYERS, Move } from "../game_flow_util/game_elements";
import {
  Event,
  EventInfo,
  EventType,
  GameStatus,
  replacer,
  reviver,
  Request,
  PEERJS_SERVER_IP,
  PEERJS_SERVER_PORT,
} from "../game_flow_util/communication";
import Peer from "peerjs";

export enum ServerNotificationType {
  playerConnected,
  playerDisconnected,
  receivedRequest,
}

export enum ServerNotificationInfo {
  // general
  userIndex,
  // receivedRequest
  request,
}

export interface ServerObserver {
  notify(
    notification: ServerNotificationType,
    notificationInfo: Map<ServerNotificationInfo, any>
  ): void;
}

export class GameServer {
  private serverPeers: any[] = [...Array(NUM_OF_PLAYERS)].fill(null);
  private clients: any[] = [...Array(NUM_OF_PLAYERS)].fill(null);
  private gameStatus: GameStatus = GameStatus.inactive;
  private broadcastedEventsLog: Event[] = [];

  constructor(private observer: ServerObserver) {}

  acceptConnections(gameID: string): void {
    if (this.gameStatus === GameStatus.inactive) {
      this.broadcastedEventsLog = [];
      this.gameStatus = GameStatus.waitingForPlayers;
      for (let i = 0; i < NUM_OF_PLAYERS; i++) {
        this.serverPeers[i] = new Peer(`${gameID}_server_${i}`, {
          host: PEERJS_SERVER_IP,
          port: PEERJS_SERVER_PORT,
          path: "/myapp",
        });
        // listen for connections
        this.serverPeers[i].on("connection", (client: any) => {
          this.clients[i] = client;
          client.on("data", (requestData: any) => {
            let request: Request = JSON.parse(requestData.toString(), reviver);
            this.observer.notify(
              ServerNotificationType.receivedRequest,
              new Map<ServerNotificationInfo, any>([
                [ServerNotificationInfo.userIndex, i],
                [ServerNotificationInfo.request, request],
              ])
            );
          });
          // when client disconnects
          client.on("close", () => {
            this.observer.notify(
              ServerNotificationType.playerDisconnected,
              new Map<ServerNotificationInfo, any>([
                [ServerNotificationInfo.userIndex, i],
              ])
            );
          });
        });
      }
      console.log("all servers connected");
    }
  }

  disconnectFromUser(userIndex: number) {
    this.clients[userIndex].close();
  }

  destroyConenctions(): void {
    for (let serverPeer of this.serverPeers) {
      if (serverPeer != null) {
        serverPeer.destroy();
      }
    }
  }

  startGame(roleAssignemnts: number[], initialPlayerCooldowns: number[]): void {
    if (this.gameStatus === GameStatus.waitingForPlayers) {
      this.gameStatus = GameStatus.running;
      console.log("game started");
      if (this.clients.length >= NUM_OF_PLAYERS) {
        this.clients = this.clients.slice(0, NUM_OF_PLAYERS);
        for (let i = 0; i < this.clients.length; i++) {
          this.sendEvent(
            {
              index: null as any,
              type: EventType.gameStarted,
              info: new Map<EventInfo, string>([
                [EventInfo.playerIndex, roleAssignemnts[i].toString()],
                [
                  EventInfo.initialCooldown,
                  initialPlayerCooldowns[i].toString(),
                ],
              ]),
            },
            i
          );
        }
      }
    }
  }

  private sendEvent(event: Event, playerIndex: number) {
    if (this.clients[playerIndex] != null) {
      this.clients[playerIndex].send(JSON.stringify(event, replacer));
    }
  }

  broadcastEvent(event: Event): void {
    event.index = this.broadcastedEventsLog.length;
    this.broadcastedEventsLog.push(event);
    for (let i = 0; i < this.clients.length; i++) {
      this.sendEvent(event, i);
    }
  }
}
