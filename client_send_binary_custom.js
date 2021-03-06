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

function appendUInt16(ui8a, ui16) {
  let result = appendByte(ui8a, (ui16 >> 8) & 0xFF);
  result = appendByte(result, ui16 & 0xFF);
  return result;
}

function appendUInt32(ui8a, ui32) {
  let result = appendUInt16(ui8a, (ui32 >> 16) & 0xFFFF);
  result = appendUInt16(result, ui32 & 0xFFFF);
  return result;
}

function appendUInt64FromString(ui8a, ui64Str) {
  //console.log('appendUInt64FromString: ', ui64Str);
  let result = ui8a;
  let u8 = '';
  for (let i = 0; i < 16; ++i) {
    let index = 16 - i;
    let byte;
    if (index > ui64Str.length) {
      //console.log('byte: i=', i, 'value=', 0);
      byte = 0;
    } else {
      byte = parseInt('0x' + ui64Str[i - 16 + ui64Str.length], 16);
      //console.log('byte: i=', i, 'index=', i - 16 + ui64Str.length, 'value=', byte);
    }

    if (u8 == '') {
      u8 = byte.toString(16);
    } else {
      u8 += byte.toString(16);
      //console.log('appendByte: i=', i, 'byte=', parseInt(u8, 16).toString(16));
      result = appendByte(result, parseInt(u8, 16));
      u8 = '';
    }

  }
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

// treat as bit flags in the header byte
const EChromaStreamHeaderFormat_FULL_FRAME = 0;                 //00000000
const EChromaStreamHeaderFormat_FULL_KEYFRAME = 0x1;            //00000001
const EChromaStreamHeaderFormat_REF_FRAME = 1 << 1;             //00000010
const EChromaStreamHeaderFormat_REF_FRAME_CHROMA_LINK = 1 << 7; //10000000
const EChromaStreamHeaderFormat_REF_FRAME_HEADSET = 1 << 6;     //01000000
const EChromaStreamHeaderFormat_REF_FRAME_KEYBOARD = 1 << 5;    //00100000
const EChromaStreamHeaderFormat_REF_FRAME_KEYPAD = 1 << 4;      //00010000
const EChromaStreamHeaderFormat_REF_FRAME_MOUSE = 1 << 3;       //00001000
const EChromaStreamHeaderFormat_REF_FRAME_MOUSEPAD = 1 << 2;    //00000100

function sendRefFrame() {

  let u8a = new Uint8Array(0);

  const now = Date.now(); // Unix timestamp in milliseconds
  //console.log(now.toString());
  //console.log(now.toString(16));
  //console.log('Timestamp: ', insertDashes(now.toString(16)));

  u8a = appendUInt64FromString(u8a, now.toString(16));
  u8a = appendByte(u8a, EChromaStreamHeaderFormat_REF_FRAME);

  u8a = appendUInt32(u8a, now & 0xFFFFFFFF);

  console.log('Sending data ', u8a.length, ' bytes - Ref frame');
  ws.send(u8a);
}

function sendFullFrame(keyframe) {

  let u8a = new Uint8Array(0);

  const now = Date.now(); // Unix timestamp in milliseconds
  //console.log(now.toString());
  //console.log(now.toString(16));
  //console.log('Timestamp: ', insertDashes(now.toString(16)));

  u8a = appendUInt64FromString(u8a, now.toString(16));
  if (keyframe) {
    u8a = appendByte(u8a, EChromaStreamHeaderFormat_FULL_KEYFRAME);
  } else {
    u8a = appendByte(u8a, EChromaStreamHeaderFormat_FULL_FRAME);
  }

  let color = 0x000000FF; //red

  //chromalink
  let size = 5;
  for (let i = 0; i < size; ++i) {
    u8a = appendUInt32(u8a, color);
  }

  //headset
  size = 5;
  for (let i = 0; i < size; ++i) {
    u8a = appendUInt32(u8a, color);
  }

  //keyboard
  size = 22 * 6;
  for (let i = 0; i < size; ++i) {
    u8a = appendUInt32(u8a, color);
  }

  //keypad
  size = 4 * 5;
  for (let i = 0; i < size; ++i) {
    u8a = appendUInt32(u8a, color);
  }

  //mouse
  size = 7 * 9;
  for (let i = 0; i < size; ++i) {
    u8a = appendUInt32(u8a, color);
  }

  //mousepad
  size = 15;
  for (let i = 0; i < size; ++i) {
    u8a = appendUInt32(u8a, color);
  }

  if (keyframe) {
    console.log('Sending data ', u8a.length, ' bytes - Full keyframe');
  } else {
    console.log('Sending data ', u8a.length, ' bytes - Full frame');
  }
  ws.send(u8a);
}

function sendPartialFrame() {

  let u8a = new Uint8Array(0);

  const now = Date.now(); // Unix timestamp in milliseconds
  //console.log(now.toString());
  //console.log(now.toString(16));
  //console.log('Timestamp: ', insertDashes(now.toString(16)));

  u8a = appendUInt64FromString(u8a, now.toString(16));

  // A partial is a combination of the flags below
  // None would be a full frame
  // All would be a ref frame
  /*
  EChromaStreamHeaderFormat_REF_FRAME_CHROMA_LINK
  EChromaStreamHeaderFormat_REF_FRAME_HEADSET
  EChromaStreamHeaderFormat_REF_FRAME_KEYBOARD
  EChromaStreamHeaderFormat_REF_FRAME_KEYPAD
  EChromaStreamHeaderFormat_REF_FRAME_MOUSE
  EChromaStreamHeaderFormat_REF_FRAME_MOUSEPAD
  */

  //randomly include some masks
  let header = 0;
  if (Math.floor(Math.random() * 100) % 2) {
    header |= EChromaStreamHeaderFormat_REF_FRAME_CHROMA_LINK;
  }
  if (Math.floor(Math.random() * 100) % 2) {
    header |= EChromaStreamHeaderFormat_REF_FRAME_HEADSET;
  }
  if (Math.floor(Math.random() * 100) % 2) {
    header |= EChromaStreamHeaderFormat_REF_FRAME_KEYBOARD;
  }
  if (Math.floor(Math.random() * 100) % 2) {
    header |= EChromaStreamHeaderFormat_REF_FRAME_KEYPAD;
  }
  if (Math.floor(Math.random() * 100) % 2) {
    header |= EChromaStreamHeaderFormat_REF_FRAME_MOUSE;
  }
  if (Math.floor(Math.random() * 100) % 2) {
    header |= EChromaStreamHeaderFormat_REF_FRAME_MOUSEPAD;
  }

  if (header == EChromaStreamHeaderFormat_FULL_FRAME) {
    console.log('Skip sending partial - this is a full frame!');
    return;
  } else if (header == EChromaStreamHeaderFormat_REF_FRAME) {
    console.log('Skip sending partial - this is a ref frame!');
    return;
  }

  u8a = appendByte(u8a, header);

  let color = 0x000000FF; //red

  //chromalink
  if ((header & EChromaStreamHeaderFormat_REF_FRAME_CHROMA_LINK) == EChromaStreamHeaderFormat_REF_FRAME_CHROMA_LINK) {
    u8a = appendUInt32(u8a, now & 0xFFFFFFFF); // ref timestamp
  } else {
    let size = 5;
    for (let i = 0; i < size; ++i) {
      u8a = appendUInt32(u8a, color);
    }
  }

  //headset
  if ((header & EChromaStreamHeaderFormat_REF_FRAME_HEADSET) == EChromaStreamHeaderFormat_REF_FRAME_HEADSET) {
    u8a = appendUInt32(u8a, now & 0xFFFFFFFF); // ref timestamp
  } else {
    size = 5;
    for (let i = 0; i < size; ++i) {
      u8a = appendUInt32(u8a, color);
    }
  }

  //keyboard
  if ((header & EChromaStreamHeaderFormat_REF_FRAME_KEYBOARD) == EChromaStreamHeaderFormat_REF_FRAME_KEYBOARD) {
    u8a = appendUInt32(u8a, now & 0xFFFFFFFF); // ref timestamp
  } else {
    size = 22 * 6;
    for (let i = 0; i < size; ++i) {
      u8a = appendUInt32(u8a, color);
    }
  }

  //keypad
  if ((header & EChromaStreamHeaderFormat_REF_FRAME_KEYPAD) == EChromaStreamHeaderFormat_REF_FRAME_KEYPAD) {
    u8a = appendUInt32(u8a, now & 0xFFFFFFFF); // ref timestamp
  } else {
    size = 4 * 5;
    for (let i = 0; i < size; ++i) {
      u8a = appendUInt32(u8a, color);
    }
  }

  //mouse
  if ((header & EChromaStreamHeaderFormat_REF_FRAME_MOUSE) == EChromaStreamHeaderFormat_REF_FRAME_MOUSE) {
    u8a = appendUInt32(u8a, now & 0xFFFFFFFF); // ref timestamp
  } else {
    size = 7 * 9;
    for (let i = 0; i < size; ++i) {
      u8a = appendUInt32(u8a, color);
    }
  }

  //mousepad
  if ((header & EChromaStreamHeaderFormat_REF_FRAME_MOUSEPAD) == EChromaStreamHeaderFormat_REF_FRAME_MOUSEPAD) {
    u8a = appendUInt32(u8a, now & 0xFFFFFFFF); // ref timestamp
  } else {
    size = 15;
    for (let i = 0; i < size; ++i) {
      u8a = appendUInt32(u8a, color);
    }
  }

  console.log('Sending data ', u8a.length, ' bytes - Partial frame');
  ws.send(u8a);
}

ws.on('open', function open() {
  console.log('Connected to WebSocket');

  let frameCount = 0;
  let keyframe = true;

  setInterval(function () {
    let choice = Math.floor(Math.random() * 100) % 3 + 1;
    ++frameCount;
    if (frameCount >= 300) {
      frameCount = 0;
      choice = 0; //keyframe
    }
    switch (choice) {
      case 0:
        sendFullFrame(true);
        break;
      case 1:
        sendFullFrame(false);
        break;
      case 2:
        sendRefFrame();
        break;
      case 3:
        sendPartialFrame();
        break;
    }
  }, 33);

  //exit();
});

ws.on('message', function incoming(data) {
  console.log(data);
});
