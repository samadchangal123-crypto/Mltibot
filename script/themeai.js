module.exports.config = {
  name: 'themeai',
  version: '1.3.0',
  role: 0,
  hasPrefix: true,
  aliases: ['aitheme', 'themegen'],
  description: 'Generate AI-powered Messenger theme using a prompt',
  usage: 'themeai [prompt]',
  credits: 'ws3-fca',
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;

  const prompt = args.join(' ').trim();
  if (!prompt) {
    return api.sendMessage(
      '❌ Please provide a prompt!\n\nExample: .themeai sunset over mountains',
      threadID,
      messageID
    );
  }

  const loadingMsg = await new Promise((resolve, reject) => {
    api.sendMessage('🎨 Generating AI theme, please wait...', threadID, (err, info) => {
      if (err) return reject(err);
      resolve(info);
    });
  });

  try {
    const themeData = await api.createThemeAI(prompt);

    if (!themeData || !themeData.id) {
      return api.editMessage('⚠️ Could not generate theme. Try a different prompt.', loadingMsg.messageID);
    }

    const imageUrl = themeData.background_asset?.image?.url;
    const label = themeData.accessibility_label || prompt;

    let applied = false;
    try {
      await api.changeThreadColor(themeData.id, threadID);
      applied = true;
    } catch (e) {
      console.error('[themeai] changeThreadColor failed:', e?.message || e);
    }

    const status = applied ? '✅ 𝗔𝗜 𝗧𝗵𝗲𝗺𝗲 𝗔𝗽𝗽𝗹𝗶𝗲𝗱!' : '🎨 𝗔𝗜 𝗧𝗵𝗲𝗺𝗲 𝗚𝗲𝗻𝗲𝗿𝗮𝘁𝗲𝗱!';
    const note = applied ? '' : '\n\n⚠️ Auto-apply failed. Use the ID above to apply manually.';
    const reply = `${status}\n\n🖌️ Theme: ${label}\n🆔 ID: ${themeData.id}${imageUrl ? `\n🖼️ Preview: ${imageUrl}` : ''}${note}`;

    return api.editMessage(reply, loadingMsg.messageID);

  } catch (err) {
    console.error('[themeai error]', err);
    return api.editMessage(`❌ Error: ${err?.error || err?.message || 'Unknown error'}`, loadingMsg.messageID);
  }
};
