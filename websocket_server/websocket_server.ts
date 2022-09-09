const WebSocketPKG = require("ws");

const wss = new WebSocketPKG.Server({ port: "3031" });
console.log("running");

wss.on("connection", (client) => {
  console.log("client connected");
  client.on("message", (data) => {
    console.log("message received");
    client.send(data);
  });
});
