const path = require("path");
const fs = require("fs");

let bannedWords = {};
let warnings = {};
let badWordsActive = {};
let fontEnabled = true;

function formatFont(text) {
    const fontMapping = {
        a: "𝖺", b: "𝖻", c: "𝖼", d: "𝖽", e: "𝖾", f: "𝖿", g: "𝗀", h: "𝗁", i: "𝗂", j: "𝗃", k: "𝗄", l: "𝗅", m: "𝗆",
        n: "𝗇", o: "𝗈", p: "𝗉", q: "𝗊", r: "𝗋", s: "𝗌", t: "𝗍", u: "𝗎", v: "𝗏", w: "𝗐", x: "𝗑", y: "𝗒", z: "𝗓",
        A: "𝖠", B: "𝖡", C: "𝖢", D: "𝖣", E: "𝖤", F: "𝖥", G: "𝖦", H: "𝖧", I: "𝖨", J: "𝖩", K: "𝖪", L: "𝖫", M: "𝖬",
        N: "𝖭", O: "𝖮", P: "𝖯", Q: "𝖰", R: "𝖱", S: "𝖲", T: "𝖳", U: "𝖴", V: "𝖵", W: "𝖶", X: "𝖷", Y: "𝖸", Z: "𝖹"
    };

    let formattedText = "";
    for (const char of text) {
        if (fontEnabled && char in fontMapping) {
            formattedText += fontMapping[char];
        } else {
            formattedText += char;
        }
    }

    return formattedText;
}

module.exports.config = {
    name: "badwords",
    version: "1.0.0",
    role: 2,
    credits: "Vern",
    description: "Manage and enforce banned words",
    hasPrefix: true,
    usages: "add [word] | remove [word] | list | on | off",
    cooldown: 5,
};

module.exports.handleEvent = async function({ api, event }) {
    const { threadID, messageID, senderID } = event;

    const loadWords = () => {
        const wordFile = path.join(__dirname, `../cache/${threadID}.json`);
        if (fs.existsSync(wordFile)) {
            const words = fs.readFileSync(wordFile, "utf8");
            bannedWords[threadID] = JSON.parse(words);
        } else {
            bannedWords[threadID] = [];
        }
    };

    loadWords();

    if (!badWordsActive[threadID]) return; 

    const isAdmin = (await api.getThreadInfo(threadID)).adminIDs.some(adminInfo => adminInfo.id === api.getCurrentUserID());

    if (!isAdmin) {
        api.sendMessage(formatFont("Bot Need Admin Privilege"), threadID);
        return;
    }

    const messageContent = event.body.toLowerCase();
    const hasBannedWord = bannedWords[threadID].some(bannedWord => messageContent.includes(bannedWord.toLowerCase()));

    if (hasBannedWord) {
        if (!warnings[senderID]) warnings[senderID] = 0;

        warnings[senderID]++;
        if (warnings[senderID] === 2) {
            api.sendMessage(formatFont("You Already 2 attempt violation of badwords you will kicked to this group"), threadID, messageID);
            api.removeUserFromGroup(senderID, threadID); 
            warnings[senderID] = 1;
        } else {
            api.sendMessage(formatFont(`Last Warning! Your message has been detected Badwords "${messageContent}" if you two attempts you will kick you automatically!`), threadID, messageID);
        }
    }
};

module.exports.run = async function({ api, event, args }) {
    const { threadID, messageID } = event;

    if (!args[0]) {
        return api.sendMessage(formatFont("Please specify an action (add, remove, list, on, off) and appropriate data."), threadID);
    }

    const wordFile = path.join(__dirname, `../cache/${threadID}.json`);
    if (fs.existsSync(wordFile)) {
        const words = fs.readFileSync(wordFile, "utf8");
        bannedWords[threadID] = JSON.parse(words);
    } else {
        bannedWords[threadID] = [];
    }

    const isAdmin = (await api.getThreadInfo(threadID)).adminIDs.some(adminInfo => adminInfo.id === api.getCurrentUserID());

    if (!isAdmin) {
        api.sendMessage(formatFont("🛡️ | Bot Need Admin Privilege in short you need to admin the bot to your group chat!"), threadID);
        return;
    }

    const action = args[0];
    const word = args.slice(1).join(' ');

    switch (action) {
        case 'add':
            bannedWords[threadID].push(word);
            api.sendMessage(formatFont(`✅ | Added ${word} to the list of banned words.`), threadID);
            break;
        case 'remove':
            const index = bannedWords[threadID].indexOf(word);
            if (index !== -1) {
                bannedWords[threadID].splice(index, 1);
                api.sendMessage(formatFont(`✅ | Removed ${word} from the list of banned words.`), threadID);
            } else {
                api.sendMessage(formatFont(`The word ${word} wasn't found on the list of banned words.`), threadID);
            }
            break;
        case 'list':
            api.sendMessage(formatFont(`📝 | List of banned words:\n${bannedWords[threadID].join(', ')}`), threadID);
            break;
        case 'on':
            badWordsActive[threadID] = true;
            api.sendMessage(formatFont(`Badwords has been activated.`), threadID);
            break;
        case 'off':
            badWordsActive[threadID] = false;
            api.sendMessage(formatFont(`Badwords has been deactivated.`), threadID);
            break;
        default: 
            api.sendMessage(formatFont("Invalid action. Please use 'add', 'remove', 'list', 'on' or 'off'."), threadID);
    }

    fs.writeFileSync(wordFile, JSON.stringify(bannedWords[threadID]), "utf8");
};