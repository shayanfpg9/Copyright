require("dotenv").config();
const WebSocket = require("ws");
const path = require("path");
const request = require("supertest");
const fs = require("fs");
const { cleanup, app } = require("../main");
const deleteDir = require("../scripts/deleteDir");
const directories = require("../scripts/dir");

let ws;

beforeAll((done) => {
  ws = new WebSocket(`ws://localhost:${process.env.PORT || 3000}`);
  ws.on("open", () => {
    done();
  });
});

afterAll(() => {
  cleanup();

  setTimeout(() => {
    if (ws) ws.close();
    deleteDir(directories.output);
  }, 1000);
});

describe("File Upload WebSocket API", () => {
  it("should upload a file and return success message", (done) => {
    const filePath = path.join(__dirname, "./files/black.png");
    const fileBuffer = fs.readFileSync(filePath);
    const fileName = filePath;

    ws.once("message", (message) => {
      const response = JSON.parse(message);
      try {
        expect(response.error).toBeFalsy();
        expect(response.status).toBe(201);

        // Verify the file was saved with an extension
        const uploadedFiles = fs.readdirSync(directories.output);
        const uploadedFile = uploadedFiles.find((file) =>
          file.includes("test")
        );
        expect(uploadedFile).toBeDefined();
        done();
      } catch (error) {
        done(error);
      }
    });

    ws.send(
      JSON.stringify({
        fileName: "test" + path.parse(fileName).ext,
        file: fileBuffer.toString("base64"),
      })
    );
  }, 10000);

  it("should return an error if no file is uploaded", (done) => {
    ws.once("message", (message) => {
      const response = JSON.parse(message);
      try {
        expect(response.error).toBeTruthy();
        expect(response.data.message).toBeDefined();
        expect(response.status).toBe(400);
        done();
      } catch (error) {
        done(error);
      }
    });

    ws.send(JSON.stringify({ fileName: "test.jpg" }));
  }, 10000);

  it("should return an error message for an invalid file", (done) => {
    const filePath = path.join(__dirname, "./files/blank.pdf");
    const fileBuffer = fs.readFileSync(filePath);
    const fileName = filePath;

    ws.once("message", (message) => {
      const response = JSON.parse(message);
      try {
        expect(response.error).toBeTruthy();
        expect(response.status).toBe(400);
        done();
      } catch (error) {
        done(error);
      }
    });

    ws.send(
      JSON.stringify({
        fileName,
        file: fileBuffer.toString("base64"),
      })
    );
  }, 10000);
});

it("should return 404 error", async () => {
  const response = await request(app).post("/404");
  expect(response.status).toBe(404);
});
