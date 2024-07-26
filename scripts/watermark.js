const { createCanvas, registerFont } = require("canvas");
const path = require("path");
const useFont = require("../fonts/useFont");
const sharp = require("sharp");
const round = require("./round");

async function isImageLight(filePath) {
  const image = sharp(filePath);
  const { data } = await image
    .resize({ width: 100 }) // Resize for performance
    .toColorspace("b-w") // Convert to grayscale
    .raw()
    .toBuffer({ resolveWithObject: true });

  const totalBrightness = data.reduce((total, index) => total + index, 0);
  const averageBrightness = totalBrightness / data.length;
  return averageBrightness > 127; // Midpoint of grayscale (0-255)
}

const watermark = async ({ width, height, file }, text, imagePath) => {
  const font = "Archivo";
  registerFont(path.join(__dirname, `../fonts/${font}.ttf`), {
    family: font,
  });

  const theme = (await isImageLight(file)) ? "#031d44" : "#fff";

  const baseFontSize = 30;
  const rotationAngle = -45;
  const padding = 20;

  const imageSize = 50; // Set desired width of the image

  // Temporary canvas to measure text dimensions
  const tempCanvas = createCanvas(1, 1);
  const context = tempCanvas.getContext("2d");
  context.font = `${baseFontSize}px ${font}`;

  const textSize = {
    width: context.measureText(text).width,
    height: baseFontSize,
  };

  // Calculate the dimensions of the bounding box for the rotated text and image
  const totalWidth = imageSize + padding + textSize.width;
  const totalHeight = Math.max(imageSize, textSize.height);

  const sinAngle = Math.sin(Math.abs(rotationAngle) * (Math.PI / 180));
  const cosAngle = Math.cos(Math.abs(rotationAngle) * (Math.PI / 180));
  const rotatedSize = {
    width: totalWidth * cosAngle + totalHeight * sinAngle,
    height: totalWidth * sinAngle + totalHeight * cosAngle,
  };

  // Define the pattern dimensions
  const patternSize = {
    width: rotatedSize.width + padding * 2,
    height: rotatedSize.height + padding * 2,
  };

  // Load the image data as a Base64 string
  const imageSrc = await round(imagePath, imageSize);

  // SVG Content with image and text pattern
  const svgContent = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <pattern id="watermark-pattern" width="${
                  patternSize.width
                }" height="${patternSize.height}" patternUnits="userSpaceOnUse">
                <style type="text/css">
                  @font-face {
                      font-family: '${font}';
                      src: url('${useFont(font)}') format('woff');
                  }
                </style>
                    <line x1="0" y1="${patternSize.height / 2}"
                        x2="${patternSize.width}"
                        y2="${patternSize.height / 2}" stroke="${theme}"
                        stroke-width="1" stroke-dasharray="5, 5" />
                        
                    <line x1="${patternSize.width / 2}" y1="0"
                     x2="${patternSize.width / 2}"
                     y2="${patternSize.height}" stroke="${theme}"
                        stroke-width="1" stroke-dasharray="5, 5" />

                    <image x="5"
                     y="${
                       (patternSize.height + textSize.height) / 2 +
                       padding * 1.5
                     }" width="${imageSize}" height="${imageSize}" href="${imageSrc}" />

                    <text x="${patternSize.width / 2}"
                     y="${
                       patternSize.height / 2
                     }" font-size="${baseFontSize}" fill="${theme}" font-family="'${font}', sans-serif"
                        text-anchor="middle" dominant-baseline="middle"
                        transform="rotate(${rotationAngle}
                         ${patternSize.width / 2} ${patternSize.height / 2})">
                        ${text}
                    </text>
               
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#watermark-pattern)" />
        </svg>
    `;

  return svgContent;
};

module.exports = { watermark, isImageLight };
