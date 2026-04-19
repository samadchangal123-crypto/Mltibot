function formatFont(text) { 
  const fontMapping = {
    a: "𝖺", b: "𝖻", c: "𝖼", d: "𝖽", e: "𝖾", f: "𝖿", g: "𝗀", h: "𝗁", i: "𝗂", j: "𝗃", k: "𝗄", l: "𝗅", m: "𝗆",
    n: "𝗇", o: "𝗈", p: "𝗉", q: "𝗊", r: "𝗋", s: "𝗌", t: "𝗍", u: "𝗎", v: "𝗏", w: "𝗐", x: "𝗑", y: "𝗒", z: "𝗓",
    A: "𝖠", B: "𝖡", C: "𝖢", D: "𝖣", E: "𝖤", F: "𝖥", G: "𝖦", H: "𝖧", I: "𝖨", J: "𝖩", K: "𝖪", L: "𝖫", M: "𝖬",
    N: "𝖭", O: "𝖮", P: "𝖯", Q: "𝖰", R: "𝖱", S: "𝖲", T: "𝖳", U: "𝖴", V: "𝖵", W: "𝖶", X: "𝖷", Y: "𝖸", Z: "𝖹",
    0: "𝟶", 1: "𝟷", 2: "𝟸", 3: "𝟹", 4: "𝟺", 5: "𝟻", 6: "𝟼", 7: "𝟽", 8: "𝟾", 9: "𝟿"
  };
  return text.split('').map(char => fontMapping[char] || char).join('');
}

module.exports.config = {
  name: 'help',
  version: '1.0.0',
  role: 0,
  hasPrefix: true,
  aliases: [],
  description: "Commands guide",
  usage: "help [page] | help [command name] | help all",
  credits: 'Developer',
};

module.exports.run = async function ({
  api,
  event,
  enableCommands,
  args,
  Utils,
  prefix
}) {
  const input = args.join(' ');
  try {
    const commands = enableCommands[0].commands;
    const pages = 20;

    if (!input) {
      const page = 1;
      const start = (page - 1) * pages;
      const end = start + pages;
      let helpMessage = `📚 𝗖𝗢𝗠𝗠𝗔𝗡𝗗𝗦 𝗚𝗨𝗜𝗗𝗘:\n▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱\n\n`;
      for (let i = start; i < Math.min(end, commands.length); i++) {
        helpMessage += `〔${formatFont(String(i + 1))}〕${formatFont(commands[i])} \n`;
      }
      helpMessage += `\n📖𝗣𝗮𝗴𝗲: <${page}/${Math.ceil(commands.length / pages)}>\nType '${prefix}help <page>' for more • '${prefix}help all' for all commands\n\n📋𝗧𝗢𝗧𝗔𝗟 𝗖𝗠𝗗𝗦: ${commands.length}`;
      api.sendMessage(helpMessage, event.threadID, event.messageID);

    } else if (!isNaN(input)) {
      const page = parseInt(input);
      const start = (page - 1) * pages;
      const end = start + pages;
      let helpMessage = `📚 𝗖𝗢𝗠𝗠𝗔𝗡𝗗𝗦 𝗚𝗨𝗜𝗗𝗘:\n▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱\n\n`;
      for (let i = start; i < Math.min(end, commands.length); i++) {
        helpMessage += `〔${formatFont(String(i + 1))}〕${formatFont(commands[i])} \n`;
      }
      helpMessage += `\n📖𝗣𝗮𝗴𝗲: <${page}/${Math.ceil(commands.length / pages)}>\nType '${prefix}help <page>' for more • '${prefix}help all' for all\n\n📋𝗧𝗢𝗧𝗔𝗟 𝗖𝗠𝗗𝗦: ${commands.length}`;
      api.sendMessage(helpMessage, event.threadID, event.messageID);

    } else if (input === 'all') {
      let helpMessage = `📚 𝗖𝗢𝗠𝗠𝗔𝗡𝗗𝗦 𝗚𝗨𝗜𝗗𝗘:\n▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱\n\n`;
      for (let i = 0; i < commands.length; i++) {
        helpMessage += `${formatFont(String(i + 1))}.『 ${formatFont(commands[i])} 』\n`;
      }
      helpMessage += `\n\n📋𝗧𝗢𝗧𝗔𝗟 𝗖𝗠𝗗𝗦: ${commands.length}`;
      api.sendMessage(helpMessage, event.threadID, event.messageID);

    } else {
      const command = [...Utils.handleEvent, ...Utils.commands].find(([key]) => key.includes(input?.toLowerCase()))?.[1];
      if (command) {
        const {
          name,
          version,
          role,
          aliases = [],
          description,
          usage,
          credits,
          cooldown,
          hasPrefix
        } = command;
        const roleMessage = role !== undefined ? (role === 0 ? '➟ Permission: user' : (role === 1 ? '➟ Permission: admin' : (role === 2 ? '➟ Permission: thread Admin' : (role === 3 ? '➟ Permission: super Admin' : '')))) : '';
        const aliasesMessage = aliases.length ? `➟ Aliases: ${aliases.join(', ')}\n` : '';
        const descriptionMessage = description ? `➟ Description: ${description}\n` : '';
        const usageMessage = usage ? `➟ Usage: ${usage}\n` : '';
        const creditsMessage = credits ? `➟ Credits: ${credits}\n` : '';
        const versionMessage = version ? `➟ Version: ${version}\n` : '';
        const cooldownMessage = cooldown ? `➟ Cooldown: ${cooldown} second(s)\n` : '';

        const message = ` 【 Command 】\n\n➟ Name: ${name}\n${versionMessage}${roleMessage}\n${aliasesMessage}${descriptionMessage}${usageMessage}${creditsMessage}${cooldownMessage}`;
        api.sendMessage(message, event.threadID, event.messageID);
      } else {
        api.sendMessage('Command not found.', event.threadID, event.messageID);
      }
    }
  } catch (error) {
    console.log(error);
  }
};
