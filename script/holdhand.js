const request = require("request");
const fs = require("fs");

module.exports = {
  config: {
    name: "holdhand",
    aliases: [],
    version: "1.0.0",
    credits: "KASHIF RAZA",
    description: "Hold hands with the person you tag",
    category: "Love",
    usage: "@tag",
    hasPrefix: true,
    cooldown: 5
  },

  async run({ api, event }) {
    const { threadID, messageID } = event;
    var mention = Object.keys(event.mentions)[0];
    if (!mention) return api.sendMessage("❂━━❂━━❂━━❂━━❂\n❌ 𝑷𝒍𝒆𝒂𝒔𝒆 𝒕𝒂𝒈 𝒔𝒐𝒎𝒆𝒐𝒏𝒆 𝒕𝒐 𝒉𝒐𝒍𝒅 𝒉𝒂𝒏𝒅𝒔 𝒘𝒊𝒕𝒉!\n❂━━❂━━❂━━❂━━❂", threadID, messageID);

    let tag = event.mentions[mention].replace("@", "");
    const gifPath = __dirname + "/cache/holdhand.gif";
    var link = [
      "https://i.pinimg.com/originals/96/f3/0d/96f30d638b316a39465d45236ce931c3.gif"
    ];

    var callback = () => api.sendMessage({
      body: `❂━━❂━━❂━━❂━━❂\n${tag}, 𝒈𝒊𝒗𝒆 𝒎𝒆 𝒚𝒐𝒖𝒓 𝒉𝒂𝒏𝒅 🤝\n[⚜️]→ 𝑭𝒐𝒓𝒆𝒗𝒆𝒓 𝒕𝒐𝒈𝒆𝒕𝒉𝒆𝒓 💘\n❂━━❂━━❂━━❂━━❂`,
      mentions: [{ tag: tag, id: mention }],
      attachment: fs.createReadStream(gifPath)
    }, threadID, () => { try { fs.unlinkSync(gifPath); } catch(e){} });

    return request(encodeURI(link[Math.floor(Math.random() * link.length)]))
      .pipe(fs.createWriteStream(gifPath))
      .on("close", () => callback());
  }
};
