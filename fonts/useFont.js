const { readFileSync } = require("fs");
const path = require("path");

function useFont(fontName, ext = "ttf") {
  try {
    // Read the font file and encode it in Base64
    const fontFilePath = path.join(__dirname, fontName + +"." + ext);
    const base64Font = readFileSync(fontFilePath, "base64");

    // Return the font data URI
    return `data:font/${ext};base64,${base64Font}`;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`useFont error: ${error}`);
  }
}

module.exports = useFont;
