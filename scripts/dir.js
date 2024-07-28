const fs = require("fs");
const { join } = require("path");

const directories = (groupId = "") => ({
  input: join(__dirname, "../temp"),
  output: join(__dirname, "../client/datas/" + groupId),
});

if (process.env.JEST_WORKER_ID) {
  directories.input = join(__dirname, "../__tests__/temp");
  directories.output = join(__dirname, "../__tests__/output");
}

if (!fs.existsSync(directories.output)) {
  fs.mkdirSync(directories.output, { recursive: true });
}

module.exports = directories;