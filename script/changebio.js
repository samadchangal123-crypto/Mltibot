module.exports.config = {
  name: "changebio",
  version: "1.7.0",
  role: 2, // Bot admin only
  hasPrefix: true,
  aliases: [],
  description: "Change the bot's bio text.",
  usage: "changebio <new bio>",
  credits: "Vern",
  cooldown: 5,
};

module.exports.run = async function ({ api, event, args }) {
  const threadID = event.threadID;
  const messageID = event.messageID;
  const newBio = args.join(" ").trim();

  if (!newBio) {
    return api.sendMessage("⚠️ Please provide text to set as the new bio.", threadID, messageID);
  }

  try {
    await api.changeBio(newBio);
    return api.sendMessage(`✅ Bot bio successfully changed to:\n📝 "${newBio}"`, threadID, messageID);
  } catch (error) {
    console.error("❌ Failed to change bot bio:", error);
    return api.sendMessage(
      "❌ Failed to change the bot bio. Please check the console/logs for more details.",
      threadID,
      messageID
    );
  }
};