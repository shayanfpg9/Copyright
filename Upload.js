const sharp = require("sharp");
const fs = require("fs");
const { parse, join } = require("path");
const { watch } = require("chokidar");
const mime = require("mime-types");
const { colorize: c } = require("./scripts/colorful");
const { watermark } = require("./scripts/watermark");
const moment = require("moment-jalaali");
const useFont = require("./fonts/useFont");
const round = require("./scripts/round");

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
    const minWidth = Math.abs(450 - size.width);

    const canvas = sharp({
      create: {
        width: size.width + space + minWidth,
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

    const font = "Archivo";
    const attrs = `x="50%" font-family="${font}" fill="#031D44" dominant-baseline="middle" text-anchor="middle"`;

    const imageSize = 50;
    const imageSrc = await round(
      join(__dirname, "./logos/logo.jpg"),
      imageSize
    );

    await canvas
      .composite([
        {
          input: roundedRec,
          left: Math.floor((space + minWidth) / 2),
          top: Math.floor(space / 2),
        },
        {
          input: Buffer.from(`
            <svg width="${size.width + space + minWidth}" height="${space / 2}">
              <style type="text/css">
                @font-face {
                    font-family: '${font}';
                    src: url('${useFont(font)}') format('woff');
                }
              </style>
              <text ${attrs} y="50%" font-size="40">
                  File name
              </text>
              <text ${attrs} y="90%" font-size="30">
                  Creator
              </text>
            </svg>
          `),
          top: 0,
          left: 0,
        },
        {
          input: Buffer.from(`
            <svg width="${size.width + space + minWidth}" height="${space / 2}">
              <style type="text/css">
                @font-face {
                    font-family: '${font}';
                    src: url('${useFont(font)}') format('woff');
                }
              </style>
              <text ${attrs} y="50%" font-size="30">
                  ${moment().format("jYYYY/jMM/jDD")}
              </text>
              <text ${attrs} y="90%" font-size="20">
                  Code
              </text>
            </svg>
          `),
          top: size.height + space / 2,
          left: 0,
        },
        {
          input: Buffer.from(`
            <svg width="${size.width + space + minWidth}" height="${space / 2}">
              <style type="text/css">
                @font-face {
                    font-family: '${font}';
                    src: url('${useFont(font)}') format('woff');
                }
              </style>
              <image x="5" y="20%" width="${imageSize}" height="${imageSize}" href="${imageSrc}" />
              <text x="60" y="60%" font-size="22" font-family="${font}" fill="#031D44">
                  @shayanfpg9
              </text>
            </svg>
          `),
          top: size.height + space / 2,
          left: 0,
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
