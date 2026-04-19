const fs = require('fs-extra');
const axios = require('axios');
const path = require('path');
const { Jimp, JimpMime } = require('jimp');

module.exports.config = {
  name: 'plove',
  aliases: [],
  version: '5.0.0',
  credits: 'Raza',
  description: 'Pairing with love template image',
  category: 'fun',
  hasPrefix: true,
  cooldown: 10,
  usage: '[@tag]'
};

const cacheDir = path.join(__dirname, 'cache', 'canvas');
const templateUrl = "https://i.ibb.co/gZKWkVwb/OUKnbB6.jpg";
const templatePath = path.join(cacheDir, 'pairlv.jpeg');

async function downloadTemplate() {
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
  if (!fs.existsSync(templatePath)) {
    const response = await axios.get(templateUrl, { responseType: 'arraybuffer', timeout: 20000 });
    fs.writeFileSync(templatePath, Buffer.from(response.data));
  }
}

async function makeCircular(buffer, size) {
  const image = await Jimp.read(buffer);
  image.resize({ w: size, h: size });
  const mask = new Jimp({ width: size, height: size, color: 0x00000000 });
  const center = size / 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (Math.sqrt((x - center) ** 2 + (y - center) ** 2) <= center) {
        mask.setPixelColor(0xFFFFFFFF, x, y);
      }
    }
  }
  image.mask(mask, 0, 0);
  return image;
}

async function makeImage({ one, two }) {
  const [bufOne, bufTwo] = await Promise.all([
    axios.get(`https://graph.facebook.com/${one}/picture?width=200&height=200&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: 'arraybuffer', timeout: 15000 }).then(r => Buffer.from(r.data)),
    axios.get(`https://graph.facebook.com/${two}/picture?width=400&height=400&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: 'arraybuffer', timeout: 15000 }).then(r => Buffer.from(r.data))
  ]);

  const batgiam_img = await Jimp.read(templatePath);
  const [circleOne, circleTwo] = await Promise.all([makeCircular(bufOne, 190), makeCircular(bufTwo, 199)]);

  batgiam_img
    .composite(circleOne.resize({ w: 190, h: 200 }), 62, 90)
    .composite(circleTwo.resize({ w: 199, h: 210 }), 405, 90);

  const pathImg = path.join(cacheDir, `plove_${one}_${two}_${Date.now()}.png`);
  const raw = await batgiam_img.getBuffer(JimpMime.png);
  fs.writeFileSync(pathImg, raw);
  return pathImg;
}

module.exports.run = async function ({ event, api }) {
  const { threadID, messageID, senderID } = event;

  const mention = Object.keys(event.mentions || {})[0];
  if (!mention) {
    return api.sendMessage("❌ Please tag someone to pair with!", threadID, messageID);
  }

  try {
    await downloadTemplate();
    const image = await makeImage({ one: senderID, two: mention });
    return api.sendMessage({
      body: "💑 Perfect Match!",
      attachment: fs.createReadStream(image)
    }, threadID, () => {
      try { fs.unlinkSync(image); } catch (e) {}
    }, messageID);
  } catch (error) {
    console.error("Plove error:", error);
    if (fs.existsSync(templatePath)) {
      try { fs.unlinkSync(templatePath); } catch (e) {}
    }
    return api.sendMessage("❌ Error creating pairing image.", threadID, messageID);
  }
};
