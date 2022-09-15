// server
const express = require("express");
const app = express();
const path = require("path");

// https
const fs = require("fs");
const https = require("https");
const privateKey = fs.readFileSync(
  path.join(__dirname, "../deployment/private_key.pem"),
  "utf8"
);
const certificate = fs.readFileSync(
  path.join(__dirname, "../deployment/anarchychess_xyz.crt"),
  "utf8"
);

app.use(express.static(path.join(__dirname, "../build")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../build/index.html"));
});

const httpsServer = https.createServer(
  { key: privateKey, cert: certificate },
  app
);

httpsServer.listen(3000, () => {
  console.log("server listening on port 3000");
});

const wss = new ws.Server({ server: httpsServer, path: "/websocket" });
wss.on("connection", function connection(ws) {
  console.log("client connected");
  ws.send("test Hello");
  ws.on("message", (data) => ws.send("Receive: " + data));
});
