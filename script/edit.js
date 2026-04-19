const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: "edit",
    aliases: [],
    version: "4.0.0",
    credits: "Raza",
    description: "AI Image Editor - Edit images with a prompt using AI",
    usage: "reply to an image with: edit [prompt]\nExample: .edit make it girl",
    category: "AI Tools",
    hasPrefix: true,
    cooldown: 20
  },

  async run({ api, event, args }) {
    const { threadID, messageID, type, messageReply } = event;
    const prompt = args.join(" ").trim();

    if (!prompt) {
      return api.sendMessage(
        "❌ Please provide a prompt.\nUsage: reply to an image with .edit [prompt]\nExample: .edit make it girl",
        threadID, messageID
      );
    }

    if (
      type !== "message_reply" ||
      !messageReply ||
      !messageReply.attachments ||
      messageReply.attachments.length === 0 ||
      messageReply.attachments[0].type !== "photo"
    ) {
      return api.sendMessage(
        "❌ Please reply to an image with '.edit <prompt>'",
        threadID, messageID
      );
    }

    try {
      api.sendMessage("🎨 Editing your image... please wait ✨", threadID, messageID);

      const imageUrl = messageReply.attachments[0].url;
      const apiUrl = `https://apiskeith.vercel.app/ai/imageedit?q=${encodeURIComponent(prompt)}&url=${encodeURIComponent(imageUrl)}`;

      const response = await axios.get(apiUrl, { timeout: 120000 });
      const data = response.data;

      if (!data?.status || !data?.result) {
        return api.sendMessage("❌ Failed to edit image. Please try again.", threadID, messageID);
      }

      const resultUrl = data.result;
      const cacheDir = path.join(__dirname, "cache");
      fs.ensureDirSync(cacheDir);
      const outputPath = path.join(cacheDir, `edited_${Date.now()}.jpg`);

      const imgData = await axios.get(resultUrl, { responseType: 'arraybuffer', timeout: 60000 });
      fs.writeFileSync(outputPath, Buffer.from(imgData.data));

      return api.sendMessage({
        body: "✨ Image edited successfully!\n\n📸 Credits: Raza",
        attachment: fs.createReadStream(outputPath)
      }, threadID, () => {
        setTimeout(() => {
          try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); } catch (e) {}
        }, 3000);
      }, messageID);

    } catch (error) {
      console.error("[edit]", error.message);
      return api.sendMessage("❌ An error occurred: " + error.message, threadID, messageID);
    }
  }
};
