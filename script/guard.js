module.exports.config = {
  name: "guard",
  role: 2,
  version: "1.0",
  credits: "cliff",
  description: "Guard on/off profile",
  hasPrefix: true,
  usages: "{pn} on/off",
  aliases: [],
  cooldown: 0,
};

module.exports.run = async function ({ event, args, api, admin}) {
    
    if (!admin.includes(event.senderID))
    return api.sendMessage("This command is only for AUTOBOT owner.", event.threadID, event.messageID);
    
  if (args[0] === "on") {
      await api.setProfileGuard(true);
      api.sendMessage("Profile guard has been turned on.", event.threadID, event.messageID);
  } else if (args[0] === "off") {
      await api.setProfileGuard(false);
      api.sendMessage("Profile guard has been turned off.", event.threadID, event.messageID);
  } else {
      api.sendMessage("Invalid argument! Use 'on' or 'off'.", event.threadID, event.messageID);
  }
};
