const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: "flux",
    aliases: [],
    version: "1.0.0",
    credits: "Raza",
    description: "Generate AI images using Flux",
    usage: "flux [prompt]\nExample: .flux beautiful sunset",
    category: "AI Tools",
    hasPrefix: true,
    cooldown: 15
  },

  async run({ api, event, args }) {
    const { threadID, messageID } = event;
    const prompt = args.join(" ").trim();

    if (!prompt) {
      return api.sendMessage(
        "❌ Please provide a prompt.\nUsage: .flux [prompt]\nExample: .flux beautiful sunset",
        threadID, messageID
      );
    }

    try {
      api.sendMessage("🖼️ Generating image with Flux AI... please wait ✨", threadID, messageID);

      const cacheDir = path.join(__dirname, "cache");
      fs.ensureDirSync(cacheDir);
      const outputPath = path.join(cacheDir, `flux_${Date.now()}.jpg`);

      const apiUrl = `https://apiskeith.vercel.app/ai/flux?q=${encodeURIComponent(prompt)}`;
      const response = await axios.get(apiUrl, { responseType: 'arraybuffer', timeout: 120000 });

      fs.writeFileSync(outputPath, Buffer.from(response.data));

      return api.sendMessage({
        body: `🎨 Flux AI Generated Image\n📝 Prompt: ${prompt}\n\n📸 Credits: Raza`,
        attachment: fs.createReadStream(outputPath)
      }, threadID, () => {
        setTimeout(() => {
          try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); } catch (e) {}
        }, 3000);
      }, messageID);

    } catch (error) {
      console.error("[flux]", error.message);
      return api.sendMessage("❌ An error occurred while generating the image: " + error.message, threadID, messageID);
    }
  }
};
