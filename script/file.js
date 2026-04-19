const fs = require('fs');
const path = require('path');

const pendingReplies = new Map();

module.exports.config = {
  name: "file",
  version: "3.0.0",
  credits: "Kashif Raza",
  cooldown: 0,
  hasPrefix: true,
  usage: "file [prefix] — list commands | reply number to delete",
  role: 2,
};

module.exports.handleEvent = async function ({ api, event }) {
  if (event.type !== 'message_reply') return;
  if (!event.messageReply) return;

  const key = event.messageReply.messageID;
  if (!pendingReplies.has(key)) return;

  const pending = pendingReplies.get(key);
  if (event.senderID !== pending.senderID) return;

  const num = parseInt((event.body || '').trim());
  if (isNaN(num) || num < 1 || num > pending.files.length) {
    return api.sendMessage(`❌ Invalid number. Send 1–${pending.files.length}.`, event.threadID, event.messageID);
  }

  const target = pending.files[num - 1];
  const filePath = path.join(__dirname, `${target}.js`);

  if (!fs.existsSync(filePath)) {
    pendingReplies.delete(key);
    return api.sendMessage(`❌ File not found: ${target}.js`, event.threadID, event.messageID);
  }

  try {
    fs.unlinkSync(filePath);
    pendingReplies.delete(key);
    return api.sendMessage(`✅ Deleted: ${target}.js`, event.threadID, event.messageID);
  } catch (e) {
    return api.sendMessage(`❌ Failed to delete: ${e.message}`, event.threadID, event.messageID);
  }
};

module.exports.run = async function ({ args, api, event }) {
  const { threadID, messageID, senderID } = event;

  const prefix = (args[0] || '').trim().toLowerCase();

  const allFiles = fs.readdirSync(__dirname)
    .filter(f => f.endsWith('.js'))
    .map(f => f.replace('.js', ''))
    .sort();

  const filtered = prefix
    ? allFiles.filter(f => f.toLowerCase().startsWith(prefix))
    : allFiles;

  if (filtered.length === 0) {
    return api.sendMessage(`❌ No commands found${prefix ? ` starting with "${prefix}"` : ''}.`, threadID, messageID);
  }

  let msg = `📂 Commands${prefix ? ` [ ${prefix}* ]` : ' [ All ]'} — ${filtered.length} found\n`;
  msg += `▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱\n\n`;
  filtered.forEach((f, i) => {
    msg += `${i + 1}. ${f}.js\n`;
  });
  msg += `\n📌 Reply with a number to delete that command.`;

  api.sendMessage(msg, threadID, (err, info) => {
    if (err || !info) return;
    pendingReplies.set(info.messageID, {
      senderID,
      threadID,
      files: filtered
    });
    setTimeout(() => pendingReplies.delete(info.messageID), 5 * 60 * 1000);
  }, messageID);
};
