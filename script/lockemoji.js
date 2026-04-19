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
  name: 'lockemoji',
  version: '1.0.0',
  role: 2,
  hasPrefix: true,
  aliases: ['lemoji'],
  description: 'Lock the group emoji — auto-restore if someone changes it',
  usage: 'lockemoji [on/off]',
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
    locks[threadID].emoji = { active: false, value: null };
    writeLocks(locks);
    return api.sendMessage('🔓 Emoji lock disabled. Anyone can now change the group emoji.', threadID, messageID);
  }

  const currentEmoji = threadInfo.emoji || '👍';

  locks[threadID].emoji = { active: true, value: currentEmoji };
  writeLocks(locks);

  return api.sendMessage(
    `🔒 Group emoji locked!\n\n${currentEmoji} Saved emoji: ${currentEmoji}\n\nAnyone who changes the emoji will be auto-reverted.`,
    threadID,
    messageID
  );
};
