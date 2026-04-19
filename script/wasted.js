const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: "wasted",
    aliases: ["waste"],
    version: "1.0.0",
    credits: "RAZA",
    description: "Apply 'wasted' filter to image (GTA style)",
    category: "Image",
    usage: "reply to image with: wasted [top%] [width%]",
    hasPrefix: true,
    cooldown: 10
  },

  async run({ api, event, args }) {
    const { threadID, messageID, type, messageReply } = event;

    if (type !== "message_reply" || !messageReply || !messageReply.attachments || !messageReply.attachments[0] || messageReply.attachments[0].type !== "photo") {
      return api.sendMessage("❌ 𝑷𝒍𝒆𝒂𝒔𝒆 𝒓𝒆𝒑𝒍𝒚 𝒕𝒐 𝒂𝒏 𝒊𝒎𝒂𝒈𝒆 𝒘𝒊𝒕𝒉 'wasted'", threadID, messageID);
    }

    try {
      api.sendMessage("🎬 𝑨𝒑𝒑𝒍𝒚𝒊𝒏𝒈 𝒘𝒂𝒔𝒕𝒆𝒅 𝒆𝒇𝒇𝒆𝒄𝒕...", threadID);

      const cacheDir = path.join(__dirname, 'cache');
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

      const imageUrl = messageReply.attachments[0].url;
      const bannerTop = parseInt(args[0]) || 50;
      const bannerWidth = parseInt(args[1]) || 80;

      const resultUrl = await applyWasted(imageUrl, bannerTop, bannerWidth);
      const resultImg = await axios.get(resultUrl, { responseType: 'arraybuffer' });
      const imagePath = path.join(cacheDir, `wasted_${Date.now()}.png`);
      fs.writeFileSync(imagePath, Buffer.from(resultImg.data));

      return api.sendMessage({
        body: "💀 𝑾𝑨𝑺𝑻𝑬𝑫",
        attachment: fs.createReadStream(imagePath)
      }, threadID, () => {
        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      }, messageID);

    } catch (error) {
      console.error("Wasted command error:", error);
      return api.sendMessage(`❌ 𝑬𝒓𝒓𝒐𝒓: ${error.message}`, threadID, messageID);
    }
  }
};

async function applyWasted(imageUrl, bannerTop, bannerWidth) {
  const FormData = require('form-data');
  const img = await axios.get(imageUrl, { responseType: 'arraybuffer' });

  const form = new FormData();
  form.append('image', img.data, { filename: 'image.jpg', contentType: img.headers['content-type'] || 'image/jpeg' });
  form.append('bannerTopPercent', String(bannerTop));
  form.append('bannerWidthPercent', String(bannerWidth));
  form.append('isPublic', 'true');

  const response = await axios.post('https://wastedgenerator.com/generate', form, {
    headers: {
      ...form.getHeaders(),
      origin: 'https://wastedgenerator.com',
      referer: 'https://wastedgenerator.com/',
      'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
    },
    timeout: 60000
  });

  if (!response.data?.success) {
    throw new Error('Failed to apply wasted effect');
  }

  return 'https://wastedgenerator.com' + response.data.filePath;
}
