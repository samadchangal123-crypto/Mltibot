const axios = require('axios');

module.exports.config = {
  name: "imgbb",
  version: "1.0.1",
  hasPermssion: 0,
  role: 0,
  aliases: ['uploadimg', 'ibb'],
  credits: "𝐊𝐀𝐒𝐇𝐈𝐅 𝐑𝐀𝐙𝐀",
  description: "Upload multiple images to ImgBB and get links",
  commandCategory: "Utility",
  usage: "[reply to one or more images]",
  cooldown: 5,
};

module.exports.run = async ({ api, event }) => {
  try {
    if (!event.messageReply || !event.messageReply.attachments || event.messageReply.attachments.length === 0) {
      return api.sendMessage(
        `༻﹡﹡﹡﹡﹡﹡﹡༺\n\n❌ 𝐏𝐥𝐞𝐚𝐬𝐞 𝐫𝐞𝐩𝐥𝐲 𝐭𝐨 𝐨𝐧𝐞 𝐨𝐫 𝐦𝐨𝐫𝐞 𝐢𝐦𝐚𝐠𝐞𝐬!\n\n༻﹡﹡﹡﹡﹡﹡﹡༺`,
        event.threadID,
        event.messageID
      );
    }

    const apiKey = 'e17a15dd6af452cbe53747c0b2b0866d';
    const uploadUrl = 'https://api.imgbb.com/1/upload';
    const uploadedUrls = [];

    for (const attachment of event.messageReply.attachments) {
      try {
        const response = await axios.get(attachment.url, { responseType: 'arraybuffer' });
        const base64Image = Buffer.from(response.data, 'binary').toString('base64');

        const formData = new URLSearchParams();
        formData.append('key', apiKey);
        formData.append('image', base64Image);

        const uploadResponse = await axios.post(uploadUrl, formData, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        uploadedUrls.push(uploadResponse.data.data.url);
      } catch (err) {
        console.error('Error uploading image:', err);
        uploadedUrls.push(`❌ 𝐅𝐚𝐢𝐥𝐞𝐝 𝐭𝐨 𝐮𝐩𝐥𝐨𝐚𝐝: ${attachment.url}`);
      }
    }

    let message = '⚡ 𝐔𝐩𝐥𝐨𝐚𝐝𝐞𝐝 𝐈𝐦𝐚𝐠𝐞 𝐋𝐢𝐧𝐤𝐬 ⚡\n\n';
    uploadedUrls.forEach((url, index) => {
      message += `👉 ${index + 1}. ${url}\n`;
    });

    return api.sendMessage(`\n\n${message}\n`, event.threadID, event.messageID);

  } catch (error) {
    console.error('Error:', error);
    return api.sendMessage(
      `⚝──⭒─⭑─⭒──⚝\n\n❌ 𝐀𝐧 𝐞𝐫𝐫𝐨𝐫 𝐨𝐜𝐜𝐮𝐫𝐫𝐞𝐝 𝐰𝐡𝐢𝐥𝐞 𝐩𝐫𝐨𝐜𝐞𝐬𝐬𝐢𝐧𝐠 𝐭𝐡𝐞 𝐢𝐦𝐚𝐠𝐞𝐬.\n🔁 𝐏𝐥𝐞𝐚𝐬𝐞 𝐭𝐫𝐲 𝐚𝐠𝐚𝐢𝐧 𝐥𝐚𝐭𝐞𝐫.\n\n⚝──⭒─⭑─⭒──⚝`,
      event.threadID,
      event.messageID
    );
  }
};
