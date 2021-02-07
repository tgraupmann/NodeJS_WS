// From the samples - https://github.com/websockets/ws#server-broadcast
// A client WebSocket broadcasting to every other connected WebSocket clients, excluding itself.

const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 5050, path: '/chat' });

wss.on('connection', function connection(ws) {
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
