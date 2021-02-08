// From the samples - https://github.com/websockets/ws#server-broadcast
// A client WebSocket broadcasting to every other connected WebSocket clients, excluding itself.

const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 5050, path: '/chat' });

// This is a server that has connection problems to see how clients handle connection issues.
function setupSpottyConnection() {
  wss.on('connection', function connection(ws) {

    let timerClose = 2000 + Math.floor(Math.random() * 1000);
    // randomly close the connection in 2 + (0 to N seconds)
    setTimeout(function () {
      ws.close();
    }, timerClose);

    ws.on('message', function incoming(data) {
      wss.clients.forEach(function each(client) {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(data);
        }
      });
    });
  });

  wss.on('connection', function (ws) {
    ws.on('error', console.error);
  });

  wss.on('close', function close() {
    console.log('connection closed');
  });
}

setupSpottyConnection();
