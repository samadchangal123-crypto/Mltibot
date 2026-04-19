module.exports.config = {
  name: "unfriend",
  version: "1.0.0",
  role: 2,
  hasPrefix: true,
  credits: "Kashif Raza",
  description: "Unfriend a user",
  usage: "unfriend @user",
  cooldown: 5,
};

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID } = event;
  const mentionIDs = Object.keys(event.mentions || {});

  if (mentionIDs.length === 0) {
    return api.sendMessage("❗ Please tag a user to unfriend.\nUsage: unfriend @user", threadID, messageID);
  }

  const targetID = mentionIDs[0];
  const name = event.mentions[targetID] || targetID;

  try {
    await new Promise((resolve, reject) => {
      api.unFriend(targetID, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
    api.sendMessage(`✅ Unfriended: ${name}`, threadID, messageID);
  } catch (error) {
    console.error("Unfriend error:", error);
    api.sendMessage("❌ Failed to unfriend user.", threadID, messageID);
  }
};
