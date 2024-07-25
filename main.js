const sharp = require("sharp");
const fs = require("fs");
const { parse, join } = require("path");
const { watch } = require("chokidar");
const mime = require("mime-types");
const { colorize: c } = require("./scripts/colorful");
const { watermark } = require("./scripts/watermark");
const moment = require("moment-jalaali");

moment.locale("fa");
moment.loadPersian();

const directories = {
  input: join(__dirname, "./temp"),
  output: join(__dirname, "./output"),
};

if (process.env.JEST_WORKER_ID) {
  directories.input = join(__dirname, "./__tests__/temp");
  directories.output = join(__dirname, "./__tests__/output");
}

if (!fs.existsSync(directories.output)) {
  fs.mkdirSync(directories.output, { recursive: true });
}

const watcher = watch(directories.input, { persistent: true });
const corner = 50;
const space = 150;

async function SaveFile(file) {
  const path = parse(file);
  const outputPath = join(directories.output, path.base.replace(" ", "-"));

  // eslint-disable-next-line no-console
  console.log(`Start operation with ${c(path.name, "BGcyan")} photo...`);

  try {
    const image = await sharp(file).png().blur(10).toBuffer();
    const metadata = await sharp(file).metadata();
    const size = { width: metadata.width, height: metadata.height };
    const watermarkBuffer = Buffer.from(
      await watermark({ ...size, file }, "@username", "./logos/profile.png")
    );

    const canvas = sharp({
      create: {
        width: size.width + space,
        height: size.height + space,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    });

    const roundedRec = await sharp(image)
      .composite([
        {
          input: watermarkBuffer,
          gravity: "southeast",
          opacity: 0.8,
        },
        {
          input: Buffer.from(
            `<svg width="${size.width}" height="${size.height}">
                <rect x="0" y="0" width="${size.width}" height="${size.height}" rx="${corner}" ry="${corner}" fill="none" stroke="#04395e" stroke-width="20"/>
            </svg>`
          ),
        },
        {
          input: Buffer.from(
            `<svg width="${size.width}" height="${size.height}">
                <rect x="0" y="0" width="${size.width}" height="${size.height}" rx="${corner}" ry="${corner}"/>
            </svg>`
          ),
          blend: "dest-in",
        },
      ])
      .toBuffer();

    await canvas
      .composite([
        {
          input: roundedRec,
          left: Math.floor(space / 2),
          top: Math.floor(space / 2),
        },
      ])
      .toFile(outputPath);

    // eslint-disable-next-line no-console
    console.log(c("Processed and saved: ", "green") + outputPath);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Error processing file "${path.name}":`, error);
  }
}

const action = watcher
  .on("add", async (file) => {
    const mimeType = mime.lookup(file);
    if (mimeType && mimeType.startsWith("image/")) {
      // eslint-disable-next-line no-console
      console.log(c("File added: ", "green") + file);
      await SaveFile(file);
    }
  })
  // eslint-disable-next-line no-console
  .on("error", (error) => console.error(`Watcher error: ${error}`));

// eslint-disable-next-line no-console
if (process.env.JEST_WORKER_ID) console.log = () => {};

module.exports = { SaveFile, action };
