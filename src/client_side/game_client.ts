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
} from "../game_flow_util/communication";
import Peer from "peerjs";

const PEER_JS_SERVER_PORT = 3030;
const MAX_CONNECTION_TRIES = 20;

export enum ClientNotificationType {
  disconnectedFromServer,
  receivedEvent,
}

export enum ClientNotificationInfo {
  event,
}

export interface ClientObserver {
  notify(
    notification: ClientNotificationType,
    notificationInfo: Map<ClientNotificationInfo, any>
  ): void;
}

export enum ConnectionStatus {
  success,
  failure,
}

export class GameClient {
  private clientPeer: any = null;
  private serverConnection: any = null;
  gameStatus: GameStatus = GameStatus.inactive;
  playerIndex: number = null as any;

  constructor(private observer: ClientObserver, private playerID: string) {}

  async attemptToConnect(ip: string): Promise<ConnectionStatus> {
    if (this.gameStatus === GameStatus.inactive) {
      this.clientPeer = new Peer(this.playerID, {
        host: ip,
        port: PEER_JS_SERVER_PORT,
        path: "/myapp",
      });
      let didConnect: boolean = false;
      let clientIndex: number = parseInt(this.playerID.slice(2));
      for (let i = 0; i < MAX_CONNECTION_TRIES; i++) {
        this.serverConnection = this.clientPeer.connect(
          `server_${clientIndex}`
        );
        if (this.serverConnection != undefined) {
          this.serverConnection.on("open", () => {
            didConnect = true;
            this.serverConnection.send("connected");
          });
        }
        await new Promise((f) => setTimeout(f, 500));
        if (didConnect) {
          this.serverConnection.on("data", (eventData: any) => {
            let event: Event = JSON.parse(eventData.toString(), reviver);
            this.observer.notify(
              ClientNotificationType.receivedEvent,
              new Map<ClientNotificationInfo, any>([
                [ClientNotificationInfo.event, event],
              ])
            );
          });
          return ConnectionStatus.success;
        }
      }
    }
    return ConnectionStatus.failure;
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
