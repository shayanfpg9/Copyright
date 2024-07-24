const path = require("path");
const { watermark, isImageLight } = require("../scripts/watermark");

// Mock for reading a font file
jest.mock("fs", () => ({
  ...jest.requireActual("fs"),
  readFileSync: jest.fn().mockReturnValue("font-data"),
}));

// Test the `isImageLight` function
describe("isImageLight", () => {
  it("should return true for light images", async () => {
    const result = await isImageLight(
      path.join(__dirname, "./files/white.png").toString()
    );
    expect(result).toBe(true);
  });

  it("should return false for dark images", async () => {
    const result = await isImageLight(
      path.join(__dirname, "./files/black.png").toString()
    );
    expect(result).toBe(false);
  });
});

// Test the `watermark` function
describe("watermark", () => {
  it("should generate SVG content with light theme for light images", async () => {
    const result = await watermark(
      {
        width: 100,
        height: 100,
        file: path.join(__dirname, "./files/white.png").toString(),
      },
      "Sample Text",
      "./files/profile.png"
    );

    // Check if the SVG content includes the light theme color
    expect(result).toContain('stroke="#031d44"');
    expect(result).toContain('fill="#031d44"');
  });

  it("should generate SVG content with dark theme for dark images", async () => {
    const result = await watermark(
      {
        width: 100,
        height: 100,
        file: path.join(__dirname, "./files/black.png").toString(),
      },
      "Sample Text",
      "./files/profile.png"
    );

    // Check if the SVG content includes the dark theme color
    expect(result).toContain('stroke="#fff"');
    expect(result).toContain('fill="#fff"');
  });
});
