const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

const EFFECTS = [
  "https://en.ephoto360.com/light-text-effect-futuristic-technology-style-648.html",
  "https://en.ephoto360.com/colorful-smoke-text-effect-online-569.html",
  "https://en.ephoto360.com/golden-text-effect-online-399.html",
  "https://en.ephoto360.com/3d-text-effect-online-607.html",
  "https://en.ephoto360.com/fire-text-effect-online-359.html",
  "https://en.ephoto360.com/neon-text-effect-online-554.html",
  "https://en.ephoto360.com/ice-frozen-text-effect-online-611.html",
  "https://en.ephoto360.com/thunder-lightning-text-effect-online-673.html",
];

module.exports = {
  config: {
    name: "ephoto",
    aliases: ["ephoto360", "textfx"],
    version: "2.0.0",
    credits: "Raza",
    description: "Generate stylish text effects using Ephoto360",
    usage: ".ephoto [text]\nExample: .ephoto Raza",
    category: "AI Tools",
    hasPrefix: true,
    cooldown: 15
  },

  async run({ api, event, args }) {
    const { threadID, messageID } = event;
    const text = args.join(" ").trim();

    if (!text) {
      return api.sendMessage(
        "❌ Please provide text.\nUsage: .ephoto [text]\nExample: .ephoto Raza",
        threadID, messageID
      );
    }

    try {
      api.sendMessage(`✍️ Creating text effect for "${text}"... please wait ✨`, threadID, messageID);

      const effectUrl = EFFECTS[Math.floor(Math.random() * EFFECTS.length)];
      const apiUrl = `https://apiskeith.vercel.app/logo/ephoto?url=${encodeURIComponent(effectUrl)}&text1=${encodeURIComponent(text)}`;

      const response = await axios.get(apiUrl, { timeout: 120000 });
      const data = response.data;

      if (!data?.status || !data?.result?.download_url) {
        return api.sendMessage(`❌ Failed to generate text effect. Please try again.`, threadID, messageID);
      }

      const resultUrl = data.result.download_url;
      const cacheDir = path.join(__dirname, "cache");
      fs.ensureDirSync(cacheDir);
      const outputPath = path.join(cacheDir, `ephoto_${Date.now()}.jpg`);

      const imgData = await axios.get(resultUrl, { responseType: 'arraybuffer', timeout: 60000 });
      fs.writeFileSync(outputPath, Buffer.from(imgData.data));

      return api.sendMessage({
        body: `✨ Text Effect Generated!\n📝 Text: ${text}\n\n📸 Credits: Raza`,
        attachment: fs.createReadStream(outputPath)
      }, threadID, () => {
        setTimeout(() => {
          try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); } catch (e) {}
        }, 3000);
      }, messageID);

    } catch (error) {
      console.error("[ephoto]", error.message);
      return api.sendMessage("❌ An error occurred: " + error.message, threadID, messageID);
    }
  }
};
