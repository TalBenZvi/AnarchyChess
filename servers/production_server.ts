// server
import express from "express";
const app = express();
import * as path from "path";

// https
import * as fs from "fs";
import * as https from "https";
import * as http from "http";

import { fileURLToPath } from "url";
// @ts-ignore
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { AppServer } from "./app_server.js";

const privateKey = fs.readFileSync(
  path.join(__dirname, "../../deployment/private_key.pem"),
  "utf8"
);
const certificate = fs.readFileSync(
  path.join(__dirname, "../../deployment/anarchychess_xyz.crt"),
  "utf8"
);

app.enable("trust proxy");
app.use((req, res, next) => {
  req.secure ? next() : res.redirect("https://" + req.headers.host + req.url);
});

app.use(express.static(path.join(__dirname, "../../build")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../../build/index.html"));
});

app.get("*", function (req, res) {
  res.redirect("/");
});

const httpsServer = https.createServer(
  { key: privateKey, cert: certificate },
  app
);

httpsServer.listen(3443, "0.0.0.0", () => {
  console.log("server listening on port 3443");
});

const httpToHttps = http.createServer((req, res) => {
  res.writeHead(301, { Location: `https://${req.headers.host}${req.url}` });
  res.end();
});

httpToHttps.listen(3080);

const appServer = new AppServer(httpsServer);
