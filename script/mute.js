module.exports.config = {
  name: "mute",
  version: "1.0.0",
  role: 1,
  hasPrefix: true,
  credits: "Kashif Raza",
  description: "Mute or unmute the current thread",
  usage: "mute [minutes] | mute off",
  cooldown: 5,
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;

  const input = (args[0] || '').toLowerCase();
  let muteSeconds = -1;
  let label = "permanently";

  if (input === 'off' || input === 'unmute' || input === '0') {
    muteSeconds = 0;
    label = "unmuted";
  } else if (!isNaN(input) && input !== '') {
    muteSeconds = parseInt(input) * 60;
    label = `for ${input} minute(s)`;
  }

  try {
    await new Promise((resolve, reject) => {
      api.muteThread(threadID, muteSeconds, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    if (muteSeconds === 0) {
      api.sendMessage(`🔔 Thread unmuted.`, threadID, messageID);
    } else {
      api.sendMessage(`🔇 Thread muted ${label}.`, threadID, messageID);
    }
  } catch (error) {
    console.error("Mute error:", error);
    api.sendMessage("❌ Failed to mute thread.", threadID, messageID);
  }
};
