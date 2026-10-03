// Writes public/icon-192.png and public/icon-512.png: a green rounded square with
// a white ring. No dependencies: it encodes the PNG by hand.
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let k = 0; k < 8; k++) crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData));
  return Buffer.concat([length, typeAndData, crc]);
}

function png(size) {
  const corner = size * 0.18;
  const centre = size / 2;
  const rows = [];
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 4); // filter byte 0, then RGBA pixels
    for (let x = 0; x < size; x++) {
      const dx = Math.max(corner - x, 0, x - (size - 1 - corner));
      const dy = Math.max(corner - y, 0, y - (size - 1 - corner));
      const inside = dx * dx + dy * dy <= corner * corner;
      const d = Math.hypot(x - centre, y - centre);
      const ring = d <= size * 0.3 && d >= size * 0.2;
      const pixel = !inside ? [0, 0, 0, 0] : ring ? [255, 255, 255, 255] : [15, 81, 50, 255];
      row.set(pixel, 1 + x * 4);
    }
    rows.push(row);
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(Buffer.concat(rows))),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync(join(root, 'public'), { recursive: true });
for (const size of [192, 512]) writeFileSync(join(root, 'public', `icon-${size}.png`), png(size));
console.log('Wrote public/icon-192.png and public/icon-512.png');
