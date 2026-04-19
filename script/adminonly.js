const path = require('path');
const fs = require('fs-extra');

module.exports["config"] = {
  name: "adminonly",
  role: 2,
  aliases: ["onlyadbox", "adboxonly", "adminboxonly"],
  version: "2.0.0",
  credits: "cliff",
  hasPrefix: true,
  description: "turn on/off only admin can use bot",
  commandCategory: "Admin",
  usages: "[on/off]",
  cooldown: 5,
};

module.exports["run"] = async function ({ api, event, args, admin }) {
  try {
    const uid = await api.getCurrentUserID();
let his = JSON.parse(fs.readFileSync('./data/history.json', 'utf-8'));

  let userdata = his.find(item => item.userid === uid) || { userid: uid, admin: [] };
    const pathFile = path.join(__dirname, '..', 'cache', `${uid}.txt`);

    if (!userdata.admin.includes(event.senderID)) {
      return api.sendMessage(
        "This Command is only for 𝗔𝗨𝗧𝗢𝗕𝗢𝗧 admin.",
        event.threadID,
        event.messageID
      );
    }

    if (args[0] === 'on') {
      fs.writeFileSync(pathFile, 'true');
      api.sendMessage(
        'Turned on the mode: only admin can use bot.',
        event.threadID,
        event.messageID
      );
    } else if (args[0] === 'off') {
      fs.writeFileSync(pathFile, 'false');
      api.sendMessage(
        'Turned off the mode: only admin can use bot.',
        event.threadID,
        event.messageID
      );
    } else {
      api.sendMessage(
        'Incorrect syntax: use "on" or "off".',
        event.threadID,
        event.messageID
      );
    }
  } catch (error) {
    api.sendMessage(
      'An error occurred while processing your request.',
      event.threadID,
      event.messageID
    );
  }
};
