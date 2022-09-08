import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 3031 });

wss.on("connection", (client) => {
  console.log("client connected");
  client.on("message", (data) => {
    console.log("message received");
    client.send(data);
  });
});
