import * as net from "net";

enum ServerNotification {
  filledServer,
  receivedMove,
}

enum ServerNotificationInfo {
  playerIndex,
  move,
}

interface ServerObserver {
  notify(
    notification: ServerNotification,
    notificationInfo: Map<ServerNotificationInfo, any>
  ): void;
}

export class GameServer {
  private clients: any[];

  constructor(this.observer: ServerObserver) {
    this.clients = [];
  }
}
