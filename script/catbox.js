const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
  name: "catbox",
  version: "1.0.1",
  hasPermission: 0,
  credits: "𝐊𝐀𝐒𝐇𝐈𝐅 𝐑𝐀𝐙𝐀",
  description: "Upload images/videos/GIFs to Catbox.moe & get permanent links",
  category: "Utility",
  usages: "[reply to image/video/gif]",
  usage: "reply to any media",
  cooldown: 5,
  hasPrefix: true
};

module.exports.run = async ({ api, event }) => {
  const { threadID, messageID } = event;

  try {
    if (!event.messageReply || !event.messageReply.attachments || event.messageReply.attachments.length === 0) {
      return api.sendMessage(
        "༻﹡﹡﹡﹡﹡﹡﹡༺\n\n❌ 𝐏𝐥𝐞𝐚𝐬𝐞 𝐫𝐞𝐩𝐥𝐲 𝐭𝐨 𝐚𝐧 𝐢𝐦𝐚𝐠𝐞, 𝐯𝐢𝐝𝐞𝐨 𝐨𝐫 𝐆𝐈𝐅!\n\n༻﹡﹡﹡﹡﹡﹡﹡༺",
        threadID, messageID
      );
    }

    api.sendMessage("⏳ 𝐔𝐩𝐥𝐨𝐚𝐝𝐢𝐧𝐠 𝐭𝐨 𝐂𝐚𝐭𝐛𝐨𝐱.𝐦𝐨𝐞...\n𝐏𝐥𝐞𝐚𝐬𝐞 𝐰𝐚𝐢𝐭 ⌛", threadID, messageID);

    const uploadedUrls = [];

    for (const attach of event.messageReply.attachments) {
      try {
        const fileUrl = encodeURIComponent(attach.url);
        const res = await axios.get(
          `https://catbox-mnib.onrender.com/upload?url=${fileUrl}`,
          { timeout: 90000 }
        );

        if (res.data && res.data.url) {
          uploadedUrls.push(`✅ ${res.data.url}`);
        } else {
          uploadedUrls.push(`❌ 𝐅𝐚𝐢𝐥𝐞𝐝 (no URL returned)`);
        }
      } catch (err) {
        console.error('[catbox] upload error:', err.message);
        uploadedUrls.push(`❌ 𝐅𝐚𝐢𝐥𝐞𝐝: ${err.message}`);
      }
    }

    let message = '⚡ 𝐂𝐚𝐭𝐛𝐨𝐱 𝐏𝐞𝐫𝐦𝐚𝐧𝐞𝐧𝐭 𝐋𝐢𝐧𝐤𝐬 ⚡\n\n';
    uploadedUrls.forEach((url, i) => {
      message += `👉 ${i + 1}. ${url}\n`;
    });

    return api.sendMessage(
      `≿━━━━༺❀༻━━━━≾\n\n${message}\n≿━━━━༺❀༻━━━━≾`,
      threadID, messageID
    );

  } catch (error) {
    console.error('[catbox] error:', error.message);
    return api.sendMessage(
      `⚝──⭒─⭑─⭒──⚝\n\n❌ 𝐀𝐧 𝐞𝐫𝐫𝐨𝐫 𝐨𝐜𝐜𝐮𝐫𝐫𝐞𝐝!\n🔁 𝐏𝐥𝐞𝐚𝐬𝐞 𝐭𝐫𝐲 𝐚𝐠𝐚𝐢𝐧 𝐥𝐚𝐭𝐞𝐫.\n\n⚝──⭒─⭑─⭒──⚝`,
      threadID, messageID
    );
  }
};
