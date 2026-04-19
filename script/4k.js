const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "4k",
    aliases: [],
    description: "Enhance image to 4k using Remini API",
    usage: "reply to an image with 4k",
    category: "Image",
    hasPrefix: true,
    cooldown: 15
  },

  async run({ api, event }) {
    const { threadID, messageID, type, messageReply } = event;

    if (type !== "message_reply" || !messageReply || !messageReply.attachments || messageReply.attachments.length == 0 || messageReply.attachments[0].type !== "photo") {
      return api.sendMessage("❌ 𝑷𝒍𝒆𝒂𝒔𝒆 𝒓𝒆𝒑𝒍𝒚 𝒕𝒐 𝒂𝒏 𝒊𝒎𝒂𝒈𝒆 𝒘𝒊𝒕𝒉 '4𝒌'", threadID, messageID);
    }

    try {
      api.sendMessage("⏳ 𝑬𝒏𝒉𝒂𝒏𝒄𝒊𝒏𝒈 𝒊𝒎𝒂𝒈𝒆 𝒕𝒐 4𝒌... 𝒑𝒍𝒆𝒂𝒔𝒆 𝒘𝒂𝒊𝒕.", threadID, messageID);

      const imageUrl = messageReply.attachments[0].url;
      const res = await axios.get(`https://api.kraza.qzz.io/imagecreator/remini?url=${encodeURIComponent(imageUrl)}`);

      if (!res.data.status || !res.data.result) return api.sendMessage("❌ 𝑭𝒂𝒊𝒍𝒆𝒅 𝒕𝒐 𝒆𝒏𝒉𝒂𝒏𝒄𝒆 𝒊𝒎𝒂𝒈𝒆.", threadID, messageID);

      const resultUrl = res.data.result;
      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
      const outputPath = path.join(cacheDir, `remini_${Date.now()}.jpg`);

      const imageRes = await axios.get(resultUrl, { responseType: 'arraybuffer' });
      fs.writeFileSync(outputPath, Buffer.from(imageRes.data));

      return api.sendMessage({
        body: "✨ 𝑰𝒎𝒂𝒈𝒆 𝒆𝒏𝒉𝒂𝒏𝒄𝒆𝒅 𝒕𝒐 4𝒌!",
        attachment: fs.createReadStream(outputPath)
      }, threadID, () => {
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      }, messageID);

    } catch (error) {
      console.error(error);
      return api.sendMessage("❌ 𝑨𝒏 𝒆𝒓𝒓𝒐𝒓 𝒐𝒄𝒄𝒖𝒓𝒓𝒆𝒅.", threadID, messageID);
    }
  }
};
