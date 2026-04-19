const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: "screenshot",
    aliases: ["ss", "webshot"],
    version: "1.0.0",
    credits: "RAZA",
    description: "Take screenshot of a website",
    category: "Utility",
    usage: "screenshot <URL> [windows/mobile]",
    hasPrefix: true,
    cooldown: 10
  },

  async run({ api, event, args }) {
    const { threadID, messageID } = event;
    const url = args[0];
    const type = args[1]?.toLowerCase() || 'windows';

    if (!url) {
      return api.sendMessage("❌ 𝑼𝒔𝒂𝒈𝒆: screenshot <URL> [windows/mobile]\n\n𝑬𝒙𝒂𝒎𝒑𝒍𝒆: screenshot https://google.com mobile", threadID, messageID);
    }

    if (!url.startsWith('https://') && !url.startsWith('http://')) {
      return api.sendMessage("❌ 𝑼𝑹𝑳 𝒎𝒖𝒔𝒕 𝒔𝒕𝒂𝒓𝒕 𝒘𝒊𝒕𝒉 https:// 𝒐𝒓 http://", threadID, messageID);
    }

    try {
      api.sendMessage(`📸 𝑻𝒂𝒌𝒊𝒏𝒈 𝒔𝒄𝒓𝒆𝒆𝒏𝒔𝒉𝒐𝒕 (${type})...`, threadID);

      const cacheDir = path.join(__dirname, 'cache');
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

      const imageUrl = await generateScreenshot(url, type);
      const imageRes = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      const imagePath = path.join(cacheDir, `screenshot_${Date.now()}.png`);
      fs.writeFileSync(imagePath, Buffer.from(imageRes.data));

      return api.sendMessage({
        body: `📸 𝑾𝒆𝒃𝒔𝒊𝒕𝒆 𝑺𝒄𝒓𝒆𝒆𝒏𝒔𝒉𝒐𝒕\n❂━━❂━━❂━━❂━━❂\n𝑼𝑹𝑳: ${url}`,
        attachment: fs.createReadStream(imagePath)
      }, threadID, () => {
        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      }, messageID);

    } catch (error) {
      console.error("Screenshot command error:", error);
      return api.sendMessage(`❌ 𝑬𝒓𝒓𝒐𝒓: ${error.message}`, threadID, messageID);
    }
  }
};

async function generateScreenshot(url, type) {
  let width = 1920;
  let height = 1080;
  let scale = 1;

  if (type.toLowerCase() === 'mobile') {
    width = 375;
    height = 812;
    scale = 2;
  }

  const payload = {
    url: url.startsWith('https://') || url.startsWith('http://') ? url : 'https://' + url,
    browserWidth: width,
    browserHeight: height,
    fullPage: false,
    deviceScaleFactor: scale,
    format: 'png'
  };

  const { data } = await axios.post('https://gcp.imagy.app/screenshot/createscreenshot', payload, {
    headers: {
      'content-type': 'application/json',
      referer: 'https://imagy.app/full-page-screenshot-taker/',
      'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36'
    }
  });

  if (!data.fileUrl) throw new Error('Failed to generate screenshot');
  return data.fileUrl;
}
