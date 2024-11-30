const sharp = require("sharp");
const fs = require("fs");
const { parse, join } = require("path");
const { colorize: c } = require("./scripts/colorful");
const { watermark } = require("./scripts/watermark");
const moment = require("moment-jalaali");
const useFont = require("./fonts/useFont");
const round = require("./scripts/round");
const { lookup } = require("mime-types");
const directories = new Object(require("./scripts/dir"));

moment.locale("fa");
moment.loadPersian();

const corner = 50;
const space = 200;

const SaveFile = async (file, params) => {
  const path = parse(file);
  let subfolder = "";

  if (!directories.test) subfolder = "/" + params.channelId;

  const outputPath = join(
    directories.output,
    subfolder,
    path.base.replace(" ", "-")
  );
  const mimeType = lookup(file);

  try {
    if (!mimeType || !mimeType.startsWith("image/")) {
      throw new Error("Type is incorrect.");
    }

    // eslint-disable-next-line no-console
    console.log(`Start operation with ${c(path.name, "BGcyan")} photo...`);

    if (!fs.existsSync(directories.output + subfolder))
      fs.mkdirSync(directories.output + subfolder);

    const image = await sharp(file).png().blur(10).toBuffer();
    const metadata = await sharp(file).metadata();
    const size = { width: metadata.width, height: metadata.height };
    const watermarkBuffer = Buffer.from(
      await watermark({ ...size, file }, "@username", "./logos/profile.png")
    );
    const minWidth = Math.abs(550 - size.width);

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
                  ${params.title}
              </text>
              <text ${attrs} y="90%" font-size="30">
                  ${params.creator}
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
                  ${moment(params.date).format("jYYYY/jMM/jDD hh:mm")}
              </text>
              <text ${attrs} y="90%" font-size="30">
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
              <text x="60" y="60%" font-size="30" font-family="${font}" fill="#031D44">
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
    return [fs.readFileSync(outputPath, "base64"), mimeType];
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Error processing file "${path.name}":`, error);
    throw error;
  }
};

/* eslint-disable */
if (process.env.JEST_WORKER_ID) {
  console.log = () => {};
  console.error = () => {};
}

module.exports = { SaveFile };
