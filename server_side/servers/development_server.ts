// server
import express from "express";
const app = express();
import * as path from "path";

// http
import * as fs from "fs";
import * as http from "http";

import { fileURLToPath } from "url";

EnvironmentManager.environment = Environment.development;

import { AppServer } from "../flow/app_server.js";
import {
  Environment,
  EnvironmentManager,
  ValueType,
} from "../../src/communication/communication_util.js";


// @ts-ignore
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


EnvironmentManager.environment = Environment.development;


const pathToProjectDiectory: string =
  "../" + EnvironmentManager.getValue(ValueType.projectDirectoryPath);

app.use(express.static(path.join(__dirname, pathToProjectDiectory, "/build")));

app.get("/", (req: any, res: any) => {
  res.sendFile(path.join(__dirname, pathToProjectDiectory, "/public/index.html"));
});

app.get("*", function (req, res) {
  res.redirect("/");
});

const httpServer = http.createServer(app);

httpServer.listen(3031, () => {
  console.log("server listening on port 3031");
});

const websocketServer = new AppServer(httpServer);
