const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// SVG icon content - EVA Gas flame with gear badge for workers
const createSvg = (size) => {
  const scale = size / 512;
  const rx = Math.round(100 * scale);
  const flameScale = scale;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${rx}" fill="#E63E2D"/>
  <g transform="scale(${scale})">
    <path d="M256 64c0 0-96 96-96 192 0 64 40 112 96 112s96-48 96-112c0-96-96-192-96-192zm0 256c-24 0-48-24-48-56 0-40 48-96 48-96s48 56 48 96c0 32-24 56-48 56z" fill="white"/>
    <circle cx="384" cy="384" r="112" fill="#1a1a1a"/>
    <path d="M384 320v24M384 424v24M320 384h24M424 384h24M339.2 339.2l17.6 17.6M411.2 411.2l17.6 17.6M339.2 428.8l17.6-17.6M411.2 356.8l17.6-17.6" stroke="white" stroke-width="18" stroke-linecap="round"/>
    <circle cx="384" cy="384" r="32" fill="white"/>
  </g>
</svg>`;
};

const publicDir = path.join(__dirname, '..', 'public');

async function generateIcons() {
  try {
    // Generate 192x192 PNG
    const svg192 = createSvg(192);
    await sharp(Buffer.from(svg192))
      .png()
      .toFile(path.join(publicDir, 'icon-192.png'));
    console.log('Generated icon-192.png');

    // Generate 512x512 PNG
    const svg512 = createSvg(512);
    await sharp(Buffer.from(svg512))
      .png()
      .toFile(path.join(publicDir, 'icon-512.png'));
    console.log('Generated icon-512.png');

    // Generate apple-touch-icon (180x180)
    const svg180 = createSvg(180);
    await sharp(Buffer.from(svg180))
      .png()
      .toFile(path.join(publicDir, 'apple-touch-icon.png'));
    console.log('Generated apple-touch-icon.png');

    console.log('All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();
