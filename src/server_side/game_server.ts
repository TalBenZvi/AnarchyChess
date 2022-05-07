import { NUM_OF_PLAYERS, Move } from "../game_flow_util/game_elements";
import {
  Event,
  EventInfo,
  EventType,
  GameStatus,
  replacer,
  reviver,
  Request,
  RequestType,
  RequestInfo,
} from "../game_flow_util/communication";
import Peer from "peerjs";

const PEER_JS_SERVER_PORT = 3030;

export enum ServerNotificationType {
  filledServer,
  receivedRequest,
}

export enum ServerNotificationInfo {
  playerIndex,
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
  private clients: any[] = [];
  private isClientConnectedArray: boolean[] = [...Array(NUM_OF_PLAYERS)].fill(
    false
  );
  private gameStatus: GameStatus = GameStatus.inactive;
  private broadcastedEventsLog: Event[] = [];

  constructor(private observer: ServerObserver) {}

  // debug
  /*
  private fillWithDummies(numOfDummies: number) {
    this.playerIDs = [...Array(numOfDummies)].map(
      (_, i) => `id${i + NUM_OF_PLAYERS - numOfDummies}`
    );
  }
  */

  // debug
  private assignCustomIndices(customIndices: number[]): Map<string, number> {
    let leftoverIndices: number[] = Array.from(
      Array(NUM_OF_PLAYERS).keys()
    ).filter((i) => customIndices.indexOf(i) <= -1);
    let playerIndices: Map<string, number> = new Map<string, number>();
    for (let i = 0; i < customIndices.length; i++) {
      playerIndices.set(`id${i}`, customIndices[i]);
    }
    for (let i = 0; i < leftoverIndices.length; i++) {
      playerIndices.set(`id${i + customIndices.length}`, leftoverIndices[i]);
    }
    return playerIndices;
  }

  acceptConnections(): void {
    //this.fillWithDummies(NUM_OF_PLAYERS - 16);
    if (this.gameStatus === GameStatus.inactive) {
      this.broadcastedEventsLog = [];
      this.gameStatus = GameStatus.waitingForPlayers;
      for (let i = 0; i < NUM_OF_PLAYERS; i++) {
        this.serverPeers[i] = new Peer(`server_${i}`, {
          host: "localhost",
          port: PEER_JS_SERVER_PORT,
          path: "/myapp",
        });
        this.serverPeers[i].on("connection", (client: any) => {
          this.clients[i] = client;
          client.on("data", (requestData: any) => {
            if (requestData.toString() === "connected") {
              this.isClientConnectedArray[i] = true;
              let areAllClientsConnected = true;
              for (let isClientConnected of this.isClientConnectedArray) {
                if (!isClientConnected) {
                  areAllClientsConnected = false;
                }
              }
              if (areAllClientsConnected) {
                this.observer.notify(
                  ServerNotificationType.filledServer,
                  new Map<ServerNotificationInfo, any>()
                );
              }
            } else {
              let request: Request = JSON.parse(
                requestData.toString(),
                reviver
              );
              this.observer.notify(
                ServerNotificationType.receivedRequest,
                new Map<ServerNotificationInfo, any>([
                  [ServerNotificationInfo.playerIndex, i],
                  [ServerNotificationInfo.request, request],
                ])
              );
            }
          });
        });
      }
      console.log("all servers connected");
    }
  }

  startGame(initialPlayerCooldowns: number[]): void {
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
                [EventInfo.playerIndex, JSON.stringify(i, replacer)],
                [
                  EventInfo.initialCooldown,
                  JSON.stringify(initialPlayerCooldowns[i], replacer),
                ],
              ]),
            },
            i
          );
        }
      }
    }
  }

  sendEvent(event: Event, playerIndex: number) {
    this.clients[playerIndex].send(JSON.stringify(event, replacer));
  }

  broadcastEvent(event: Event): void {
    event.index = this.broadcastedEventsLog.length;
    this.broadcastedEventsLog.push(event);
    for (let i = 0; i < this.clients.length; i++) {
      this.sendEvent(event, i);
    }
  }
}
