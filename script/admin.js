const fs = require('fs');

let perm = {};

perm["config"] = {
    name: 'admin',
    version: '1.0.0',
    role: 0,
    hasPrefix: true,
    aliases: [],
    description: "Permission to use the bot",
    credits: 'cliff',
    usage: "{p}admin list | {p}admin add [replyuser/mention/userid] | {p}admin remove [reply_user/mention/userid]",
    cooldowns: 0,
};

async function getUserNames(api, uid) {
    try {
        const userInfo = await api.getUserInfo([uid]);
        return Object.values(userInfo).map(user => user.name || `User${uid}`);
    } catch (error) {
        api.sendMessage(`Error getting user names: ${error.message}`, uid);
        return [];
    }
}

perm["run"] = async function({ api, event, args, admin, prefix, commandName, eventType, Utils }) {
    const { mentions, messageReply, threadID, senderID, messageID } = event;
    const targetID = args[1] || (messageReply && messageReply.senderID);
    const uid = await api.getCurrentUserID();
    let history = JSON.parse(fs.readFileSync('./data/history.json', 'utf-8'));
    let currentUserData = history.find(item => item.userid === uid);

    if (!currentUserData) {
        return api.sendMessage("No data found for this user.", threadID, messageID);
    }

    const command = args[0];

    if ((command === 'add' || command === 'remove') && !admin.includes(senderID)) {
        return api.sendMessage("This command is only for AUTOBOT admins.", threadID, messageID);
    }


    if (command === 'add') {
        let addedUsers = [];

        if (targetID && !currentUserData.admin.includes(targetID)) {
            currentUserData.admin.push(targetID);
            addedUsers.push(targetID);
        }

        for (const mentionID in mentions) {
            const mentionedUserID = Object.keys(event.mentions)[0];
            if (!currentUserData.admin.includes(mentionedUserID)) {
                currentUserData.admin.push(mentionedUserID);
                addedUsers.push(mentionedUserID);
            }
        }

        if (addedUsers.length > 0) {
            fs.writeFileSync('./data/history.json', JSON.stringify(history, null, 2));
            const names = await Promise.all(addedUsers.map(id => getUserNames(api, id)));
            return api.sendMessage(`Added as admin:\n${names.join(', ')}`, threadID, messageID);
        } else {
            return api.sendMessage(`User ${targetID || mentionedUserID} is already an admin.`, threadID, messageID);
        }
    }

    if (command === 'remove') {
        let removedUsers = [];

        if (targetID && currentUserData.admin.includes(targetID)) {
            currentUserData.admin = currentUserData.admin.filter(id => id !== targetID);
            removedUsers.push(targetID);
        }

        for (const mentionID in mentions) {
            const mentionedUserID = Object.keys(event.mentions)[0];
            if (currentUserData.admin.includes(mentionedUserID)) {
                currentUserData.admin = currentUserData.admin.filter(id => id !== mentionedUserID);
                removedUsers.push(mentionedUserID);
            }
        }

        if (removedUsers.length > 0) {
            fs.writeFileSync('./data/history.json', JSON.stringify(history, null, 2));
            const names = await Promise.all(removedUsers.map(id => getUserNames(api, id)));
            return api.sendMessage(`Removed as admin:\n${names.join(', ')}`, threadID, messageID);
        } else {
            return api.sendMessage(`User ${targetID || mentionedUserID} is not an admin.`, threadID, messageID);
        }
    }

    if (command === 'list') {
        const adminList = await Promise.all(currentUserData.admin.map(id => getUserNames(api, id)));
        return api.sendMessage(
            `⚜️ 𝗔𝗱𝗺𝗶𝗻 𝗟𝗶𝘀𝘁:\n\n${adminList
                .map((name, index) => `[ ${index + 1} ]\n𝗡𝗮𝗺𝗲: ${name}\n𝗙𝗯: https://facebook.com/${currentUserData.admin[index]}\n`)
                .join('\n')}`, threadID, messageID
        );
    }

    return api.sendMessage(`Invalid command: Use ${prefix}admin list | ${prefix}admin add [replyuser/mention/userid] | ${prefix}admin remove [reply_user/mention/userid]`, threadID, messageID);
};

module.exports = perm;
