const request = require("request");
const fs = require("fs");
const axios = require("axios");

module.exports.config = {
  name: "kiss",
  version: "1.0.0",
  role: 0,
  credits: "KASHIF RAZA",
  description: "Kiss the tagged person",
  category: "Love",
  usage: "@tag",
  hasPrefix: true,
  cooldown: 5,
};

module.exports.run = async ({ api, event }) => {
  const { threadID, messageID } = event;
  var link = [    
    "https://i.postimg.cc/yxDKkJyH/02d4453f3eb0a76a87148433395b3ec3.gif",
    "https://i.postimg.cc/nLTf2Kdx/1483589602-6b6484adddd5d3e70b9eaaaccdf6867e.gif",
    "https://i.postimg.cc/Wpyjxnsb/574fcc797b21e-1533876813029926506824.gif",
    "https://i.postimg.cc/xdsT8SVL/kiss-anime.gif",
  ];

  var mention = Object.keys(event.mentions);
  if (!mention || mention.length === 0) 
    return api.sendMessage("❂━━❂━━❂━━❂━━❂\n\n𝑷𝒍𝒆𝒂𝒔𝒆 𝒕𝒂𝒈 𝒐𝒏𝒆 𝒑𝒆𝒓𝒔𝒐𝒏 ❗\n\n❂━━❂━━❂━━❂━━❂", threadID, messageID);

  let tag = event.mentions[mention[0]].replace("@", "");
  const gifPath = __dirname + "/cache/honkiss.gif";

  var callback = () => api.sendMessage({
    body: `❂━━❂━━❂━━❂━━❂\n\n${tag}, 𝑩𝒂𝒆 𝒈𝒊𝒗𝒆 𝒎𝒆 𝒂 𝒔𝒘𝒆𝒆𝒕 𝒌𝒊𝒔𝒔 💞\n\n❂━━❂━━❂━━❂━━❂`,
    mentions: [{ tag: tag, id: mention[0] }],
    attachment: fs.createReadStream(gifPath)
  }, threadID, () => { try { fs.unlinkSync(gifPath); } catch(e){} });

  return request(encodeURI(link[Math.floor(Math.random() * link.length)]))
    .pipe(fs.createWriteStream(gifPath))
    .on("close", () => callback());
};
