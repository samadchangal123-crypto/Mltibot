const fs = require('fs');
const path = require('path');

const LOCKS_FILE = path.join(__dirname, '../data/locks.json');

function readLocks() {
  try {
    if (!fs.existsSync(LOCKS_FILE)) return {};
    return JSON.parse(fs.readFileSync(LOCKS_FILE, 'utf8'));
  } catch { return {}; }
}

function writeLocks(data) {
  fs.writeFileSync(LOCKS_FILE, JSON.stringify(data, null, 2));
}

module.exports.config = {
  name: 'locktheme',
  version: '1.1.0',
  role: 2,
  hasPrefix: true,
  aliases: ['ltheme'],
  description: 'Lock the group theme — auto-restore if someone changes it',
  usage: 'locktheme [on/off]',
  credits: 'System',
  cooldowns: 3
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;

  const threadInfo = await api.getThreadInfo(threadID);
  if (!threadInfo.isGroup) {
    return api.sendMessage('❌ This command only works in group chats.', threadID, messageID);
  }

  const locks = readLocks();
  if (!locks[threadID]) locks[threadID] = {};

  const sub = (args[0] || '').toLowerCase();

  if (sub === 'off') {
    locks[threadID].theme = { active: false, value: null };
    writeLocks(locks);
    return api.sendMessage('🔓 Theme lock disabled. Anyone can now change the theme.', threadID, messageID);
  }

  // Prefer numeric theme ID (threadTheme.id), fallback to hex color
  const themeID = threadInfo.threadTheme?.id || threadInfo.color || null;

  if (!themeID) {
    return api.sendMessage('⚠️ Could not read current theme. Set a theme first and try again.', threadID, messageID);
  }

  locks[threadID].theme = { active: true, value: themeID };
  writeLocks(locks);

  return api.sendMessage(
    `🔒 Theme locked!\n\n🎨 Theme ID: ${themeID}\n\nAnyone who changes the theme will be auto-reverted.`,
    threadID,
    messageID
  );
};
