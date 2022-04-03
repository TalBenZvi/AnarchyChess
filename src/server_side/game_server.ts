import * as net from "net";
import { NUM_OF_PLAYERS, Move } from "../game_flow_util/game_elements";
import { Event } from "../game_flow_util/events";

const BACKLOG = 100;

export enum ServerNotificationType {
  filledServer,
  receivedMove,
}

export enum ServerNotificationInfo {
  playerIndex,
  move,
}

export interface ServerObserver {
  notify(
    notification: ServerNotificationType,
    notificationInfo: Map<ServerNotificationInfo, any>
  ): void;
}

export class GameServer {
  private clients: net.Socket[];

  constructor(private observer: ServerObserver) {
    this.clients = [];
  }

  acceptConnections(port: number, ip: string) {
    net
      .createServer()
      .listen(port, ip, BACKLOG)
      .on("connection", (socket) => {
        if (this.clients.length < NUM_OF_PLAYERS) {
          let playerIndex: number = this.clients.length;
          this.clients.push(socket);
          if (this.clients.length >= NUM_OF_PLAYERS) {
            this.observer.notify(
              ServerNotificationType.filledServer,
              new Map<ServerNotificationInfo, any>()
            );
          }
          socket.on("data", (buffer) => {
            let move: Move = JSON.parse(buffer.toString());
            this.observer.notify(
              ServerNotificationType.receivedMove,
              new Map<ServerNotificationInfo, any>([
                [ServerNotificationInfo.playerIndex, playerIndex],
                [ServerNotificationInfo.move, move as any],
              ])
            );
          });
        } else {
          socket.end();
        }
      });
  }

  sendEvents(playerIndex: number, events: Event[]) {
    this.clients[playerIndex].write(JSON.stringify(events));
  }

  broadcastEvents(events: Event[]) {
    for (let i = 0; i < this.clients.length; i++) {
      this.sendEvents(i, events);
    }
  }
}
