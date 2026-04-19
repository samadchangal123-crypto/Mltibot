const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

const DOWNLOAD_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://www.google.com/'
};

async function downloadImage(imgUrl, savePath) {
  const response = await axios.get(imgUrl, {
    responseType: 'arraybuffer',
    timeout: 12000,
    headers: DOWNLOAD_HEADERS
  });
  const contentType = response.headers['content-type'] || '';
  if (!contentType.includes('image')) throw new Error('Not an image');
  const buf = Buffer.from(response.data);
  if (buf.length < 1000) throw new Error('Image too small');
  fs.writeFileSync(savePath, buf);
  return true;
}

module.exports = {
  config: {
    name: "pinterest",
    aliases: ["pin"],
    version: "3.0.0",
    credits: "Raza",
    description: "Search and get random images from Pinterest",
    usage: ".pin [query]\nExample: .pin girl dpz",
    category: "Media",
    hasPrefix: true,
    cooldown: 10
  },

  async run({ api, event, args }) {
    const { threadID, messageID } = event;
    const query = args.join(" ").trim();

    if (!query) {
      return api.sendMessage(
        "❌ Please provide a search query.\nUsage: .pin [query]\nExample: .pin girl dpz",
        threadID, messageID
      );
    }

    api.sendMessage(`🔍 Searching Pinterest for "${query}"... please wait`, threadID, messageID);

    const cacheDir = path.join(__dirname, "cache");
    fs.ensureDirSync(cacheDir);

    let allUrls = [];

    try {
      const apiUrl = `https://api.princetechn.com/api/search/googleimage?apikey=prince&query=${encodeURIComponent(query)}`;
      const response = await axios.get(apiUrl, {
        timeout: 30000,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      });
      const data = response.data;

      if (!data?.success || !Array.isArray(data?.results) || data.results.length === 0) {
        return api.sendMessage(`❌ No images found for "${query}". Try a different query.`, threadID, messageID);
      }

      allUrls = data.results.sort(() => Math.random() - 0.5);
    } catch (apiErr) {
      console.error("[pinterest] API error:", apiErr.message);
      return api.sendMessage(`❌ Search failed: ${apiErr.message}\nPlease try again.`, threadID, messageID);
    }

    const attachments = [];
    const tempFiles = [];
    const MAX_IMAGES = 10;

    for (let i = 0; i < allUrls.length && attachments.length < MAX_IMAGES; i++) {
      const imgUrl = allUrls[i];
      try {
        const ext = imgUrl.toLowerCase().includes('.png') ? 'png' : 'jpg';
        const tempPath = path.join(cacheDir, `pin_${Date.now()}_${i}.${ext}`);
        await downloadImage(imgUrl, tempPath);
        attachments.push(fs.createReadStream(tempPath));
        tempFiles.push(tempPath);
      } catch (e) {
        console.warn(`[pinterest] skip (${e.message}): ${imgUrl.slice(0, 60)}`);
      }
    }

    if (attachments.length === 0) {
      return api.sendMessage(
        `❌ Could not download any images for "${query}".\nTry a different search.`,
        threadID, messageID
      );
    }

    return api.sendMessage({
      body: `📌 Pinterest: "${query}"\n🖼️ ${attachments.length} images\n\n📸 Credits: Raza`,
      attachment: attachments
    }, threadID, () => {
      setTimeout(() => {
        for (const f of tempFiles) {
          try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch (e) {}
        }
      }, 5000);
    }, messageID);
  }
};
