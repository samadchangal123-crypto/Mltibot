const fs = require('fs');
const path = require('path');
const axios = require('axios');

const LOCKS_FILE = path.join(__dirname, '../data/locks.json');
const CACHE_DIR = path.join(__dirname, 'cache');

function readLocks() {
  try {
    if (!fs.existsSync(LOCKS_FILE)) return {};
    return JSON.parse(fs.readFileSync(LOCKS_FILE, 'utf8'));
  } catch { return {}; }
}

function writeLocks(data) {
  fs.writeFileSync(LOCKS_FILE, JSON.stringify(data, null, 2));
}

async function downloadImage(url, dest) {
  const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
  fs.writeFileSync(dest, response.data);
}

module.exports.config = {
  name: 'lockdp',
  version: '1.1.0',
  role: 2,
  hasPrefix: true,
  aliases: ['ldp', 'lockpic'],
  description: 'Lock the group DP — auto-restore if someone changes it',
  usage: 'lockdp [on/off]',
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
    const oldFile = locks[threadID].dp?.localPath;
    if (oldFile && fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
    locks[threadID].dp = { active: false, localPath: null };
    writeLocks(locks);
    return api.sendMessage('🔓 DP lock disabled. Anyone can now change the group picture.', threadID, messageID);
  }

  const currentUrl = threadInfo.imageSrc;
  if (!currentUrl) {
    return api.sendMessage('⚠️ Could not read current group DP. Make sure the group has a photo set.', threadID, messageID);
  }

  if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
  const localPath = path.join(CACHE_DIR, `lockdp_${threadID}.jpg`);

  try {
    await downloadImage(currentUrl, localPath);
  } catch (e) {
    return api.sendMessage('⚠️ Failed to save group DP. Try again.', threadID, messageID);
  }

  locks[threadID].dp = { active: true, localPath };
  writeLocks(locks);

  return api.sendMessage(
    `🔒 Group DP locked!\n\n🖼️ Current photo saved locally.\n\nAnyone who changes the group picture will be auto-reverted.`,
    threadID,
    messageID
  );
};
