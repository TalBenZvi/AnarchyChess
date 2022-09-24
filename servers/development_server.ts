// server
import express from "express";
const app = express();
import * as path from "path";

// http
import * as fs from "fs";
import * as http from "http";

import { fileURLToPath } from 'url';
// @ts-ignore
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { AppServer } from "./app_server.js";

app.use(express.static(path.join(__dirname, "../build")));

app.get("/", (req: any, res: any) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

const httpServer = http.createServer(app);

httpServer.listen(3031, () => {
  console.log("server listening on port 3031");
});

const websocketServer = new AppServer(httpServer);