import Peer from "peerjs";

import { Move, NUM_OF_PLAYERS } from "../game_flow_util/game_elements";
import {
  Event,
  GameStatus,
  reviver,
  EventInfo,
  Request,
  replacer,
  RequestType,
  RequestInfo,
  EventType,
  PEERJS_SERVER_IP,
  PEERJS_SERVER_PORT,
} from "../game_flow_util/communication";
import { Authentication } from "../database/authentication";
import { User } from "../database/database_util";

const MAX_CONNECTION_TRIES = 20;
// in millis
const DELAY_BETWEEN_TRIES = 500;

export enum ClientNotificationType {
  disconnectedFromServer,
  receivedEvent,
}

export enum ClientNotificationInfo {
  event,
}

export interface GameClientObserver {
  notify(
    notification: ClientNotificationType,
    notificationInfo: Map<ClientNotificationInfo, any>
  ): void;
}


export class GameClient {
  private clientPeer: any = null;
  private serverConnection: any = null;
  gameStatus: GameStatus = GameStatus.inactive;
  playerIndex: number = null as any;

  constructor(private observer: GameClientObserver, private user: User) {}

  // returns whether or not the connection was successfull
  async attemptToConnect(
    gameID: string,
    serverIndex: number
  ): Promise<boolean> {
    if (this.gameStatus === GameStatus.inactive) {
      this.clientPeer = new Peer(`${gameID}_client_${this.user.id}`, {
        host: PEERJS_SERVER_IP,
        port: PEERJS_SERVER_PORT,
        path: "/myapp",
      });
      let didConnect: boolean = false;
      for (let i = 0; i < MAX_CONNECTION_TRIES; i++) {
        this.serverConnection = this.clientPeer.connect(
          `${gameID}_server_${serverIndex}`
        );
        if (this.serverConnection != undefined) {
          this.serverConnection.on("open", () => {
            didConnect = true;
          });
        }
        await new Promise((f) => setTimeout(f, DELAY_BETWEEN_TRIES));
        if (didConnect) {
          // listen for events
          this.serverConnection.on("data", (eventData: any) => {
            let event: Event = JSON.parse(eventData.toString(), reviver);
            this.observer.notify(
              ClientNotificationType.receivedEvent,
              new Map<ClientNotificationInfo, any>([
                [ClientNotificationInfo.event, event],
              ])
            );
          });
          // request connection
          this.serverConnection.send(
            JSON.stringify(
              {
                type: RequestType.connection,
                info: new Map<RequestInfo, string>([
                  [
                    RequestInfo.user,
                    JSON.stringify(this.user),
                  ],
                ]),
              },
              replacer
            )
          );
          // when disconnected from server
          this.serverConnection.on("close", () => {
            this.observer.notify(
              ClientNotificationType.disconnectedFromServer,
              new Map<ClientNotificationInfo, any>()
            );
          });
          return true;
        }
      }
    }
    return false;
  }

  destroyConenction(): void {
    if (this.clientPeer != null) {
      this.clientPeer.destroy();
    }
  }

  private sendRequest(request: Request): void {
    if (this.gameStatus === GameStatus.running && this.playerIndex != null) {
      this.serverConnection.send(JSON.stringify(request, replacer));
    }
  }

  sendMove(move: Move): void {
    this.sendRequest({
      type: RequestType.move,
      info: new Map<RequestInfo, string>([
        [RequestInfo.move, JSON.stringify(move, replacer)],
      ]),
    });
  }
}
