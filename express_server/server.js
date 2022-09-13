const express = require("express");
const app = express();
const path = require("path");

var https = require('https');
var privateKey  = fs.readFileSync('../deployment/private_key.pem', 'utf8');
var certificate = fs.readFileSync('../deployment/anarchychess_xyz', 'utf8');

app.use(express.static(path.join(__dirname, "../build")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../build/index.html"));
})

var httpsServer = https.createServer({key: privateKey, cert: certificate}, app);

httpsServer.listen(3000, () => {
    console.log("server listening on port 3000");
})