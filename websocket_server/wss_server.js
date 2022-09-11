"use strict";
const https = require("https");
const fs = require("fs");
const ws = require("ws");

const options = {
  key: fs.readFileSync("deployment/private_key.pem"),
  cert: fs.readFileSync("deployment/anarchychess_xyz/anarchychess_xyz.crt"),
};

let server = https.createServer(options, (req, res) => {
  res.writeHead(200);
});

server.addListener("upgrade", (req, res, head) =>
  console.log("UPGRADE:", req.url)
);
server.on("error", (err) => console.error(err));
server.listen(3031, () => console.log("Https running on port 3031"));

const wss = new ws.Server({ server, path: "/websocket_server" });
wss.on("connection", function connection(ws) {
  ws.send("Hello");
  ws.on("message", (data) => ws.send("Receive: " + data));
});
