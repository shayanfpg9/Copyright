require("dotenv").config();
const express = require("express");
const path = require("path");
const { SaveFile } = require("./Upload");
const fs = require("fs");
const { createServer } = require("http");
const { Server } = require("ws");
const response = require("./scripts/response");
const morgan = require("morgan");
const { default: Ajv } = require("ajv");
const { lookup } = require("mime-types");

const app = express();
const port = process.env.PORT || 3000;
const server = createServer(app);
const wss = new Server({ server });
const ajv = new Ajv();
const uploadPath = !process.env.JEST_WORKER_ID
  ? path.join(__dirname, "./temp")
  : path.join(__dirname, "./__tests__/temp");

// Ensure the upload directory exists
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
  // eslint-disable-next-line no-console
  console.log(`Upload directory created at: ${uploadPath}`);
}

app.use(express.json());

const schema = {
  type: "object",
  properties: {
    fileName: { type: "string" },
    file: { type: "string" },
  },
  required: ["fileName", "file"],
};

wss.on("connection", (ws, req) => {
  // eslint-disable-next-line no-console
  console.log("WebSocket connection established.");

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);
      const mimeType = lookup(data.fileName);

      // Manually validate the data
      const valid = ajv.validate(schema, data);

      if (!valid || !mimeType || !mimeType.startsWith("image/")) {
        response({
          req,
          error: true,
          status: 400,
          message: "The request format is invalid",
          data: ajv.errors,
        }).ws(ws);
        return;
      } else {
        req.message = data;
      }

      const buffer = Buffer.from(data.file, "base64");
      const { ext, name } = path.parse(data.fileName);
      const fileName = `${name}-${Date.now()}${ext}`;
      const filePath = path.join(uploadPath, fileName);

      // Save the file to the upload directory
      fs.writeFile(filePath, buffer, async (err) => {
        if (err) {
          response({
            req,
            error: true,
            status: 500,
            message: "File upload failed.",
          }).ws(ws);

          return;
        }

        try {
          const [file, mime] = await SaveFile(filePath);
          
          response({
            req,
            status: 201,
            message: "File uploaded successfully.",
            data: {
              file: `data:${mime};base64,${file}`,
            },
          }).ws(ws);
        } catch (error) {
          response({
            req,
            error: true,
            status: error.message === "Invalid file type." ? 400 : 500,
            message: "Error in file uploading",
            data: error,
          }).ws(ws);
        }

        fs.unlinkSync(filePath);
      });
    } catch (error) {
      response({
        req,
        error: true,
        status: 500,
        message: "Failed to process upload.",
        data: error,
      }).ws(ws);
    }
  });

  ws.on("close", () => {
    // eslint-disable-next-line no-console
    console.log("WebSocket connection closed.");
  });
});

app.all("*", (req, res) => {
  response({ req, error: true, status: 404, message: "Page not found" }).rest(
    res
  );
});

// Start the server
const connection = server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on port ${port}`);
});

// Clean up on process exit
const cleanup = () => {
  connection.close(() => {
    // eslint-disable-next-line no-console
    console.log("Server closed.");
    wss.clients.forEach((client) => client.terminate());
  });
};

process.on("SIGINT", cleanup); // Handle Ctrl+C
process.on("SIGTERM", cleanup); // Handle termination
process.on("exit", cleanup); // Handle normal exit

// eslint-disable-next-line no-console
if (process.env.JEST_WORKER_ID) console.log = () => {};
else app.use(morgan("dev"));

// Exports for testing
module.exports = { app, cleanup };
