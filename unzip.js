const fs = require('fs');
const zlib = require('zlib');

//
// directly read a binary zip file and write an uncompressed binary data file
//
const fileContents = fs.createReadStream('./data/binary.zip');

const writeStream = fs.createWriteStream('./data/binary.data');
const unzip = zlib.createUnzip();

fileContents.pipe(unzip).pipe(writeStream);


//
// do uncompression directly from buffers
//
var uncompressedBuffer = fs.readFileSync('./data/binary.zip');
console.log('uncompressed length: ', uncompressedBuffer.length);
console.log('uncompressed: ', uncompressedBuffer);

var decompressedBuffer = zlib.inflateSync(uncompressedBuffer);
console.log('decompressedBuffer: ', decompressedBuffer);
console.log('decompressedBuffer length: ', decompressedBuffer.length);
