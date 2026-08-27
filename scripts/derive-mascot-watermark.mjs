import { readFileSync, writeFileSync } from "node:fs";
import { deflateSync, inflateSync } from "node:zlib";

const inputPath = "apps/client/miniprogram/assets/v1-29/ichi-mascot-large.png";
const outputPath =
  "apps/client/miniprogram/assets/v1-29/ichi-mascot-large-watermark.png";
const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const input = readFileSync(inputPath);
if (!input.subarray(0, 8).equals(signature)) throw new Error("Not a PNG");

let offset = 8;
let width = 0;
let height = 0;
let bitDepth = 0;
let colorType = 0;
let interlace = 0;
const idat = [];
const chunks = [];

while (offset < input.length) {
  const length = input.readUInt32BE(offset);
  const type = input.subarray(offset + 4, offset + 8).toString("ascii");
  const data = input.subarray(offset + 8, offset + 8 + length);
  offset += 12 + length;
  if (type === "IHDR") {
    width = data.readUInt32BE(0);
    height = data.readUInt32BE(4);
    bitDepth = data[8];
    colorType = data[9];
    interlace = data[12];
  } else if (type === "IDAT") idat.push(data);
  else if (type !== "IEND") chunks.push({ type, data });
}

if (bitDepth !== 8 || colorType !== 6 || interlace !== 0) {
  throw new Error("Expected non-interlaced 8-bit RGBA PNG");
}

const raw = inflateSync(Buffer.concat(idat));
const stride = width * 4;
const pixels = Buffer.alloc(height * stride);
const paeth = (a, b, c) => {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
};

let sourceOffset = 0;
for (let y = 0; y < height; y += 1) {
  const filter = raw[sourceOffset++];
  const rowOffset = y * stride;
  const previousOffset = (y - 1) * stride;
  for (let x = 0; x < stride; x += 1) {
    const left = x >= 4 ? pixels[rowOffset + x - 4] : 0;
    const up = y > 0 ? pixels[previousOffset + x] : 0;
    const upLeft = y > 0 && x >= 4 ? pixels[previousOffset + x - 4] : 0;
    const value = raw[sourceOffset++];
    pixels[rowOffset + x] =
      filter === 0
        ? value
        : filter === 1
          ? (value + left) & 255
          : filter === 2
            ? (value + up) & 255
            : filter === 3
              ? (value + Math.floor((left + up) / 2)) & 255
              : (value + paeth(left, up, upLeft)) & 255;
  }
}

const encoded = Buffer.alloc(height * (stride + 1));
for (let y = 0; y < height; y += 1) {
  const rowOffset = y * stride;
  const encodedOffset = y * (stride + 1);
  encoded[encodedOffset] = 0;
  for (let x = 0; x < stride; x += 4) {
    const r = pixels[rowOffset + x];
    const g = pixels[rowOffset + x + 1];
    const b = pixels[rowOffset + x + 2];
    const a = pixels[rowOffset + x + 3];
    const luminance = (r + g + b) / 3;
    const targetOffset = encodedOffset + 1 + x;
    if (a === 0 || luminance > 220) {
      encoded[targetOffset] = 255;
      encoded[targetOffset + 1] = 255;
      encoded[targetOffset + 2] = 255;
      encoded[targetOffset + 3] = 0;
    } else {
      encoded[targetOffset] = 255;
      encoded[targetOffset + 1] = 255;
      encoded[targetOffset + 2] = 255;
      encoded[targetOffset + 3] = a;
    }
  }
}

const crc32 = (buffer) => {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const typeBuffer = Buffer.from(type, "ascii");
  const result = Buffer.alloc(12 + data.length);
  result.writeUInt32BE(data.length, 0);
  typeBuffer.copy(result, 4);
  data.copy(result, 8);
  result.writeUInt32BE(
    crc32(Buffer.concat([typeBuffer, data])),
    8 + data.length,
  );
  return result;
};

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(width, 0);
ihdr.writeUInt32BE(height, 4);
ihdr[8] = 8;
ihdr[9] = 6;
const output = [signature, chunk("IHDR", ihdr)];
for (const item of chunks) output.push(chunk(item.type, item.data));
output.push(chunk("IDAT", deflateSync(encoded, { level: 9 })));
output.push(chunk("IEND", Buffer.alloc(0)));
writeFileSync(outputPath, Buffer.concat(output));
