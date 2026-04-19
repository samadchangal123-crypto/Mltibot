module.exports.config = {
  name: "poll",
  version: "1.0.0",
  role: 1,
  hasPrefix: true,
  credits: "Kashif Raza",
  description: "Create a poll in the group",
  usage: "poll <title> | option1 | option2 | ...",
  cooldown: 5,
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;

  if (args.length === 0) {
    return api.sendMessage(
      "❗ Usage: poll <title> | option1 | option2 | ...\nExample: poll Favorite color? | Red | Blue | Green",
      threadID, messageID
    );
  }

  const fullText = args.join(' ');
  const parts = fullText.split('|').map(s => s.trim()).filter(Boolean);

  if (parts.length < 2) {
    return api.sendMessage(
      "❗ Please provide at least a title and one option.\nExample: poll Best fruit? | Mango | Apple",
      threadID, messageID
    );
  }

  const title = parts[0];
  const options = {};
  for (let i = 1; i < parts.length; i++) {
    options[parts[i]] = false;
  }

  try {
    await new Promise((resolve, reject) => {
      api.createPoll(title, threadID, options, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
    api.sendMessage(`✅ Poll created: "${title}"`, threadID, messageID);
  } catch (error) {
    console.error("Poll error:", error);
    api.sendMessage("❌ Failed to create poll.", threadID, messageID);
  }
};
