// gen-icons.mjs — SVG'den PWA ikonları üretir
// Kullanım: node gen-icons.mjs
// Bağımlılık: sharp  (npm install sharp -g veya lokal)

import sharp from 'sharp';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const svgPath = path.join(__dirname, 'public', 'logo.svg');
const svgBuf = readFileSync(svgPath);

const targets = [
    { out: 'public/pwa-192x192.png', size: 192 },
    { out: 'public/pwa-512x512.png', size: 512 },
    { out: 'public/apple-touch-icon.png', size: 180 },
];

for (const { out, size } of targets) {
    await sharp(svgBuf)
        .resize(size, size)
        .png()
        .toFile(path.join(__dirname, out));
    console.log(`✓ ${out}  (${size}x${size})`);
}
console.log('Tüm ikonlar oluşturuldu.');
