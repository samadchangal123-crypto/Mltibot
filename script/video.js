const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const yts = require('yt-search');

module.exports = {
  config: {
    name: "video",
    aliases: [],
    version: "3.2.0",
    credits: "Kashif Raza",
    description: "Download video from YouTube",
    category: "media",
    usage: "video [video name]",
    hasPrefix: true,
    cooldown: 15
  },

  async run({ api, event, args }) {
    const { threadID, messageID } = event;
    const query = args.join(" ");

    if (!query) {
      return api.sendMessage("❌ 𝑷𝒍𝒆𝒂𝒔𝒆 𝒑𝒓𝒐𝒗𝒊𝒅𝒆 𝒂 𝒗𝒊𝒅𝒆𝒐 𝒏𝒂𝒎𝒆", threadID, messageID);
    }

    const frames = [
      "🩵▰▱▱▱▱▱▱▱▱▱ 10%",
      "💙▰▰▱▱▱▱▱▱▱▱ 25%",
      "💜▰▰▰▰▱▱▱▱▱▱ 45%",
      "💖▰▰▰▰▰▰▱▱▱▱ 70%",
      "💗▰▰▰▰▰▰▰▰▰▰ 100% 😍"
    ];

    let searchMsgID = null;

    const sendSearchMsg = () => new Promise((resolve) => {
      api.sendMessage(`🔍 𝑺𝒆𝒂𝒓𝒄𝒉𝒊𝒏𝒈...\n\n${frames[0]}`, threadID, (err, info) => {
        resolve(!err && info ? info.messageID : null);
      });
    });

    const unsend = () => { try { if (searchMsgID) api.unsendMessage(searchMsgID); } catch(e) {} };
    const edit = (txt) => { try { if (searchMsgID) api.editMessage(txt, searchMsgID); } catch(e) {} };

    try {
      searchMsgID = await sendSearchMsg();

      let searchResults;
      try {
        searchResults = await yts(query);
      } catch(searchErr) {
        unsend();
        return api.sendMessage("❌ 𝑺𝒆𝒂𝒓𝒄𝒉 𝒇𝒂𝒊𝒍𝒆𝒅. Please try again later.", threadID, messageID);
      }

      const videos = searchResults.videos;
      if (!videos || videos.length === 0) {
        unsend();
        return api.sendMessage("❌ 𝑵𝒐 𝒓𝒆𝒔𝒖𝒍𝒕𝒔 𝒇𝒐𝒖𝒏𝒅", threadID, messageID);
      }

      const firstResult = videos[0];
      const videoUrl = firstResult.url;
      const title = firstResult.title;
      const author = firstResult.author?.name || "Unknown";

      edit(`🎬 𝑽𝒊𝒅𝒆𝒐 𝒇𝒐𝒖𝒏𝒅!\n\n${frames[1]}`);
      edit(`🎬 𝑫𝒐𝒘𝒏𝒍𝒐𝒂𝒅𝒊𝒏𝒈...\n\n${frames[2]}`);

      let fetchRes;
      try {
        const apiUrl = `https://api.kraza.qzz.io/download/ytdl?url=${encodeURIComponent(videoUrl)}`;
        fetchRes = await axios.get(apiUrl, { headers: { 'Accept': 'application/json' }, timeout: 30000 });
      } catch (fetchError) {
        unsend();
        return api.sendMessage(`❌ 𝑫𝒐𝒘𝒏𝒍𝒐𝒂𝒅 𝑨𝑷𝑰 𝒏𝒐𝒕 𝒓𝒆𝒂𝒄𝒉𝒂𝒃𝒍𝒆: ${fetchError.message}`, threadID, messageID);
      }

      if (!fetchRes.data?.status || !fetchRes.data?.result?.mp4) {
        unsend();
        return api.sendMessage("❌ 𝑪𝒐𝒖𝒍𝒅 𝒏𝒐𝒕 𝒈𝒆𝒕 𝒗𝒊𝒅𝒆𝒐 𝒅𝒐𝒘𝒏𝒍𝒐𝒂𝒅 𝒍𝒊𝒏𝒌. Try again later.", threadID, messageID);
      }

      const downloadUrl = fetchRes.data.result.mp4;
      edit(`🎬 𝑷𝒓𝒐𝒄𝒆𝒔𝒔𝒊𝒏𝒈...\n\n${frames[3]}`);

      let videoBuffer;
      try {
        const videoRes = await axios.get(downloadUrl, { responseType: 'arraybuffer', timeout: 120000 });
        videoBuffer = videoRes.data;
      } catch (downloadError) {
        unsend();
        return api.sendMessage(`❌ 𝑫𝒐𝒘𝒏𝒍𝒐𝒂𝒅 𝒇𝒂𝒊𝒍𝒆𝒅: ${downloadError.message}`, threadID, messageID);
      }

      const cacheDir = path.join(__dirname, "cache");
      await fs.ensureDir(cacheDir);
      const videoPath = path.join(cacheDir, `${Date.now()}_video.mp4`);
      fs.writeFileSync(videoPath, videoBuffer);

      edit(`🎬 𝑪𝒐𝒎𝒑𝒍𝒆𝒕𝒆!\n\n${frames[4]}`);

      api.sendMessage({
        body: `🎬 ${title}\n👤 ${author}`,
        attachment: fs.createReadStream(videoPath)
      }, threadID, (err) => {
        if (err) {
          const errMsg = err?.message || err?.error || String(err);
          console.error("Video send error:", errMsg);
          api.sendMessage(`❌ 𝑭𝒂𝒊𝒍𝒆𝒅 𝒕𝒐 𝒔𝒆𝒏𝒅 𝒗𝒊𝒅𝒆𝒐: ${errMsg}`, threadID, messageID);
        }
        try {
          if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
          unsend();
        } catch {}
      });

    } catch (error) {
      const errMsg = error?.message || error?.error || String(error);
      console.error("Video command error:", errMsg);
      unsend();
      return api.sendMessage("❌ 𝑨𝒏 𝒆𝒓𝒓𝒐𝒓 𝒐𝒄𝒄𝒖𝒓𝒓𝒆𝒅 𝒘𝒉𝒊𝒍𝒆 𝒑𝒓𝒐𝒄𝒆𝒔𝒔𝒊𝒏𝒈 𝒚𝒐𝒖𝒓 𝒓𝒆𝒒𝒖𝒆𝒔𝒕", threadID, messageID);
    }
  }
};
