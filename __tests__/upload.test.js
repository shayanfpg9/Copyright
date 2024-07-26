const fs = require("fs");
const { join } = require("path");
const { SaveFile, action } = require("../Upload");

jest.mock("../fonts/useFont", () => {
  return jest.fn(() => "data:font/ttf;base64,mockedBase64");
});

const directories = {
  input: join(__dirname, "./temp"),
  output: join(__dirname, "./output"),
  files: join(__dirname, "./files"),
};
const fileName = `test_${Date.now()}.png`;
const inputFile = join(directories.input, fileName);
const outputFile = join(directories.output, fileName);

fs.copyFileSync(join(directories.files, "white.png"), inputFile);

// Test Suite
describe("SaveFile", () => {
  afterAll(() => {
    fs.unlink(inputFile, () => {
      fs.unlinkSync(outputFile);
      action.close();
    });
  });

  it("should process and save the file with watermark and rounded corners", async () => {
    await SaveFile(inputFile);

    expect(fs.existsSync(outputFile)).toBe(true);
  });

  it("should handle errors gracefully", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

    await SaveFile("test.jpg");

    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});
