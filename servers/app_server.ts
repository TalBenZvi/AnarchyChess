import { WebSocketServer } from "ws";

import { WSS_PATH } from "../src/communication/communication_util.js";

export class AppServer {
  private wss;

  constructor(server: any) {
    this.wss = new WebSocketServer({ server: server, path: WSS_PATH });
    this.wss.on("connection", (client) => {
      client.send("test Hello");
    });
  }
}
