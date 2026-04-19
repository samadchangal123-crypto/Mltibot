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
  name: 'lockname',
  version: '1.0.0',
  role: 2,
  hasPrefix: true,
  aliases: ['lname'],
  description: 'Lock the group name — auto-restore if someone changes it',
  usage: 'lockname [on/off]',
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
    locks[threadID].name = { active: false, value: null };
    writeLocks(locks);
    return api.sendMessage('🔓 Name lock disabled. Anyone can now change the group name.', threadID, messageID);
  }

  const currentName = threadInfo.threadName;
  if (!currentName) {
    return api.sendMessage('⚠️ Could not read current group name.', threadID, messageID);
  }

  locks[threadID].name = { active: true, value: currentName };
  writeLocks(locks);

  return api.sendMessage(
    `🔒 Group name locked!\n\n📝 Saved name: "${currentName}"\n\nAnyone who changes the name will be auto-reverted.`,
    threadID,
    messageID
  );
};
