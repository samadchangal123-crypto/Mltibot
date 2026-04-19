const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { Jimp } = require("jimp");

module.exports.config = {
  name: "pair3",
  version: "3.0.0",
  hasPermssion: 0,
  role: 0,
  hasPrefix: true,
  credits: "KASHIF RAZA",
  description: "Create a romantic pair edit with profile pics",
  commandCategory: "Love",
  usages: "[@mention optional]",
  cooldowns: 5,
  cooldown: 5,
};

const cacheDir = path.join(__dirname, "cache", "canvas");
const templateUrl = "https://i.ibb.co/q3DDkP9D/9fe55575821c.jpg";
const templatePath = path.join(cacheDir, "pair_template.png");

const romanticMessages = [
  "𝑻𝒘𝒐 𝒔𝒐𝒖𝒍𝒔, 𝒐𝒏𝒆 𝒉𝒆𝒂𝒓𝒕 💖",
  "𝑳𝒐𝒗𝒆 𝒊𝒔 𝒊𝒏 𝒕𝒉𝒆 𝒂𝒊𝒓 💕",
  "𝑷𝒆𝒓𝒇𝒆𝒄𝒕 𝒎𝒂𝒕𝒄𝒉 𝒎𝒂𝒅𝒆 𝒊𝒏 𝒉𝒆𝒂𝒗𝒆𝒏 🌹",
  "𝑻𝒐𝒈𝒆𝒕𝒉𝒆𝒓 𝒇𝒐𝒓𝒆𝒗𝒆𝒓 💞",
  "𝑴𝒚 𝒉𝒆𝒂𝒓𝒕 𝒃𝒆𝒍𝒐𝒏𝒈𝒔 𝒕𝒐 𝒚𝒐𝒖 💗",
  "𝑳𝒐𝒗𝒆 𝒂𝒕 𝒇𝒊𝒓𝒔𝒕 𝒔𝒊𝒈𝒉𝒕 ❤️",
  "𝒀𝒐𝒖 𝒂𝒓𝒆 𝒎𝒚 𝒆𝒗𝒆𝒓𝒚𝒕𝒉𝒊𝒏𝒈 💝",
  "𝑺𝒐𝒖𝒍𝒎𝒂𝒕𝒆𝒔 𝒇𝒐𝒓 𝒍𝒊𝒇𝒆 🥀"
];

async function downloadTemplate() {
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
  if (!fs.existsSync(templatePath)) {
    const response = await axios.get(templateUrl, { responseType: "arraybuffer", timeout: 20000 });
    fs.writeFileSync(templatePath, Buffer.from(response.data));
  }
}

async function getAvatar(uid) {
  const url = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
  const response = await axios.get(url, { responseType: "arraybuffer", timeout: 15000 });
  return Buffer.from(response.data);
}

async function makeCircularImage(buffer, size) {
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

async function getUserInfo(api, uid) {
  return new Promise((resolve) => {
    api.getUserInfo(uid, (err, info) => {
      if (err) return resolve({});
      resolve(info[uid] || {});
    });
  });
}

module.exports.run = async ({ api, event }) => {
  const { threadID, messageID, senderID } = event;
  const mention = Object.keys(event.mentions || {})[0];

  try {
    await downloadTemplate();

    let one = senderID;
    let two;

    if (mention) {
      two = mention;
    } else {
      const threadInfo = await new Promise(resolve => api.getThreadInfo(threadID, (err, info) => resolve(err ? {} : info)));
      const members = (threadInfo.participantIDs || []).filter(m => m !== senderID);
      if (members.length === 0) return api.sendMessage("❂━━❂━━❂━━❂━━❂\n❌ 𝑵𝒐 𝒎𝒆𝒎𝒃𝒆𝒓𝒔 𝒇𝒐𝒖𝒏𝒅 𝒕𝒐 𝒑𝒂𝒊𝒓!\n❂━━❂━━❂━━❂━━❂", threadID, messageID);
      two = members[Math.floor(Math.random() * members.length)];
    }

    const [avatarOne, avatarTwo] = await Promise.all([getAvatar(one), getAvatar(two)]);
    const [circleOne, circleTwo] = await Promise.all([
      makeCircularImage(avatarOne, 117),
      makeCircularImage(avatarTwo, 117)
    ]);

    const template = await Jimp.read(templatePath);
    template.composite(circleOne, 48, 175);
    template.composite(circleTwo, 310, 170);

    const outputPath = path.join(cacheDir, `pair_${one}_${two}_${Date.now()}.png`);
    await template.write(outputPath);

    const [infoOne, infoTwo] = await Promise.all([getUserInfo(api, one), getUserInfo(api, two)]);
    const nameOne = infoOne.name || infoOne.firstName || 'User';
    const nameTwo = infoTwo.name || infoTwo.firstName || 'User';
    const randomMsg = romanticMessages[Math.floor(Math.random() * romanticMessages.length)];

    api.sendMessage(
      {
        body: `❂━━❂━━❂━━❂━━❂\n\n${randomMsg}\n\n👤 ${nameOne}\n💕 𝑷𝑨𝑰𝑹𝑬𝑫 𝑾𝑰𝑻𝑯 💕\n👤 ${nameTwo}\n\n❂━━❂━━❂━━❂━━❂`,
        attachment: fs.createReadStream(outputPath),
        mentions: [
          { tag: nameOne, id: one },
          { tag: nameTwo, id: two }
        ]
      },
      threadID,
      () => { try { fs.unlinkSync(outputPath); } catch (e) {} },
      messageID
    );

  } catch (error) {
    console.error("Pair3 command error:", error);
    if (fs.existsSync(templatePath)) {
      try { fs.unlinkSync(templatePath); } catch (e) {}
    }
    api.sendMessage("❂━━❂━━❂━━❂━━❂\n❌ 𝑬𝒓𝒓𝒐𝒓 𝒄𝒓𝒆𝒂𝒕𝒊𝒏𝒈 𝒑𝒂𝒊𝒓!\n❂━━❂━━❂━━❂━━❂", threadID, messageID);
  }
};
