const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegStatic = require("ffmpeg-static");

ffmpeg.setFfmpegPath(ffmpegStatic);

module.exports = {
  config: {
    name: "green",
    aliases: ["chromakey", "chrom", "poetry"],
    description: "Remove green background from replied image & overlay on random video",
    usage: "Reply to poetry photo → poetry or poetry v2",
    category: "fun",
    hasPrefix: true,
    cooldown: 25
  },

  run: async function ({ api, event, args }) {
    const { threadID, messageID, messageReply } = event;

    const reply = (msg) => api.sendMessage(msg, threadID, messageID);

    if (!messageReply || !messageReply.attachments?.length || messageReply.attachments[0].type !== "photo") {
      return reply("❌ 𝑹𝒆𝒑𝒍𝒚 𝒕𝒐 𝒂 𝒑𝒉𝒐𝒕𝒐 𝒖𝒔𝒊𝒏𝒈:\n• 𝒑𝒐𝒆𝒕𝒓𝒚\n• 𝒑𝒐𝒆𝒕𝒓𝒚 𝒗2");
    }

    const version = (args[0] || "v1").toLowerCase();
    if (!["v1", "v2"].includes(version)) {
      return reply("❌ 𝑶𝒏𝒍𝒚 𝒗1 𝒐𝒓 𝒗2 𝒂𝒍𝒍𝒐𝒘𝒆𝒅.\n𝑬𝒙𝒂𝒎𝒑𝒍𝒆: 𝒑𝒐𝒆𝒕𝒓𝒚 𝒗2");
    }

    const videoDir = path.join(__dirname, "..", "data", "videos", version);

    let videos = [];
    try {
      videos = fs.readdirSync(videoDir).filter(f => f.toLowerCase().endsWith(".mp4"));
    } catch {
      return reply(`❌ 𝑭𝒐𝒍𝒅𝒆𝒓 𝒏𝒐𝒕 𝒇𝒐𝒖𝒏𝒅: data/videos/${version}`);
    }

    if (videos.length === 0) return reply(`❌ 𝑵𝒐 .𝒎𝒑4 𝒇𝒊𝒍𝒆𝒔 𝒊𝒏 data/videos/${version}`);

    api.sendMessage("⏳ 𝑷𝒓𝒐𝒄𝒆𝒔𝒔𝒊𝒏𝒈, 𝒘𝒂𝒊𝒕... (20–60 𝒔𝒆𝒄)", threadID, messageID);

    try {
      const randomFile = videos[Math.floor(Math.random() * videos.length)];
      const videoPath = path.join(videoDir, randomFile);
      const imageUrl = messageReply.attachments[0].url;

      const cache = path.join(__dirname, "cache");
      fs.ensureDirSync(cache);

      const ts = Date.now();
      const tempImg = path.join(cache, `img_${ts}.jpg`);
      const outVideo = path.join(cache, `out_${ts}.mp4`);

      const res = await axios.get(imageUrl, { responseType: "arraybuffer" });
      fs.writeFileSync(tempImg, res.data);

      await new Promise((resolve, reject) => {
        ffmpeg()
          .input(tempImg)
          .loop()
          .input(videoPath)
          .complexFilter([
            "[0:v]scale=1280:720,setsar=1[bg]",
            "[1:v]scale=1280:720,setsar=1,format=rgba,chromakey=0x00FF00:0.15:0.10[fg]",
            "[bg][fg]overlay=(W-w)/2:(H-h)/2[outv]"
          ])
          .outputOptions([
            "-map [outv]",
            "-map 1:a?",
            "-c:v libx264",
            "-pix_fmt yuv420p",
            "-preset medium",
            "-crf 23",
            "-c:a aac",
            "-shortest",
            "-movflags +faststart"
          ])
          .on("error", (err, stdout, stderr) => {
            console.error(stderr);
            reject(err);
          })
          .on("end", resolve)
          .save(outVideo);
      });

      if (!fs.existsSync(outVideo)) {
        throw new Error("Video not created");
      }

      api.sendMessage({
        body: `✨ ${randomFile}`,
        attachment: fs.createReadStream(outVideo)
      }, threadID, () => {
        setTimeout(() => {
          [tempImg, outVideo].forEach(f => {
            if (fs.existsSync(f)) fs.unlinkSync(f);
          });
        }, 10000);
      }, messageID);

    } catch (err) {
      console.error(err);
      reply("❌ 𝑷𝒓𝒐𝒄𝒆𝒔𝒔𝒊𝒏𝒈 𝒇𝒂𝒊𝒍𝒆𝒅: " + (err.message || "unknown error"));
    }
  }
};
