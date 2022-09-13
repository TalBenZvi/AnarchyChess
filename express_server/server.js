const express = require("express");
const app = express();
const path = require("path");

var fs = require('fs');
var https = require('https');
var privateKey  = fs.readFileSync(path.join(__dirname, "../deployment/private_key.pem"), 'utf8');
var certificate = fs.readFileSync(path.join(__dirname, "../deployment/anarchychess_xyz.crt"), 'utf8');

app.use(express.static(path.join(__dirname, "../build")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../build/index.html"));
})

var httpsServer = https.createServer({key: privateKey, cert: certificate}, app);

httpsServer.listen(3000, () => {
    console.log("server listening on port 3000");
})