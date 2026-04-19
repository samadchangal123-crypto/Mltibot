const fs = require("fs-extra");
const axios = require("axios");
const path = require("path");

module.exports.config = {
  name: "avatar",
  version: "2.0",
  role: 0,
  description: "Show your avatar or tagged user's avatar",
  hasPrefix: true,
  credits: "Kashif Raza",
  cooldown: 5,
  category: "info",
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  const mentionIDs = Object.keys(event.mentions || {});
  const targetID = mentionIDs.length > 0 ? mentionIDs[0] : senderID;

  try {
    const cacheDir = path.join(__dirname, "cache");
    await fs.ensureDir(cacheDir);

    const avatarUrl = `https://graph.facebook.com/${targetID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
    const response = await axios.get(avatarUrl, { responseType: "arraybuffer", timeout: 15000 });
    const imgPath = path.join(cacheDir, `avatar_${targetID}_${Date.now()}.jpg`);
    fs.writeFileSync(imgPath, Buffer.from(response.data));

    let userName = "You";
    if (targetID !== senderID || mentionIDs.length > 0) {
      const info = await new Promise(resolve => {
        api.getUserInfo(targetID, (err, data) => resolve(err ? {} : (data[targetID] || {})));
      });
      userName = info.name || info.firstName || "User";
    }

    api.sendMessage(
      {
        body: `🖼️ Avatar of ${userName}`,
        attachment: fs.createReadStream(imgPath),
      },
      threadID,
      () => { try { fs.unlinkSync(imgPath); } catch (e) {} },
      messageID
    );

  } catch (error) {
    console.error("Avatar error:", error);
    return api.sendMessage("❌ Failed to fetch avatar.", threadID, messageID);
  }
};
