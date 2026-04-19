const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { Jimp } = require("jimp");

module.exports.config = {
  name: "pair",
  version: "2.0.0",
  role: 0,
  hasPrefix: true,
  credits: "KASHIF RAZA",
  description: "Create a romantic pair edit with profile pics",
  category: "Love",
  usage: "pair [@mention optional]",
  cooldown: 10,
};

const cacheDir = path.join(__dirname, "cache");
const templateUrl = "https://i.ibb.co/nMcPznDm/d57df01d663b.jpg";
const templatePath = path.join(cacheDir, "pair_new_template.png");

const maleNames = ["ali", "ahmed", "muhammad", "hassan", "hussain", "kashif", "raza", "usman", "bilal", "hamza", "asad", "zain", "fahad", "faisal", "imran", "kamran", "adnan", "arslan", "waqas", "waseem", "irfan", "junaid", "khalid", "nadeem", "naveed", "omer", "qasim", "rizwan", "sajid", "salman", "shahid", "tariq", "umar", "yasir", "zahid"];
const femaleNames = ["fatima", "ayesha", "maria", "sana", "hira", "zara", "maryam", "khadija", "sara", "amina", "bushra", "farah", "iqra", "javeria", "kinza", "laiba", "maham", "nadia", "rabia", "saima", "tahira", "uzma", "zainab", "anam", "asma", "dua", "esha", "fiza", "huma", "iram"];
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
    const response = await axios.get(templateUrl, { responseType: "arraybuffer" });
    fs.writeFileSync(templatePath, Buffer.from(response.data));
  }
}

async function getAvatar(uid) {
  const url = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
  const response = await axios.get(url, { responseType: "arraybuffer" });
  return Buffer.from(response.data);
}

async function makeCircularImage(buffer, size) {
  const image = await Jimp.read(buffer);
  image.resize({ w: size, h: size });
  const mask = new Jimp({ width: size, height: size, color: 0x00000000 });
  const center = size / 2;
  const radius = size / 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dist = Math.sqrt((x - center) ** 2 + (y - center) ** 2);
      if (dist <= radius) mask.setPixelColor(0xFFFFFFFF, x, y);
    }
  }
  image.mask(mask, 0, 0);
  return image;
}

function detectGender(name) {
  const lowerName = name.toLowerCase();
  if (femaleNames.some(n => lowerName.includes(n))) return "female";
  if (maleNames.some(n => lowerName.includes(n))) return "male";
  return "unknown";
}

async function getUserInfo(api, uid) {
  return new Promise((resolve) => {
    api.getUserInfo(uid, (err, info) => {
      if (err) return resolve({});
      resolve(info[uid] || {});
    });
  });
}

function isValidName(name) {
  if (!name || name.trim() === '') return false;
  const lower = name.toLowerCase();
  return lower !== 'facebook' && !lower.includes('facebook user') && lower !== 'unknown' && lower !== 'user';
}

async function getProperName(api, uid) {
  const info = await getUserInfo(api, uid);
  if (isValidName(info.name)) return info.name;
  if (isValidName(info.firstName)) return info.firstName;
  return 'Jaan';
}

module.exports.run = async ({ api, event }) => {
  const { threadID, messageID, senderID } = event;
  const mention = Object.keys(event.mentions);

  try {
    await downloadTemplate();

    let one = senderID;
    let two;
    let senderInfo = await getUserInfo(api, senderID);
    let senderGender = senderInfo.gender === 1 ? "female" : senderInfo.gender === 2 ? "male" : detectGender(senderInfo.name || "");

    if (mention[0]) {
      two = mention[0];
    } else {
      const threadInfo = await new Promise(resolve => api.getThreadInfo(threadID, (err, info) => resolve(err ? {} : info)));
      const members = (threadInfo.participantIDs || []).filter(m => m !== senderID);
      if (members.length === 0) {
        return api.sendMessage("❂━━❂━━❂━━❂━━❂\n❌ 𝑵𝒐 𝒎𝒆𝒎𝒃𝒆𝒓𝒔 𝒇𝒐𝒖𝒏𝒅 𝒕𝒐 𝒑𝒂𝒊𝒓!\n❂━━❂━━❂━━❂━━❂", threadID, messageID);
      }
      let oppositeGenderMembers = [];
      for (const uid of members) {
        const info = await getUserInfo(api, uid);
        const memberGender = info.gender === 1 ? "female" : info.gender === 2 ? "male" : detectGender(info.name || "");
        if ((senderGender === "male" && memberGender === "female") || (senderGender === "female" && memberGender === "male") || senderGender === "unknown" || memberGender === "unknown") {
          oppositeGenderMembers.push(uid);
        }
      }
      if (oppositeGenderMembers.length === 0) oppositeGenderMembers = members;
      two = oppositeGenderMembers[Math.floor(Math.random() * oppositeGenderMembers.length)];
    }

    const avatarOne = await getAvatar(one);
    const avatarTwo = await getAvatar(two);
    const circleOne = await makeCircularImage(avatarOne, 280);
    const circleTwo = await makeCircularImage(avatarTwo, 280);
    const template = await Jimp.read(templatePath);
    template.composite(circleOne, 63, 80);
    template.composite(circleTwo, 525, 88);

    const outputPath = path.join(cacheDir, `pair_${one}_${two}_${Date.now()}.png`);
    await template.write(outputPath);

    let nameOne = await getProperName(api, one);
    let nameTwo = await getProperName(api, two);
    const randomMsg = romanticMessages[Math.floor(Math.random() * romanticMessages.length)];

    api.sendMessage({
      body: `❂━━❂━━❂━━❂━━❂\n\n${randomMsg}\n\n👤 ${nameOne}\n💕 𝑷𝑨𝑰𝑹𝑬𝑫 𝑾𝑰𝑻𝑯 💕\n👤 ${nameTwo}\n\n❂━━❂━━❂━━❂━━❂`,
      attachment: fs.createReadStream(outputPath),
      mentions: [{ tag: nameOne, id: one }, { tag: nameTwo, id: two }]
    }, threadID, () => { try { fs.unlinkSync(outputPath); } catch(e){} }, messageID);

  } catch (error) {
    console.error("Pair command error:", error);
    api.sendMessage("❂━━❂━━❂━━❂━━❂\n❌ 𝑬𝒓𝒓𝒐𝒓 𝒄𝒓𝒆𝒂𝒕𝒊𝒏𝒈 𝒑𝒂𝒊𝒓!\n❂━━❂━━❂━━❂━━❂", threadID, messageID);
  }
};
