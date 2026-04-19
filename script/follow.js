module.exports.config = {
  name: "follow",
  version: "1.0.0",
  role: 0,
  hasPrefix: true,
  credits: "Kashif Raza",
  description: "Follow or unfollow a user",
  usage: "follow @user | follow unfollow @user",
  cooldown: 5,
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const mentionIDs = Object.keys(event.mentions || {});

  if (mentionIDs.length === 0) {
    return api.sendMessage(
      "❗ Please tag a user.\nUsage:\n• follow @user — follow\n• follow unfollow @user — unfollow",
      threadID, messageID
    );
  }

  const targetID = mentionIDs[0];
  const isUnfollow = (args[0] || '').toLowerCase() === 'unfollow';

  try {
    await new Promise((resolve, reject) => {
      api.follow(targetID, !isUnfollow, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    const action = isUnfollow ? "Unfollowed" : "Followed";
    const name = event.mentions[targetID] || targetID;
    api.sendMessage(`✅ ${action}: ${name}`, threadID, messageID);
  } catch (error) {
    console.error("Follow error:", error);
    api.sendMessage("❌ Failed to follow/unfollow user.", threadID, messageID);
  }
};
