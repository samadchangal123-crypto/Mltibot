const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const yts = require("yt-search");

module.exports = {
  config: {
    name: "song",
    aliases: [],
    version: "4.2.0",
    credits: "Kashif Raza",
    description: "Download song/audio/video from YouTube",
    category: "media",
    usage: "song <name> [video]",
    hasPrefix: true,
    cooldown: 10
  },

  async run({ api, event, args }) {
    const { threadID, messageID } = event;
    const query = args.join(" ");
    if (!query) return api.sendMessage("❌ Please provide a song name.", threadID, messageID);

    const wantVideo = query.toLowerCase().endsWith(" video");
    const searchTerm = wantVideo ? query.replace(/ video$/i, "").trim() : query.trim();
    const format = wantVideo ? "video" : "audio";
    const frames = [
      "🩵▰▱▱▱▱▱▱▱▱▱ 10%",
      "💙▰▰▱▱▱▱▱▱▱▱ 25%",
      "💜▰▰▰▰▱▱▱▱▱▱ 45%",
      "💖▰▰▰▰▰▰▱▱▱▱ 70%",
      "💗▰▰▰▰▰▰▰▰▰▰ 100% 😍"
    ];

    let loadingMsg;
    try {
      loadingMsg = await api.sendMessage(`🔍 Searching for ${searchTerm}...\n${frames[0]}`, threadID);
    } catch(e) {
      return api.sendMessage(`🔍 Searching for ${searchTerm}...`, threadID, messageID);
    }

    const unsend = () => { try { if (loadingMsg) api.unsendMessage(loadingMsg.messageID); } catch(e) {} };
    const edit = (txt) => { try { if (loadingMsg) api.editMessage(txt, loadingMsg.messageID); } catch(e) {} };

    try {
      let searchResults;
      try {
        searchResults = await yts(searchTerm);
      } catch(searchErr) {
        unsend();
        return api.sendMessage("❌ Search failed. Please try again later.", threadID, messageID);
      }

      const videos = searchResults.videos;
      if (!videos || videos.length === 0) {
        unsend();
        return api.sendMessage("❌ No results found.", threadID, messageID);
      }

      const first = videos[0];
      const title = first.title;
      const videoUrl = first.url;
      const author = first.author.name;

      edit(`🎵 Found: ${title}\n\n${frames[1]}`);
      edit(`🎵 Downloading...\n\n${frames[2]}`);

      let fetchRes;
      try {
        const apiUrl = `https://api.kraza.qzz.io/download/ytdl?url=${encodeURIComponent(videoUrl)}`;
        fetchRes = await axios.get(apiUrl, { headers: { 'Accept': 'application/json' }, timeout: 30000 });
      } catch (fetchError) {
        unsend();
        return api.sendMessage(`❌ Download API not reachable: ${fetchError.message}`, threadID, messageID);
      }

      const downloadKey = wantVideo ? 'mp4' : 'mp3';
      if (!fetchRes.data?.status || !fetchRes.data?.result?.[downloadKey]) {
        unsend();
        return api.sendMessage(`❌ Could not get ${format} download link. Try again later.`, threadID, messageID);
      }

      const downloadUrl = fetchRes.data.result[downloadKey];
      edit(`🎵 Processing...\n\n${frames[3]}`);

      let mediaRes;
      try {
        mediaRes = await axios.get(downloadUrl, { responseType: 'arraybuffer', timeout: 120000 });
      } catch (downloadError) {
        unsend();
        return api.sendMessage(`❌ Download failed: ${downloadError.message}`, threadID, messageID);
      }

      const cacheDir = path.join(__dirname, "cache");
      await fs.ensureDir(cacheDir);
      const ext = wantVideo ? 'mp4' : 'mp3';
      const mediaPath = path.join(cacheDir, `${Date.now()}_${format}.${ext}`);
      fs.writeFileSync(mediaPath, mediaRes.data);

      setTimeout(() => edit(`🎵 Complete!\n\n${frames[4]}`), 500);

      await api.sendMessage({
        body: `🎵 ${title}\n📺 ${author}`,
        attachment: fs.createReadStream(mediaPath)
      }, threadID);

      setTimeout(() => {
        try { if (fs.existsSync(mediaPath)) fs.unlinkSync(mediaPath); } catch(e) {}
        unsend();
      }, 10000);

    } catch (error) {
      console.error("Song command error:", error.message);
      unsend();
      return api.sendMessage("❌ An error occurred while processing your request.", threadID, messageID);
    }
  }
};
