module.exports.config = {
  name: "title",
  version: "1.0.0",
  role: 1,
  hasPrefix: true,
  credits: "Kashif Raza",
  description: "Change the group thread title/name",
  usage: "title <new group name>",
  cooldown: 5,
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;

  if (args.length === 0) {
    return api.sendMessage("❗ Please provide a new group name.\nUsage: title <new name>", threadID, messageID);
  }

  const newTitle = args.join(' ').trim();

  try {
    await new Promise((resolve, reject) => {
      api.setTitle(newTitle, threadID, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
    api.sendMessage(`✅ Group name changed to: ${newTitle}`, threadID, messageID);
  } catch (error) {
    console.error("Title error:", error);
    api.sendMessage("❌ Failed to change group name.", threadID, messageID);
  }
};
