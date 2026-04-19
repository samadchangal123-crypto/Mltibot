const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: "upscale",
    aliases: ["enhance", "hd"],
    version: "1.0.0",
    credits: "RAZA",
    description: "Upscale/enhance image quality",
    category: "Image",
    usage: "reply to image with: upscale [method:1-5, default 3]",
    hasPrefix: true,
    cooldown: 15
  },

  async run({ api, event, args }) {
    const { threadID, messageID, type, messageReply } = event;

    if (type !== "message_reply" || !messageReply || !messageReply.attachments || !messageReply.attachments[0] || messageReply.attachments[0].type !== "photo") {
      return api.sendMessage("❌ 𝑷𝒍𝒆𝒂𝒔𝒆 𝒓𝒆𝒑𝒍𝒚 𝒕𝒐 𝒂𝒏 𝒊𝒎𝒂𝒈𝒆 𝒘𝒊𝒕𝒉 'upscale'", threadID, messageID);
    }

    const method = parseInt(args[0]) || 3;
    if (method < 1 || method > 5) {
      return api.sendMessage("❌ 𝑴𝒆𝒕𝒉𝒐𝒅 𝒎𝒖𝒔𝒕 𝒃𝒆 𝒃𝒆𝒕𝒘𝒆𝒆𝒏 1-5", threadID, messageID);
    }

    try {
      api.sendMessage("🔧 𝑼𝒑𝒔𝒄𝒂𝒍𝒊𝒏𝒈 𝒊𝒎𝒂𝒈𝒆... 𝒑𝒍𝒆𝒂𝒔𝒆 𝒘𝒂𝒊𝒕", threadID);

      const cacheDir = path.join(__dirname, 'cache');
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

      const imageUrl = messageReply.attachments[0].url;
      const imageBuffer = await enhanceImage(imageUrl, method);
      const imagePath = path.join(cacheDir, `upscaled_${Date.now()}.jpg`);
      fs.writeFileSync(imagePath, imageBuffer);

      return api.sendMessage({
        body: `✨ 𝑰𝒎𝒂𝒈𝒆 𝑼𝒑𝒔𝒄𝒂𝒍𝒆𝒅 (𝑴𝒆𝒕𝒉𝒐𝒅 ${method})`,
        attachment: fs.createReadStream(imagePath)
      }, threadID, () => {
        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      }, messageID);

    } catch (error) {
      console.error("Upscale command error:", error);
      return api.sendMessage(`❌ 𝑬𝒓𝒓𝒐𝒓: ${error.message}`, threadID, messageID);
    }
  }
};

async function enhanceImage(imageUrl, method) {
  const FormData = require('form-data');
  const img = await axios.get(imageUrl, { responseType: 'arraybuffer' });

  const form = new FormData();
  form.append('method', method.toString());
  form.append('is_pro_version', 'false');
  form.append('is_enhancing_more', 'false');
  form.append('max_image_size', 'high');
  form.append('file', Buffer.from(img.data), 'image.jpg');

  const res = await axios.post('https://ihancer.com/api/enhance', form, {
    headers: { ...form.getHeaders(), 'user-agent': 'Dart/3.5 (dart:io)' },
    responseType: 'arraybuffer'
  });

  return Buffer.from(res.data);
}
