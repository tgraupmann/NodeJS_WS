// Adapted from the samples - https://github.com/websockets/ws#sending-binary-data
// Ref: https://stackoverflow.com/questions/33702838/how-to-append-bytes-multi-bytes-and-buffer-to-arraybuffer-in-javascript
// Sending binary data
const { exit } = require('process');
const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:5050/chat');

function concatTypedArrays(a, b) { // a, b TypedArray of same type
  let c = new (a.constructor)(a.length + b.length);
  c.set(a, 0);
  c.set(b, a.length);
  return c;
}

function appendByte(ui8a, byte) {
  let b = new Uint8Array(1);
  b[0] = byte & 0xFF;
  return concatTypedArrays(ui8a, b);
}

function appendUInt32(ui8a, ui32) {
  let result = appendByte(ui8a, (ui32 >> 24) & 0xFF);
  result = appendByte(result, (ui32 >> 16) & 0xFF);
  result = appendByte(result, (ui32 >> 8) & 0xFF);
  result = appendByte(result, ui32 & 0xFF);
  return result;
}

function appendUInt64(ui8a, ui64) {
  let result = appendUInt32(ui8a, (ui64 >> 32) & 0xFFFFFFFF);
  result = appendUInt32(result, ui64 & 0xFFFFFFFF);
  return result;
}

function insertDashes(str) {
  let input = str.toString();
  let result = '';
  for (let i = 0; i < input.length; ++i) {
    if (i > 0 && (input.length % 2 + i) % 2 == 0) {
      result += "-";
    }
    result += input[i];
  }
  return result;
}

ws.on('open', function open() {
  console.log('Connected to WebSocket');

  let u8 = new Uint8Array(0);

  const now = Date.now(); // Unix timestamp in milliseconds
  //console.log(now.toString());
  //console.log(now.toString(16));
  console.log('Timestamp: ', insertDashes(now.toString(16)));

  //console.log('First Part: ', insertDashes((now >> 32).toString(16)));
  //console.log('Second Part: ', insertDashes((now & 0xFFFFFFFF).toString(16)));

  u8 = appendUInt64(u8, parseInt(now.toString(16), 16));
  u8 = appendByte(u8, 0x0); // EChromaStreamHeaderFormat_FULL_FRAME

  let color = 0x000000FF; //red

  //chromalink
  let size = 5;
  for (let i = 0; i < size; ++i) {
    u8 = appendUInt32(u8, color);
  }

  //headset
  size = 5;
  for (let i = 0; i < size; ++i) {
    u8 = appendUInt32(u8, color);
  }

  //keyboard
  size = 22 * 6;
  for (let i = 0; i < size; ++i) {
    u8 = appendUInt32(u8, color);
  }

  //keypad
  size = 4 * 5;
  for (let i = 0; i < size; ++i) {
    u8 = appendUInt32(u8, color);
  }

  //mouse
  size = 7 * 9;
  for (let i = 0; i < size; ++i) {
    u8 = appendUInt32(u8, color);
  }

  //mousepad
  size = 15;
  for (let i = 0; i < size; ++i) {
    u8 = appendUInt32(u8, color);
  }

  console.log('Sending data ', u8.length, ' bytes...');
  ws.send(u8);
  console.log('Sent data!');
  //exit();
});

ws.on('message', function incoming(data) {
  console.log(data);
});
