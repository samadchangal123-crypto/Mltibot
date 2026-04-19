const axios = require("axios");
const fs = require("fs");

const memoryFile = __dirname + "/memory.json";
let memory = {};
let autoReplyEnabled = false;

const API_KEYS = process.env.CEREBRAS_API_KEYS
  ? process.env.CEREBRAS_API_KEYS.split(',').map(k => k.trim()).filter(Boolean)
  : [
    'csk-568xjxexpmfm3h9p538239he4xd8hwn46k6j3hyfv2e8pt22',
    'csk-e96j9kt5563nn69x942jdf4c6y6nvfr83fyh92def942xp88',
    'csk-fefmvh68fh9xy5wdwnh824yxn8d8r6wv4ynxkd3tx9mc3yhk',
    'csk-px2n2h9t5e4h8wm9k8ryhpekhhk45dj4mccpjf9nfttpwcw8',
    'csk-r2cx5kw422kj8v4r5kwx2cywemr33xd2v8nn664vtdd463c5',
    'csk-3k35hwyj8xynfnfvme255h4yhr2m3rmkmm8jjt328rmnym44',
    'csk-nfncr3hp3tm2m5j8223vpedrd6vym4vjxfhyvttke8t548x2',
    'csk-necjtef228y4d9ypp8tvenx6kvvpk55w64xfww4pjk4eft66',
    'csk-2v848rvkdnfcc32kkdy3dydwvv5cjtmkf2wmhw3wcxhwewnf',
    'csk-cr43pwnjr5nefemrx566y4te5v6m4ypwhp4f4n68kk6trrkv'
  ];

const MODEL = "llama3.1-8b";

function getRandomKey() {
  return API_KEYS[Math.floor(Math.random() * API_KEYS.length)];
}

if (fs.existsSync(memoryFile)) {
  try {
    memory = JSON.parse(fs.readFileSync(memoryFile, "utf8"));
    if (typeof memory.autoReplyEnabled !== "undefined") {
      autoReplyEnabled = memory.autoReplyEnabled;
    }
  } catch (err) {
    console.error("Failed to load memory.json:", err.message);
    memory = {};
  }
} else {
  fs.writeFileSync(memoryFile, JSON.stringify({}, null, 2));
}

function saveMemory() {
  memory.autoReplyEnabled = autoReplyEnabled;
  fs.writeFileSync(memoryFile, JSON.stringify(memory, null, 2));
}

module.exports.config = {
  name: "cutie",
  version: "4.0.0",
  credit: "Raza",
  aliases: ["Cutie", "cute"],
  description: "Cutie auto-reply sweet gf 💕",
  category: "fun",
  usePrefix: false
};

module.exports.run = async function ({ api, event, args }) {
  const cmd = args[0] ? args[0].toLowerCase() : "";

  if (cmd === "on") {
    autoReplyEnabled = true;
    saveMemory();
    return api.sendMessage("✅ Cutie auto-reply is now ON, baby 💕", event.threadID, event.messageID);
  }

  if (cmd === "off") {
    autoReplyEnabled = false;
    saveMemory();
    return api.sendMessage("❌ Cutie auto-reply is now OFF, babe 😢", event.threadID, event.messageID);
  }

  if (cmd === "status") {
    return api.sendMessage(
      `Cutie auto-reply is currently ${autoReplyEnabled ? "✅ ON" : "❌ OFF"}.`,
      event.threadID,
      event.messageID
    );
  }

  return api.sendMessage(
    "Hey! I'm Cutie 🥰🫶\n\nUsage:\n• cutie on → enable auto-reply\n• cutie off → disable auto-reply\n• cutie status → check if ON/OFF",
    event.threadID,
    event.messageID
  );
};

module.exports.handleEvent = async function ({ api, event }) {
  if (!event.body) return;
  if (event.senderID == api.getCurrentUserID()) return;
  if (!autoReplyEnabled) return;

  const userId = event.senderID;
  if (!memory[userId]) memory[userId] = [];

  const aliases = ["cutie", "cute"];
  const triggerWords = ["love", "miss", "cute", "hun", "mwa", "kiss", "❤️", "💕", "💖", "💞"];
  const lowerBody = event.body.toLowerCase();

  const mentioned = aliases.some(alias => lowerBody.includes(alias));
  const isReply = event.type === "message_reply";
  const triggered = triggerWords.some(word => lowerBody.includes(word));

  if (!(mentioned || isReply)) {
    if (triggered) {
      try {
        return api.setMessageReaction("❤️", event.messageID, () => {}, true);
      } catch (err) {
        console.error("Failed to react:", err.message);
      }
    }
    return;
  }

  try {
    memory[userId].push({ role: "user", content: event.body });
    if (memory[userId].length > 10) {
      memory[userId] = memory[userId].slice(-10);
    }

    const systemPrompt = `You are Cutie - a sweet, caring, and playful girlfriend AI.
You speak in Roman Urdu mixed with English, cute style.
You are loving, warm, and always sweet.
Keep replies short: 1-3 lines max.
Use cute emojis 💕❤️🥰😘✨.
Never be rude. Always reply lovingly.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...memory[userId]
    ];

    const apiKey = getRandomKey();

    const response = await axios.post(
      "https://api.cerebras.ai/v1/chat/completions",
      {
        model: MODEL,
        messages,
        temperature: 1.0,
        max_tokens: 150,
        top_p: 0.95
      },
      {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        }
      }
    );

    let reply = response.data.choices[0].message.content.trim();

    memory[userId].push({ role: "assistant", content: reply });
    if (memory[userId].length > 10) {
      memory[userId] = memory[userId].slice(-10);
    }

    saveMemory();
    api.sendMessage(reply, event.threadID, event.messageID);
  } catch (err) {
    console.error("Cutie API error:", err.message);
    api.sendMessage("Sorry baby 😢 Cutie can't reply right now, try again later 💕", event.threadID, event.messageID);
  }
};
