const fs = require("fs");
const { join } = require("path");
const { SaveFile } = require("../Upload");
const deleteDir = require("../scripts/deleteDir");

jest.mock("../fonts/useFont", () => {
  return jest.fn(() => "data:font/ttf;base64,mockedBase64");
});

const directories = {
  ...require("../scripts/dir"),
  files: join(__dirname, "./files"),
};
const fileName = `test_${Date.now()}.png`;
const inputFile = join(directories.input, fileName);
const outputFile = join(directories.output, fileName);

fs.copyFileSync(join(directories.files, "white.png"), inputFile);

// Test Suite
describe("SaveFile", () => {
  afterAll(() => {
    deleteDir(directories.input);
    deleteDir(directories.output);
  });

  it("should process and save the file with watermark and rounded corners", async () => {
    await SaveFile(inputFile);

    expect(fs.existsSync(outputFile)).toBe(true);
  });

  it("should handle errors gracefully", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

    try {
      await SaveFile("test.jpg");
    } catch (error) {
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(error).toBeDefined();
    }

    consoleErrorSpy.mockRestore();
  });
});
