const pendingReplies = new Map();

module.exports.config = {
  name: "accept",
  version: "2.0.0",
  role: 2,
  aliases: [],
  credits: "Kashif Raza",
  cooldown: 5,
  hasPrefix: true,
  description: "List pending message/friend requests and accept by number",
  usage: "accept",
};

module.exports.handleEvent = async function ({ api, event }) {
  if (event.type !== 'message_reply') return;
  if (!event.messageReply) return;

  const key = event.messageReply.messageID;
  if (!pendingReplies.has(key)) return;

  const pending = pendingReplies.get(key);
  if (event.senderID !== pending.senderID) return;

  const num = parseInt((event.body || '').trim());
  if (isNaN(num) || num < 1 || num > pending.requests.length) {
    return api.sendMessage(`❌ Invalid number. Send 1–${pending.requests.length}.`, event.threadID, event.messageID);
  }

  const req = pending.requests[num - 1];
  pendingReplies.delete(key);

  try {
    if (req.type === 'message') {
      await new Promise((resolve, reject) => {
        api.handleMessageRequest(req.threadID, true, (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
      return api.sendMessage(`✅ Accepted message request from: ${req.name || req.threadID}`, event.threadID, event.messageID);
    } else {
      await new Promise((resolve, reject) => {
        api.handleFriendRequest(req.uid, true, (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
      return api.sendMessage(`✅ Accepted friend request from: ${req.name || req.uid}`, event.threadID, event.messageID);
    }
  } catch (e) {
    return api.sendMessage(`❌ Failed to accept: ${e.message || e}`, event.threadID, event.messageID);
  }
};

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID, senderID } = event;

  try {
    let requests = [];

    try {
      const pending = await new Promise((resolve, reject) => {
        api.getThreadList(50, null, ["PENDING"], (err, list) => {
          if (err) return reject(err);
          resolve(list || []);
        });
      });
      const other = await new Promise((resolve, reject) => {
        api.getThreadList(50, null, ["OTHER"], (err, list) => {
          if (err) return reject(err);
          resolve(list || []);
        });
      });
      const all = [...pending, ...other];
      for (const t of all) {
        requests.push({
          type: 'message',
          threadID: t.threadID,
          name: t.name || t.threadName || t.threadID,
        });
      }
    } catch (e) {}

    if (requests.length === 0) {
      return api.sendMessage("📭 No pending requests found.", threadID, messageID);
    }

    let msg = `📋 Pending Requests — ${requests.length} found\n`;
    msg += `▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱\n\n`;
    requests.forEach((r, i) => {
      msg += `${i + 1}. ${r.name}\n`;
    });
    msg += `\n📌 Reply with a number to accept that request.`;

    api.sendMessage(msg, threadID, (err, info) => {
      if (err || !info) return;
      pendingReplies.set(info.messageID, {
        senderID,
        threadID,
        requests
      });
      setTimeout(() => pendingReplies.delete(info.messageID), 5 * 60 * 1000);
    }, messageID);

  } catch (err) {
    console.error("Accept command error:", err);
    return api.sendMessage("❗ Error fetching requests. Try again later.", threadID, messageID);
  }
};
