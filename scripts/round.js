const sharp = require("sharp");

async function round(imagePath, size = null) {
  const data = await sharp(imagePath).resize(size, size);

  // Create an SVG with rounded corners
  const roundedCorners = Buffer.from(`
      <svg>
        <rect x="0" y="0" width="${size}" height="${size}"
         rx="${size / 2}" ry="${size / 2}" />
      </svg>
    `);

  // Apply the rounded corners mask and get the image as a Base64 string
  const roundedImageBuffer = await data
    .composite([{ input: roundedCorners, blend: "dest-in" }])
    .png()
    .toBuffer();

  // Convert the image buffer to a Base64 string
  const roundedImageBase64 = roundedImageBuffer.toString("base64");

  return `data:image/png;base64,${roundedImageBase64}`;
}

module.exports = round;
