import { Move } from "../game_flow_util/game_elements";
import { Event } from "../game_flow_util/events";

const Net = require('net');

export enum ClientNotificationType {
  connectedToServer,
  disconnectedFromServer,
  receivedEvents,
}

export enum ClientNotificationInfo {
  events,
}

export interface ClientObserver {
  notify(
    notification: ClientNotificationType,
    notificationInfo: Map<ClientNotificationInfo, any>
  ): void;
}

export class GameClient {
  private tcpClient;
  isConnected: boolean = false;

  constructor(private observer: ClientObserver) {
    this.tcpClient = new Net.Socket();
  }

  connect(port: number, ip: string): void {
    if (this.tcpClient != null) {
      this.tcpClient.connect({ port: port, host: ip}, () => {
        this.isConnected = true;
        this.observer.notify(
          ClientNotificationType.connectedToServer,
          new Map<ClientNotificationInfo, any>()
        );
      });
      this.tcpClient.on("data", (chunk: { toString: () => string; }) => {
        let events: Event[] = JSON.parse(chunk.toString());
        this.observer.notify(
          ClientNotificationType.receivedEvents,
          new Map<ClientNotificationInfo, any>([
            [ClientNotificationInfo.events, events],
          ])
        );
      });
      this.tcpClient.on("end", () => {
        this.isConnected = false;
        this.observer.notify(
          ClientNotificationType.disconnectedFromServer,
          new Map<ClientNotificationInfo, any>()
        );
      });
    }
  }

  sendMove(move: Move): void {
    if (this.isConnected) {
      this.tcpClient.write(move.toJson());
    }
  }
}
