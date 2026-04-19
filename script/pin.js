module.exports.config = {
  name: "pin",
  version: "1.0.0",
  role: 1,
  hasPrefix: true,
  credits: "Kashif Raza",
  description: "Pin or unpin a message by replying to it",
  usage: "pin (reply to message) | pin unpin (reply to unpin)",
  cooldown: 5,
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, messageReply } = event;

  if (!messageReply) {
    return api.sendMessage("❗ Please reply to a message to pin or unpin it.", threadID, messageID);
  }

  const isUnpin = (args[0] || '').toLowerCase() === 'unpin';
  const pinMode = isUnpin ? 0 : 1;
  const targetMessageID = messageReply.messageID;

  try {
    await new Promise((resolve, reject) => {
      api.pinMessage(pinMode, targetMessageID, threadID, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
    api.sendMessage(
      isUnpin ? "📌 Message unpinned." : "📌 Message pinned successfully.",
      threadID, messageID
    );
  } catch (error) {
    console.error("Pin error:", error);
    api.sendMessage("❌ Failed to pin/unpin message.", threadID, messageID);
  }
};
