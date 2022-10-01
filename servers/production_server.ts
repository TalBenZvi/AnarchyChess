// server
import express from "express";
const app = express();
import * as path from "path";

// https
import * as fs from "fs";
import * as https from "https";

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

app.use(express.static(path.join(__dirname, "../../build")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../../build/index.html"));
});

app.get('*', function(req, res) {
  res.redirect('/');
});


const httpsServer = https.createServer(
  { key: privateKey, cert: certificate },
  app
);

httpsServer.listen(3031, () => {
  console.log("server listening on port 3031");
});

const appServer = new AppServer(httpsServer);