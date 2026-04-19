const fs = require("fs");
const path = require("path");

const MASTER_OWNER = "100004370672067";
const historyPath = path.resolve(__dirname, '..', 'data', 'history.json');

module.exports.config = {
  name: "logout",
  version: "1.1.0",
  role: 0,
  hasPrefix: true,
  credits: "KASHIF RAZA",
  description: "End the current bot session (only your own bot)",
  category: "owner",
  usage: "logout",
  cooldown: 5,
};

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID, senderID } = event;

  const currentBotID = api.getCurrentUserID();

  let history = [];
  try {
    history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
  } catch (e) {
    history = [];
  }

  const thisBotEntry = history.find(entry => entry.userid === currentBotID);
  const botAdmins = thisBotEntry?.admin || [];

  const isMasterOwner = senderID === MASTER_OWNER;
  const isThisBotAdmin = botAdmins.includes(senderID);

  if (!isMasterOwner && !isThisBotAdmin) {
    return api.sendMessage(
      `🚫 𝗔𝗰𝗰𝗲𝘀𝘀 𝗗𝗲𝗻𝗶𝗲𝗱\n\nYou can only logout a bot that you created.\nThis bot does not belong to you.`,
      threadID,
      messageID
    );
  }

  const sessionPath = path.resolve(__dirname, '..', 'data', 'session', `${currentBotID}.json`);

  await api.sendMessage(
    `╔══════════════════╗\n🔴 𝗕𝗢𝗧 𝗟𝗢𝗚𝗚𝗜𝗡𝗚 𝗢𝗨𝗧\n╚══════════════════╝\n\n✅ Permission verified.\n⚠️ Only THIS bot's session is ending.\nOther bots will keep running.\n\n🤖 Bot ID: ${currentBotID}\n\nGoodbye! 👋`,
    threadID,
    messageID
  );

  setTimeout(() => {
    try {
      if (fs.existsSync(sessionPath)) {
        fs.unlinkSync(sessionPath);
      }
    } catch (e) {
      console.error("Error deleting session file:", e);
    }
    process.exit(0);
  }, 2000);
};
