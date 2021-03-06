import Peer from "peerjs";

import { Move } from "../game_flow_util/game_elements";
import {
  Event,
  reviver,
  Request,
  replacer,
  RequestType,
  RequestInfo,
  PEERJS_SERVER_IP,
  PEERJS_SERVER_PORT,
  OptionalConnectionCallbacks,
  PEERJS_SERVER_PATH,
} from "../game_flow_util/communication";
import { User } from "../database/database_util";

const MAX_CONNECTION_TRIES = 20;
// in millis
let DELAY_BETWEEN_TRIES = Math.random() * 500 + 500;

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
  playerIndex: number = null as any;

  constructor(private observer: GameClientObserver, private user: User) {}

  // returns whether or not the connection was successfull
  async attemptToConnect(
    gameID: string,
    serverIndex: number,
    optionalConnectionCallbacks: OptionalConnectionCallbacks
  ) {
    this.clientPeer = new Peer(`${gameID}_client_${this.user.id}`, {
      host: PEERJS_SERVER_IP,
      port: PEERJS_SERVER_PORT,
      path: PEERJS_SERVER_PATH,
    });
    let numOfTries: number = 0;
    let requestInterval = setInterval(() => {
      this.serverConnection = this.clientPeer.connect(
        `${gameID}_server_${serverIndex}`
      );
      if (this.serverConnection !== undefined) {
        this.serverConnection.on("open", () => {
          clearInterval(requestInterval);
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
          // when disconnected from server
          this.serverConnection.on("close", () => {
            this.observer.notify(
              ClientNotificationType.disconnectedFromServer,
              new Map<ClientNotificationInfo, any>()
            );
          });
          // request connection
          this.serverConnection.send(
            JSON.stringify(
              {
                type: RequestType.connection,
                info: new Map<RequestInfo, string>([
                  [RequestInfo.user, JSON.stringify(this.user)],
                ]),
              },
              replacer
            )
          );
          if (optionalConnectionCallbacks.onSuccess !== undefined) {
            optionalConnectionCallbacks.onSuccess();
          }
        });
        numOfTries++;
        if (numOfTries >= MAX_CONNECTION_TRIES) {
          clearInterval(requestInterval);
          if (optionalConnectionCallbacks.onFailure !== undefined) {
            optionalConnectionCallbacks.onFailure();
          }
        }
      }
    }, DELAY_BETWEEN_TRIES);
  }

  destroyConenction(): void {
    if (this.clientPeer != null) {
      this.clientPeer.destroy();
    }
  }

  private sendRequest(request: Request): void {
    if (this.playerIndex != null) {
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
