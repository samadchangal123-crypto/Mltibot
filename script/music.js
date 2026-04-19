const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: "music",
    version: "6.2.0",
    permission: 0,
    hasPrefix: true,
    premium: false,
    category: "media",
    credits: "Kashif Raza",
    description: "Download music from YouTube",
    usage: "music [song name]",
    cooldown: 10
  },

  run: async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    const query = args.join(" ");

    if (!query) {
      return api.sendMessage("❌ Please provide a song name", threadID, messageID);
    }

    const frames = [
      "🩵▰▱▱▱▱▱▱▱▱▱ 10%",
      "💙▰▰▱▱▱▱▱▱▱▱ 25%",
      "💜▰▰▰▰▱▱▱▱▱▱ 45%",
      "💖▰▰▰▰▰▰▱▱▱▱ 70%",
      "💗▰▰▰▰▰▰▰▰▰▰ 100% 😍"
    ];

    let searchMsg;
    try {
      searchMsg = await api.sendMessage(`🔍 Searching: ${query}\n\n${frames[0]}`, threadID);
    } catch(e) {
      return api.sendMessage(`🔍 Searching for: ${query}...`, threadID, messageID);
    }

    const unsend = () => { try { if (searchMsg) api.unsendMessage(searchMsg.messageID); } catch(e) {} };
    const edit = (txt) => { try { if (searchMsg) api.editMessage(txt, searchMsg.messageID); } catch(e) {} };

    try {
      const apikey = "freeApikey";
      let response;
      try {
        response = await axios.get(
          `https://anabot.my.id/api/download/playmusic?query=${encodeURIComponent(query)}&apikey=${encodeURIComponent(apikey)}`,
          { timeout: 30000 }
        );
      } catch(fetchErr) {
        unsend();
        return api.sendMessage(`❌ Music API not reachable. Please try again later.\n\n(${fetchErr.message})`, threadID, messageID);
      }

      const data = response.data;
      if (!data || !data.success || !data.data || !data.data.result) {
        unsend();
        return api.sendMessage("❌ No results found. Try a different song name.", threadID, messageID);
      }

      const result = data.data.result;
      const videoUrl = result.urls;
      const metadata = result.metadata;
      const title = metadata?.title || query;
      const author = metadata?.channel || "Unknown";

      edit(`🎵 Found: ${title}\n\n${frames[1]}`);
      edit(`🎵 Downloading...\n\n${frames[2]}`);

      const cacheDir = path.join(__dirname, "cache");
      await fs.ensureDir(cacheDir);
      const audioPath = path.join(cacheDir, `music_${Date.now()}.mp3`);

      let dlResponse;
      try {
        dlResponse = await axios.get(videoUrl, { responseType: 'arraybuffer', timeout: 90000 });
      } catch(dlErr) {
        unsend();
        return api.sendMessage(`❌ Download failed: ${dlErr.message}`, threadID, messageID);
      }

      fs.writeFileSync(audioPath, Buffer.from(dlResponse.data));
      edit(`🎵 Processing...\n\n${frames[3]}`);
      edit(`🎵 Complete!\n\n${frames[4]}`);

      api.sendMessage({
        body: `🎵 ${title}\n📺 ${author}`,
        attachment: fs.createReadStream(audioPath)
      }, threadID);

      setTimeout(() => {
        try { if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath); } catch(e) {}
        unsend();
      }, 10000);

    } catch (error) {
      console.error("Music command error:", error.message);
      unsend();
      return api.sendMessage("❌ An error occurred: " + error.message, threadID, messageID);
    }
  }
};
