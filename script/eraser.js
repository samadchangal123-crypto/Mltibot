const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: "eraser",
    aliases: ["erase", "removebg2"],
    version: "1.0.0",
    credits: "RAZA",
    description: "Remove objects from image using AI (Magic Eraser)",
    category: "Image",
    usage: "reply to image with: eraser <description of what to remove>",
    hasPrefix: true,
    cooldown: 15
  },

  async run({ api, event, args }) {
    const { threadID, messageID, type, messageReply } = event;

    if (type !== "message_reply" || !messageReply || !messageReply.attachments || !messageReply.attachments[0] || messageReply.attachments[0].type !== "photo") {
      return api.sendMessage("❌ 𝑷𝒍𝒆𝒂𝒔𝒆 𝒓𝒆𝒑𝒍𝒚 𝒕𝒐 𝒂𝒏 𝒊𝒎𝒂𝒈𝒆 𝒘𝒊𝒕𝒉 '𝒆𝒓𝒂𝒔𝒆𝒓 <𝒅𝒆𝒔𝒄𝒓𝒊𝒑𝒕𝒊𝒐𝒏>'", threadID, messageID);
    }

    const prompt = args.join(' ').trim();
    if (!prompt) {
      return api.sendMessage("❌ 𝑷𝒍𝒆𝒂𝒔𝒆 𝒑𝒓𝒐𝒗𝒊𝒅𝒆 𝒘𝒉𝒂𝒕 𝒕𝒐 𝒓𝒆𝒎𝒐𝒗𝒆\n𝑬𝒙𝒂𝒎𝒑𝒍𝒆: 𝒆𝒓𝒂𝒔𝒆𝒓 𝒑𝒆𝒓𝒔𝒐𝒏 𝒊𝒏 𝒃𝒂𝒄𝒌𝒈𝒓𝒐𝒖𝒏𝒅", threadID, messageID);
    }

    try {
      api.sendMessage("⏳ 𝑷𝒓𝒐𝒄𝒆𝒔𝒔𝒊𝒏𝒈 𝒊𝒎𝒂𝒈𝒆... 𝒕𝒉𝒊𝒔 𝒎𝒂𝒚 𝒕𝒂𝒌𝒆 10-30 𝒔𝒆𝒄𝒐𝒏𝒅𝒔", threadID);

      const imageUrl = messageReply.attachments[0].url;
      const resultUrl = await magicEraser(imageUrl, prompt);

      const cacheDir = path.join(__dirname, 'cache');
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

      const resultImg = await axios.get(resultUrl, { responseType: 'arraybuffer', timeout: 60000 });
      const imagePath = path.join(cacheDir, `erased_${Date.now()}.png`);
      fs.writeFileSync(imagePath, Buffer.from(resultImg.data));

      return api.sendMessage({
        body: `✨ 𝑶𝒃𝒋𝒆𝒄𝒕 𝑹𝒆𝒎𝒐𝒗𝒆𝒅\n\n𝑹𝒆𝒎𝒐𝒗𝒆𝒅: ${prompt}`,
        attachment: fs.createReadStream(imagePath)
      }, threadID, () => {
        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      }, messageID);

    } catch (error) {
      console.error("Eraser command error:", error);
      return api.sendMessage(`❌ 𝑬𝒓𝒓𝒐𝒓: ${error.message}`, threadID, messageID);
    }
  }
};

async function magicEraser(imageUrl, prompt) {
  const FormData = require('form-data');
  const { tmpdir } = require('os');

  const imgRes = await axios.get(imageUrl, { responseType: 'arraybuffer' });
  const imgBuffer = Buffer.from(imgRes.data);

  const form = new FormData();
  form.append('image', imgBuffer, { filename: 'image.jpg', contentType: imgRes.headers['content-type'] || 'image/jpeg' });
  form.append('prompt', prompt);

  const res = await axios.post('https://api.magiceraser.io/erase', form, {
    headers: { ...form.getHeaders(), 'user-agent': 'Mozilla/5.0' },
    timeout: 60000
  });

  if (!res.data || !res.data.url) throw new Error('Failed to erase object');
  return res.data.url;
}
