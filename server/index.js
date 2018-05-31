const path = require("path");
const express = require("express");
const uuidv4 = require("uuid/v4");
const http = require('http');
const WebSocket = require('ws');

const app = express();

const PUBLIC_FOLDER = path.join(__dirname, "../public");
const PORT = process.env.PORT || 5000;

const socketsPerChannels /* Map<string, Set<WebSocket>> */ = new Map();
const channelsPerSocket /* WeakMap<WebSocket, Set<string> */ = new WeakMap();

const broadcast = (ws, data) => {
  const clients = socketsPerChannels.get(data.channel) || new Set();
  clients.forEach(client => {
    if (client === ws || client.readyState !== WebSocket.OPEN) {
      return;
    }
    client.send(JSON.stringify(data));
  });
}

const subscribe = (ws, channel) => {
  if(socketsPerChannels.has(channel)) {
    socketsPerChannels.get(channel).add(ws);
  } else {
    socketsPerChannels.set(channel, new Set([ws]));
  }
  if(channelsPerSocket.has(ws)) {
    channelsPerSocket.get(ws).add(channel);
  } else {
    channelsPerSocket.set(ws, new Set([channel]));
  }
}

const unsubscribe = (ws, channel) => {
  if(socketsPerChannels.has(channel)) {
    socketsPerChannels.get(channel).delete(ws);
    if(socketsPerChannels.get(channel).length === 0) {
      socketsPerChannels.delete(channel);
    }
  }
  if(channelsPerSocket.has(ws)) {
    channelsPerSocket.delete(ws);
  }
}

function unsubscribeAll(ws) {
  if(channelsPerSocket.has(ws)) {
    channelsPerSocket.get(ws).forEach(channel => unsubscribe(ws, channel));
  }
}

// Completer ce fichier
const server = http.createServer(app);

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {

  console.log('New client connected');
  //channelsPerSocket.add()
  //connection is up, let's add a simple simple event
  ws.on('message', (data) => {
    try {
      data = JSON.parse(data);
      switch (data.type) {
        case 'subscribe':
          subscribe(ws, data.channel);
          break;
        default:
          broadcast(ws, data);
      }
    } catch (e) {
      console.log(e);
    }
  });
  ws.on('close', (err) => {
    console.log('Client has disconnected');
    unsubscribeAll(ws);
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
