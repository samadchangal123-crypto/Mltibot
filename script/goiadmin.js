module.exports.config = {
  name: "goiadmin",
  version: "1.0.0",
  hasPermission: 0,
  credits: "Ren/Wick",
  description: "Auto reply when the admin's name is mentioned",
  commandCategory: "autobot",
  usages: "Automatically replies when the admin is called",
  cooldowns: 2
};

module.exports.handleEvent = async function ({ event, api }) {
  if (!event.body) return;
  const nameCalled = event.body.toLowerCase();
  const adminNames = [
    "kashif raza",
    "kashif",
    "raza",
    "hey kashif",
    "where is kashif?",
    "where's kashif?"
  ];

  const matched = adminNames.some(name => nameCalled.includes(name));
  if (matched) {
    const responses = [
      "What do you need from Kashif Raza? 🤨",
      "Wait a bit, Kashif Raza might be busy.",
      "Yes? Looking for Kashif Raza?",
      "Call Kashif Raza with respect 😏",
      "Don't disturb, Kashif Raza is busy right now.",
      "Keep calling and Kashif Raza might respond 🙄",
      "You keep calling, do you need something from Kashif Raza? 😠",
      "What do you need from Kashif Raza⁉️"
    ];
    const randomReply = responses[Math.floor(Math.random() * responses.length)];
    return api.sendMessage(randomReply, event.threadID, event.messageID);
  }
};

module.exports.run = async function () {
  // No run needed, this command works on message events
};