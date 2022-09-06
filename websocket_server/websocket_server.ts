import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 3031 });

wss.on("connection", (client) => {
  client.on("message", (data) => {
    client.send(data);
  });
});
