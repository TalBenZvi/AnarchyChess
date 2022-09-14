// server
const express = require("express");
const app = express();
const path = require("path");

// http
const fs = require("fs");
const http = require("http");

// ws
const ws = require("ws");

app.use(express.static(path.join(__dirname, "../build")));

app.get("/", (req, res) => {
  // let index =
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

const httpServer = http.createServer(app);

httpServer.listen(3031, () => {
  console.log("server listening on port 3031");
});

const wss = new ws.Server({ server: httpServer, path: "/websocket" });
wss.on("connection", function connection(ws) {
  console.log("client connected");
  ws.send("test Hello");
  ws.on("message", (data) => ws.send("Receive: " + data));
});
