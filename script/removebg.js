const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "removebg",
  version: "2.0.0",
  role: 0,
  credits: "Raza",
  aliases: [],
  usages: "< reply to image >",
  cooldown: 5,
};

module.exports.run = async ({ api, event }) => {
  const { threadID, messageID, messageReply } = event;
  const cacheDir = path.join(__dirname, "cache");
  fs.ensureDirSync(cacheDir);
  const tempPath = path.join(cacheDir, `nobg_${Date.now()}.png`);

  if (!messageReply || !messageReply.attachments || messageReply.attachments.length === 0) {
    return api.sendMessage("❌ Please reply to an image to remove its background.", threadID, messageID);
  }

  const attachment = messageReply.attachments[0];
  if (attachment.type !== "photo") {
    return api.sendMessage("❌ The replied message must be a photo.", threadID, messageID);
  }

  const imageUrl = attachment.url;
  const apiUrl = `https://apiskeith.vercel.app/ai/removebg?url=${encodeURIComponent(imageUrl)}`;

  try {
    api.sendMessage("⌛ Removing background, please wait...", threadID, messageID);

    const response = await axios.get(apiUrl, { timeout: 60000 });
    const data = response.data;

    if (!data?.status || !data?.result) {
      return api.sendMessage(`❌ Failed to remove background. Reason: ${data?.message || 'Unknown error'}`, threadID, messageID);
    }

    const resultUrl = data.result;

    const imageData = await axios.get(resultUrl, { responseType: "arraybuffer", timeout: 60000 });
    fs.writeFileSync(tempPath, Buffer.from(imageData.data, "binary"));

    api.sendMessage({
      body: "✅ Background removed successfully!\n\n📸 Credits: Raza",
      attachment: fs.createReadStream(tempPath)
    }, threadID, () => {
      setTimeout(() => {
        try { if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath); } catch (e) {}
      }, 3000);
    }, messageID);

  } catch (err) {
    console.error("[removebg]", err.message);
    api.sendMessage("❌ An error occurred while removing the background. Please try again later.", threadID, messageID);
  }
};
