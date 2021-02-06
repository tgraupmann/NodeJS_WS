// From the samples - https://github.com/websockets/ws#sending-binary-data
// Ref: https://stackoverflow.com/questions/33702838/how-to-append-bytes-multi-bytes-and-buffer-to-arraybuffer-in-javascript
// Sending binary data
const { exit } = require('process');
const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:5050/chat');

function concatTypedArrays(a, b) { // a, b TypedArray of same type
  var c = new (a.constructor)(a.length + b.length);
  c.set(a, 0);
  c.set(b, a.length);
  return c;
}

function concatBytes(ui8a, byte) {
  var b = new Uint8Array(1);
  b[0] = byte;
  return concatTypedArrays(ui8a, b);
}

ws.on('open', function open() {
  console.log('Connected to WebSocket');

  var u8 = new Uint8Array(0);
  u8 = concatBytes(u8, 0x1);
  u8 = concatBytes(u8, 0x2);
  u8 = concatBytes(u8, 0x3);

  console.log('Sending data...');
  ws.send(u8);
  console.log('Sent data!');
  //exit();
});

ws.on('message', function incoming(data) {
  console.log(data);
});
