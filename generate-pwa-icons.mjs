// generate-pwa-icons.mjs
// Run with: node generate-pwa-icons.mjs
// Generates all PWA icon sizes from a canvas using the 'canvas' package
// If 'canvas' is not installed, this script creates simple SVG fallbacks instead.

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ICONS_DIR = join(__dirname, 'public', 'icons');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Ensure directory exists
if (!existsSync(ICONS_DIR)) {
  mkdirSync(ICONS_DIR, { recursive: true });
}

// Generate SVG icon for each size (works without any dependencies)
sizes.forEach(size => {
  const fontSize = Math.round(size * 0.55);
  const glowRadius = Math.round(size * 0.4);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#050505"/>
  <defs>
    <radialGradient id="glow">
      <stop offset="0%" stop-color="#FF5500" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#FF5500" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <circle cx="${size/2}" cy="${size/2}" r="${glowRadius}" fill="url(#glow)"/>
  <text x="${size/2}" y="${size/2 + size*0.04}" font-family="Arial,sans-serif" font-size="${fontSize}" font-weight="900" fill="#FF5500" text-anchor="middle" dominant-baseline="middle">F</text>
</svg>`;

  writeFileSync(join(ICONS_DIR, `icon-${size}x${size}.svg`), svg);
  console.log(`✓ Created icon-${size}x${size}.svg`);
});

console.log('\n✅ All SVG icons generated!');
console.log('\nTo convert to PNG (required for PWA), you can either:');
console.log('1. Open generate-icons.html in a browser and download PNGs');
console.log('2. Use an online SVG-to-PNG converter');
console.log('3. Install the "canvas" npm package and modify this script');
