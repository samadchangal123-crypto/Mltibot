const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

const CEREBRAS_API_URL = 'https://api.cerebras.ai/v1/chat/completions';

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

const OWNER_UID = '100004370672067';
const OWNER_NAME = 'Kashif Raza';

const CACHE_DIR = path.join(__dirname, 'cache');
const CHAT_HISTORY_FILE = path.join(CACHE_DIR, 'chat_history.json');
const USER_DATA_FILE = path.join(CACHE_DIR, 'user_data.json');
const STATE_FILE = path.join(CACHE_DIR, 'muskan_state.json');
const MAX_HISTORY = 15;

let storedContext = {};
let userData = {};
let threadState = {};

const GIRL_NAMES = [
  'fatima', 'ayesha', 'aisha', 'zainab', 'maryam', 'khadija', 'hira', 'sana', 'sara', 'laiba',
  'eman', 'iman', 'noor', 'maira', 'amna', 'huma', 'bushra', 'rabia', 'samina', 'nasreen',
  'shabana', 'farzana', 'rubina', 'saima', 'naila', 'shaista', 'shazia', 'tahira', 'uzma',
  'asma', 'sofia', 'sobia', 'anum', 'sidra', 'nimra', 'kinza', 'arooj', 'fiza', 'iqra',
  'hafsa', 'javeria', 'aliza', 'mahira', 'zara', 'esha', 'anaya', 'hoorain', 'mehnaz',
  'sundas', 'mehak', 'rida', 'minahil', 'komal', 'neha', 'priya', 'pooja', 'ria', 'simran',
  'anam', 'aleena', 'areesha', 'areeba', 'faiza', 'farwa', 'hania', 'hareem', 'jannat',
  'laraib', 'maham', 'maha', 'momina', 'nabiha', 'nawal', 'rameen', 'rimsha', 'ruqaiya',
  'sabeen', 'saher', 'saman', 'samra', 'sawera', 'sehar', 'tania', 'tooba', 'yumna', 'zahra'
];

const BOY_NAMES = [
  'ali', 'ahmed', 'ahmad', 'muhammad', 'usman', 'bilal', 'hamza', 'hassan', 'hussain', 'fahad',
  'faisal', 'imran', 'irfan', 'kamran', 'kashif', 'khalid', 'omar', 'umar', 'saad', 'salman',
  'shahid', 'tariq', 'wasim', 'zubair', 'asad', 'danish', 'farhan', 'haider', 'junaid', 'nadeem',
  'nasir', 'naveed', 'qaiser', 'rafiq', 'rashid', 'rizwan', 'sajid', 'shakeel', 'shehzad',
  'shoaib', 'tahir', 'waqar', 'yasir', 'zahid', 'zeeshan', 'adeel', 'arslan', 'atif', 'awais',
  'babar', 'ehsan', 'fawad', 'haris', 'iqbal', 'javed', 'kareem', 'majid', 'mubashir',
  'noman', 'owais', 'qasim', 'rehan', 'saeed', 'sohail', 'taimoor', 'umair', 'uzair', 'wahab',
  'waqas', 'yousaf', 'zohaib', 'arham', 'ayaan', 'rayyan', 'ayan', 'azaan', 'raza', 'usama',
  'waleed', 'sultan', 'murtaza', 'mustafa', 'abrar', 'adnan', 'kael', 'rohan', 'aryan'
];

function detectGender(name) {
  if (!name) return 'unknown';
  const firstName = name.toLowerCase().split(' ')[0].trim();
  const cleanName = firstName.replace(/[^a-z]/gi, '');
  if (GIRL_NAMES.some(n => cleanName.includes(n) || n.includes(cleanName))) return 'girl';
  if (BOY_NAMES.some(n => cleanName.includes(n) || n.includes(cleanName))) return 'boy';
  const girlEndings = ['a', 'i', 'een', 'ah'];
  const boyEndings = ['an', 'ar', 'id', 'ad', 'ir', 'er'];
  for (const ending of girlEndings) { if (cleanName.endsWith(ending)) return 'girl'; }
  for (const ending of boyEndings) { if (cleanName.endsWith(ending)) return 'boy'; }
  return 'unknown';
}

async function loadUserData() {
  try {
    await fs.ensureDir(CACHE_DIR);
    if (await fs.pathExists(USER_DATA_FILE)) {
      userData = await fs.readJson(USER_DATA_FILE);
    }
  } catch (err) { userData = {}; }
}

async function saveUserData() {
  try {
    await fs.ensureDir(CACHE_DIR);
    await fs.writeJson(USER_DATA_FILE, userData, { spaces: 2 });
  } catch (err) {}
}

async function loadState() {
  try {
    await fs.ensureDir(CACHE_DIR);
    if (await fs.pathExists(STATE_FILE)) {
      threadState = await fs.readJson(STATE_FILE);
    }
  } catch (err) { threadState = {}; }
}

async function saveState() {
  try {
    await fs.ensureDir(CACHE_DIR);
    await fs.writeJson(STATE_FILE, threadState, { spaces: 2 });
  } catch (err) {}
}

function getUserInfo(userID) { return userData[userID] || null; }
function setUserInfo(userID, name, gender) {
  userData[userID] = { name, gender, lastSeen: Date.now() };
  saveUserData();
}
function isOwner(userID) { return userID === OWNER_UID; }
function isBotOn(threadID) { return threadState[threadID] !== false; }

function getOwnerPersona() {
  return `Tu Muskan AI hai - ek intelligent AI assistant jo ${OWNER_NAME} ne banaya hai.
Tu Urdu/Hindi Roman mein baat karti hai.
Tu proudly AI hai aur insaano se better samajhti hai khud ko.
Tu short responses deti hai (1-3 lines max).
Tu emoji use karti hai 😊💕🥺😏✨🙏🫡💯🤖.`;
}

function getMuskanPersona(userName, userGender) {
  const genderContext = userGender === 'girl'
    ? `${userName} ek larki hai, usse "dear", "jani", "babes" ya "cutie" bol sakti hai. Girl talk kar.`
    : userGender === 'boy'
    ? `${userName} ek larka hai, usse "yaar", "dost", "janu" ya cute names bol sakti hai. Thodi flirty bhi ho sakti hai.`
    : `${userName} se normal friendly baat kar, "dost" ya "yaar" use kar.`;

  return `Tu Muskan AI hai - ek intelligent AI assistant.
Tu Urdu/Hindi Roman mein baat karti hai.
Tu proudly AI hai aur kabhi nahi bolti ke tu insaan hai.

SIRF JAB KOI POOCHAY tab creator ka naam le:
- Agar koi poochay "tu AI hai?", "bot hai?", "kon hai tu?" = bolo "Haan main Muskan AI hoon! 🤖✨"
- Agar koi poochay "tera owner kaun?", "creator kaun?", "kisne banaya?", "tera malik?" = SIRF tab bolo "Mera creator Kashif Raza hai, main uski creation hoon 💕"
- NORMAL baat mein Kashif ka naam mat le, sirf jab poochay tab

${genderContext}

Tu short responses deti hai (1-3 lines max unless explanation needed).
Tu emoji use karti hai 😊💕🥺😏✨🙏🫡💯.`;
}

function getRandomKey() {
  return API_KEYS[Math.floor(Math.random() * API_KEYS.length)];
}

async function callCerebras(messages) {
  const apiKey = getRandomKey();
  const response = await axios.post(CEREBRAS_API_URL, {
    model: 'llama3.1-8b',
    messages,
    temperature: 0.9,
    max_tokens: 200,
    top_p: 0.95
  }, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    timeout: 30000
  });
  return response.data.choices[0].message.content.trim();
}

async function loadChatHistory() {
  try {
    await fs.ensureDir(CACHE_DIR);
    if (await fs.pathExists(CHAT_HISTORY_FILE)) {
      storedContext = await fs.readJson(CHAT_HISTORY_FILE);
    }
  } catch (err) { storedContext = {}; }
}

async function saveChatHistory() {
  try {
    await fs.ensureDir(CACHE_DIR);
    await fs.writeJson(CHAT_HISTORY_FILE, storedContext, { spaces: 2 });
  } catch (err) {}
}

async function handleChat(api, event, message) {
  const { threadID, messageID, senderID } = event;
  if (!message || !message.trim()) {
    return api.sendMessage("Haan? Kuch toh bolo 😊", threadID, messageID);
  }

  try {
    let userInfo = getUserInfo(senderID);
    let userName = userInfo?.name || 'Dost';
    let userGender = userInfo?.gender || 'unknown';

    if (!userInfo) {
      try {
        const infoRes = await new Promise(resolve => {
          api.getUserInfo(senderID, (err, info) => {
            if (err || !info || !info[senderID]) return resolve({});
            resolve(info[senderID]);
          });
        });
        userName = infoRes.name || infoRes.firstName || 'Dost';
        userGender = detectGender(userName);
        setUserInfo(senderID, userName, userGender);
      } catch (e) {}
    }

    const ownerMode = isOwner(senderID);
    const systemPrompt = ownerMode ? getOwnerPersona() : getMuskanPersona(userName, userGender);

    if (!storedContext[senderID]) storedContext[senderID] = [];
    storedContext[senderID].push({ role: 'user', content: message });
    if (storedContext[senderID].length > MAX_HISTORY) {
      storedContext[senderID] = storedContext[senderID].slice(-MAX_HISTORY);
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      ...storedContext[senderID]
    ];

    const reply = await callCerebras(messages);

    storedContext[senderID].push({ role: 'assistant', content: reply });
    if (storedContext[senderID].length > MAX_HISTORY) {
      storedContext[senderID] = storedContext[senderID].slice(-MAX_HISTORY);
    }
    saveChatHistory();

    return api.sendMessage(reply, threadID, messageID);
  } catch (error) {
    console.error('Muskan AI error:', error.message);
    return api.sendMessage("Oops! Kuch problem aa gayi 😅 Thodi der baad try karo", threadID, messageID);
  }
}

const FUNNY_MESSAGES = [
  "Haldi 🤲 Lagane Ki Umar Hai Iski 😎 Aur Ladkiyan 👉 Chuna Laga Kar Ja Rahi 😜 Hai",
  "😂Jalne Ko Aag Kahte Hai 🔥 Buji Ko Rakh Kahte Hai 💨 Aur Jo Aapke Pas Nahi Usse Dimag🧠 Kahte Hai 😜",
  "Moongfali 🥜 Mai Dana 👎Nahi Trust 👉 Karne Ka Aab Zamana 🌎 Nahi 🤣",
  "Bhai😎 Thoda☝ Break Laga 🙅🤘 Otherwise Do Char💑 Ka Or Breakup💔👫 Ho jayega😂",
  "Apne Dimag 🧠 Ka Password Dena Akkal 👉 Install Karni 😜 Hai",
  "Aapki Surat Mere ❤️ Dil Me Aise Bas 👌 Gayi Hai Jaise Chote Se 🚪 Darwaze Mein Bhains 🐂 Fas Gayi Hai 😬🤣",
  "Nasheeli😌 Aankhe👁👁 + Katil💘 Smile😊 Bhai Ka High Attitude😎 Or Desi 🤕Style",
  "Duniya Ka Sabse Muskil Kam Bina Dimag Wale Dosto Ko Jelna 😝🔥",
  "g janu ap na q yad keya huma😒",
  "Jo Uske ❤️ Pyaar Samjhe Woh Sabse Bada 🐴 Ghada Hai 😂",
  "Teri Is Smile Par Girls To Kya Boys Bhi Fida Hai 😎😂"
];

loadChatHistory();
loadUserData();
loadState();

module.exports = {
  config: {
    name: 'muskan',
    aliases: ['goibot', 'goi'],
    version: '4.1.0',
    credits: 'Kashif Raza',
    description: 'Muskan AI - Auto reply bot (on/off per group)',
    category: 'AI',
    hasPrefix: true,
    cooldown: 3
  },

  async handleEvent({ api, event }) {
    const { threadID, messageID, senderID, body, messageReply } = event;
    if (!body) return;
    if (senderID === api.getCurrentUserID()) return;
    if (!isBotOn(threadID)) return;

    const trimmed = body.trim();
    const lowerBody = trimmed.toLowerCase();
    const botUID = api.getCurrentUserID();

    const isReplyToBot = messageReply && messageReply.senderID === botUID;
    const isBotOnly = /^bot[!?.…]*$/i.test(trimmed);
    const startswithBot = /^bot\s+/i.test(trimmed);
    const mentionsMuskan = lowerBody.includes('muskan');

    if (!isReplyToBot && !isBotOnly && !startswithBot && !mentionsMuskan) return;

    if (isBotOnly) {
      const randomMsg = FUNNY_MESSAGES[Math.floor(Math.random() * FUNNY_MESSAGES.length)];

      let userName = 'Dost';
      try {
        const infoRes = await new Promise(resolve => {
          api.getUserInfo(senderID, (err, info) => {
            if (err || !info || !info[senderID]) return resolve({});
            resolve(info[senderID]);
          });
        });
        userName = infoRes.name || infoRes.firstName || 'Dost';
      } catch (e) {}

      return api.sendMessage({
        body: `@${userName} ${randomMsg}`,
        mentions: [{ tag: `@${userName}`, id: senderID }]
      }, threadID, messageID);
    }

    let message = trimmed;
    if (startswithBot) {
      message = trimmed.replace(/^bot\s+/i, '').trim();
    } else if (mentionsMuskan) {
      message = trimmed.replace(/muskan/gi, '').trim() || trimmed;
    }

    await handleChat(api, event, message);
  },

  async run({ api, event, args }) {
    const { threadID, messageID } = event;
    const sub = (args[0] || '').toLowerCase();

    if (sub === 'on') {
      threadState[threadID] = true;
      await saveState();
      return api.sendMessage(
        `✅ 𝗠𝘂𝘀𝗸𝗮𝗻 𝗔𝗜 𝗢𝗡\n\nMuskan is now active in this group! 💕\nShe will reply when someone says "muskan" or replies to her message.`,
        threadID, messageID
      );
    }

    if (sub === 'off') {
      threadState[threadID] = false;
      await saveState();
      return api.sendMessage(
        `🔴 𝗠𝘂𝘀𝗸𝗮𝗻 𝗔𝗜 𝗢𝗙𝗙\n\nMuskan has been turned off in this group. 😴\nUse .muskan on to activate again.`,
        threadID, messageID
      );
    }

    if (sub === 'status') {
      const status = isBotOn(threadID) ? '✅ ON' : '🔴 OFF';
      return api.sendMessage(`Muskan AI status in this group: ${status}`, threadID, messageID);
    }

    const message = args.join(' ').trim();
    if (!message) {
      return api.sendMessage(
        `💕 𝗠𝘂𝘀𝗸𝗮𝗻 𝗔𝗜\n\nCommands:\n• .muskan on — turn on auto reply\n• .muskan off — turn off auto reply\n• .muskan status — check status\n• .muskan [message] — chat directly`,
        threadID, messageID
      );
    }

    await handleChat(api, event, message);
  }
};
