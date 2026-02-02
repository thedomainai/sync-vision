#!/usr/bin/env node
/**
 * Generate PNG icons from emoji for Chrome extension
 *
 * Usage: node scripts/generate-icons.js
 *
 * This script creates simple PNG icons with the microphone emoji.
 * For best results, manually create icons or use an online tool.
 */

const fs = require('fs');
const path = require('path');

// Icon sizes required by Chrome extension
const sizes = [16, 32, 48, 128];

// Create a simple 1x1 PNG (placeholder)
// In production, use proper image generation tools
function createPlaceholderPng(size) {
  // Minimal valid PNG (1x1 transparent pixel, will be scaled)
  // This is a placeholder - for real icons, use ImageMagick or similar
  const pngHeader = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
    0x00, 0x00, 0x00, 0x0d, // IHDR length
    0x49, 0x48, 0x44, 0x52, // IHDR
    0x00, 0x00, 0x00, 0x01, // width
    0x00, 0x00, 0x00, 0x01, // height
    0x08, 0x06, // bit depth, color type (RGBA)
    0x00, 0x00, 0x00, // compression, filter, interlace
    0x1f, 0x15, 0xc4, 0x89, // CRC
    0x00, 0x00, 0x00, 0x0a, // IDAT length
    0x49, 0x44, 0x41, 0x54, // IDAT
    0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01, // compressed data
    0x0d, 0x0a, 0x2d, 0xb4, // CRC
    0x00, 0x00, 0x00, 0x00, // IEND length
    0x49, 0x45, 0x4e, 0x44, // IEND
    0xae, 0x42, 0x60, 0x82, // CRC
  ]);
  return pngHeader;
}

// Alternative: Create SVG-based icons that Chrome can use
function createSvgIcon(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.1875)}" fill="#1a1a1a"/>
  <text x="${size/2}" y="${size * 0.7}" font-size="${size * 0.625}" text-anchor="middle">🎙️</text>
</svg>`;
}

const iconsDir = path.join(__dirname, '..', 'icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

console.log('Generating Chrome extension icons...\n');
console.log('Note: For best quality, use one of these methods:\n');
console.log('1. ImageMagick (recommended):');
console.log('   brew install imagemagick');
sizes.forEach(size => {
  console.log(`   convert -background none icons/icon.svg -resize ${size}x${size} icons/icon${size}.png`);
});
console.log('\n2. Online converter:');
console.log('   https://cloudconvert.com/svg-to-png\n');

// Create SVG files for each size (as backup)
sizes.forEach(size => {
  const svgContent = createSvgIcon(size);
  const svgPath = path.join(iconsDir, `icon${size}.svg`);
  fs.writeFileSync(svgPath, svgContent);
  console.log(`Created: icons/icon${size}.svg`);
});

console.log('\nTo use SVG icons directly, update manifest.json:');
console.log('Change "icon16.png" to "icon16.svg", etc.');
console.log('\nOr generate PNGs using the commands above.');
