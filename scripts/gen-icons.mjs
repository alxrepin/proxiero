// Генерирует иконки расширения (public/icon/{16..128}.png + серые gray-*.png
// для выключенного состояния) без зависимостей: PNG собирается вручную
// (zlib + CRC), рисунок — символ питания на круге.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icon');
const SIZES = [16, 32, 48, 96, 128];

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng(size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // глубина
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // фильтр none
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// Покрытие пикселя рисунком: 1 — фон-круг, 2 — глиф питания.
function sample(x, y) {
  const r = Math.hypot(x, y);
  if (r > 1) return 0;
  const glyphR = 0.52;
  const ring = Math.abs(r - glyphR) < 0.115;
  const angle = Math.atan2(x, -y); // 0 — вверх
  const inRing = ring && Math.abs(angle) > 0.72;
  const inBar = Math.abs(x) < 0.1 && y > -0.78 && y < -0.12;
  return inRing || inBar ? 2 : 1;
}

const PALETTES = {
  '': { from: [16, 185, 129], to: [36, 145, 104] }, // изумрудный — включено
  'gray-': { from: [148, 163, 184], to: [100, 116, 139] }, // серый — выключено
};

function drawIcon(size, palette) {
  const rgba = Buffer.alloc(size * size * 4);
  const SS = 4; // сглаживание: 4×4 сабсемпла
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let bg = 0;
      let glyph = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const x = ((px + (sx + 0.5) / SS) / size) * 2 - 1;
          const y = ((py + (sy + 0.5) / SS) / size) * 2 - 1;
          const v = sample(x * 1.02, y * 1.02);
          if (v > 0) bg++;
          if (v === 2) glyph++;
        }
      }
      const total = SS * SS;
      const alpha = bg / total;
      const g = glyph / total;
      const t = (py / size) * 0.35;
      // фон: вертикальный градиент палитры, глиф — почти белый
      const base = palette.from.map((c, ch) => Math.round(c + (palette.to[ch] - c) * t));
      const i = (py * size + px) * 4;
      rgba[i] = Math.round(base[0] * (1 - g) + 245 * g);
      rgba[i + 1] = Math.round(base[1] * (1 - g) + 250 * g);
      rgba[i + 2] = Math.round(base[2] * (1 - g) + 250 * g);
      rgba[i + 3] = Math.round(alpha * 255);
    }
  }
  return rgba;
}

mkdirSync(OUT_DIR, { recursive: true });
for (const [prefix, palette] of Object.entries(PALETTES)) {
  for (const size of SIZES) {
    writeFileSync(join(OUT_DIR, `${prefix}${size}.png`), encodePng(size, drawIcon(size, palette)));
    console.log(`icon/${prefix}${size}.png`);
  }
}
