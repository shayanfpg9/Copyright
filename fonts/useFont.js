const { readFileSync } = require("fs");
const path = require("path");

function useFont(fontName) {
  // Read the font file and encode it in Base64
  const fontFilePath = path.join(__dirname, fontName);
  const base64Font = readFileSync(fontFilePath, "base64");

  // Return the font data URI
  return `data:font/ttf;base64,${base64Font}`;
}

module.exports = useFont;
