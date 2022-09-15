const ws = require("ws");

import { WSS_PATH } from "../src/communication/communication_util";

export class WebsocketServer {
  private wss: any;

  constructor(server: any) {
    this.wss = new ws.Server({ server: server, path: WSS_PATH });
    this.wss.on("connection", (client) => {
        console.log(JSON.stringify(client));
    });
  }
}
