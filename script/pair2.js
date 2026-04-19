const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { Jimp } = require("jimp");

module.exports.config = {
  name: "pair2",
  version: "3.0.0",
  hasPermssion: 0,
  role: 0,
  hasPrefix: true,
  credits: "KASHIF RAZA",
  description: "Create a romantic pair edit with golden circles",
  commandCategory: "Love",
  usages: "[@mention optional]",
  cooldowns: 5,
  cooldown: 5,
};

const cacheDir = path.join(__dirname, "cache", "canvas");
const templateUrl = "https://i.ibb.co/Zptb9xJ2/803a8e8cc475.jpg";
const templatePath = path.join(cacheDir, "pair2_template.png");

const romanticMessages = [
  "𝒀𝒐𝒖 𝒂𝒓𝒆 𝒎𝒚 𝒔𝒖𝒏𝒔𝒉𝒊𝒏𝒆 ☀️",
  "𝑺𝒕𝒂𝒓𝒔 𝒂𝒍𝒊𝒈𝒏𝒆𝒅 𝒇𝒐𝒓 𝒖𝒔 ⭐",
  "𝑫𝒆𝒔𝒕𝒊𝒏𝒆𝒅 𝒕𝒐 𝒃𝒆 𝒕𝒐𝒈𝒆𝒕𝒉𝒆𝒓 💫",
  "𝑴𝒚 𝒉𝒆𝒂𝒓𝒕 𝒃𝒆𝒂𝒕𝒔 𝒇𝒐𝒓 𝒚𝒐𝒖 💓",
  "𝑳𝒐𝒗𝒆 𝒃𝒆𝒚𝒐𝒏𝒅 𝒘𝒐𝒓𝒅𝒔 💘",
  "𝒀𝒐𝒖 𝒄𝒐𝒎𝒑𝒍𝒆𝒕𝒆 𝒎𝒆 💕",
  "𝑭𝒐𝒓𝒆𝒗𝒆𝒓 𝒂𝒏𝒅 𝒂𝒍𝒘𝒂𝒚𝒔 💝",
  "𝑴𝒚 𝒔𝒐𝒖𝒍𝒎𝒂𝒕𝒆 🖤✨"
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
      makeCircularImage(avatarOne, 230),
      makeCircularImage(avatarTwo, 230)
    ]);

    const template = await Jimp.read(templatePath);
    template.composite(circleOne, 10, 5);
    template.composite(circleTwo, 245, 5);

    const outputPath = path.join(cacheDir, `pair2_${one}_${two}_${Date.now()}.png`);
    await template.write(outputPath);

    const [infoOne, infoTwo] = await Promise.all([getUserInfo(api, one), getUserInfo(api, two)]);
    const nameOne = infoOne.name || infoOne.firstName || 'User';
    const nameTwo = infoTwo.name || infoTwo.firstName || 'User';
    const randomMsg = romanticMessages[Math.floor(Math.random() * romanticMessages.length)];

    api.sendMessage(
      {
        body: `❂━━❂━━❂━━❂━━❂\n\n${randomMsg}\n\n👤 ${nameOne}\n✨ 𝑷𝑨𝑰𝑹𝑬𝑫 𝑾𝑰𝑻𝑯 ✨\n👤 ${nameTwo}\n\n❂━━❂━━❂━━❂━━❂`,
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
    console.error("Pair2 command error:", error);
    if (fs.existsSync(templatePath)) {
      try { fs.unlinkSync(templatePath); } catch (e) {}
    }
    api.sendMessage("❂━━❂━━❂━━❂━━❂\n❌ 𝑬𝒓𝒓𝒐𝒓 𝒄𝒓𝒆𝒂𝒕𝒊𝒏𝒈 𝒑𝒂𝒊𝒓!\n❂━━❂━━❂━━❂━━❂", threadID, messageID);
  }
};
