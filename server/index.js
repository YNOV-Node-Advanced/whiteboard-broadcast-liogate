const path = require("path");
const express = require("express");
const uuidv4 = require("uuid/v4");
const http = require('http');
const WebSocket = require('ws');

const app = express();

const PUBLIC_FOLDER = path.join(__dirname, "../public");
const PORT = process.env.PORT || 5000;

// Completer ce fichier
const server = http.createServer(app);

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('New client connected');
  //connection is up, let's add a simple simple event
  ws.on('message', (data) => {
      //log the received message and send it back to the client
      //console.log('received: %s', data);
      //ws.send(`Hello, you sent -> ${data}`);
      wss.clients
        .forEach(client => {
          if (client != ws) {
              client.send(data);
          }
        });
  });
});

// Assign a random channel to people opening the application
app.get("/", (req, res) => {
    res.redirect(`/${uuidv4()}`);
});

app.get("/:channel", (req, res, next) => {
    res.sendFile(path.join(PUBLIC_FOLDER, "index.html"), {}, err => {
        if (err) {
            next(err);
        }
    });
});

app.use(express.static(PUBLIC_FOLDER));
server.listen(PORT);
