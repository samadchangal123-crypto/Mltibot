const axios = require('axios');
const path = require('path');
const fs = require('fs-extra');

module.exports.config = {
    name: "cosplay",
    version: "1.0.0",
    role: 0,
    description: "Fetch a random cosplay video from GitHub repo.",
    hasPrefix: true,
    credits: "Ry",
    cooldowns: 10,
    category: "anime"
};

async function fetchCosplayVideo() {
    try {
        const owner = 'ajirodesu';
        const repo = 'cosplay';
        const branch = 'main';
        const repoUrl = `https://github.com/${owner}/${repo}/tree/${branch}/`;
        const response = await axios.get(repoUrl);
        const html = response.data;

        const videoFileRegex = /href="\/ajirodesu\/cosplay\/blob\/main\/([^"]+\.mp4)"/g;
        const videoFiles = [];
        let match;
        while ((match = videoFileRegex.exec(html)) !== null) {
            videoFiles.push(match[1]);
        }

        if (videoFiles.length === 0) return null;

        const randomVideo = videoFiles[Math.floor(Math.random() * videoFiles.length)];
        return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${randomVideo}`;
    } catch (error) {
        throw error;
    }
}

module.exports.run = async function ({ api, event }) {
    try {
        api.sendMessage("🎭 𝗙𝗲𝘁𝗰𝗵𝗶𝗻𝗴 𝗮 𝗿𝗮𝗻𝗱𝗼𝗺 𝗰𝗼𝘀𝗽𝗹𝗮𝘆 𝘃𝗶𝗱𝗲𝗼...", event.threadID, event.messageID);

        const videoUrl = await fetchCosplayVideo();
        if (!videoUrl) {
            return api.sendMessage("❌ 𝗡𝗼 𝘃𝗶𝗱𝗲𝗼𝘀 𝗳𝗼𝘂𝗻𝗱 𝗶𝗻 𝘁𝗵𝗲 𝗿𝗲𝗽𝗼.", event.threadID, event.messageID);
        }

        const fileName = `${event.messageID}.mp4`;
        const filePath = path.join(__dirname, fileName);

        const response = await axios({
            method: 'GET',
            url: videoUrl,
            responseType: 'stream'
        });

        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);

        writer.on('finish', () => {
            api.sendMessage({
                body: "✨ 𝗛𝗲𝗿𝗲’𝘀 𝗮 𝗿𝗮𝗻𝗱𝗼𝗺 𝗰𝗼𝘀𝗽𝗹𝗮𝘆 𝘃𝗶𝗱𝗲𝗼!",
                attachment: fs.createReadStream(filePath)
            }, event.threadID, () => fs.unlinkSync(filePath), event.messageID);
        });

        writer.on('error', () => {
            api.sendMessage("🚫 𝗘𝗿𝗿𝗼𝗿 𝗱𝗼𝘄𝗻𝗹𝗼𝗮𝗱𝗶𝗻𝗴 𝘃𝗶𝗱𝗲𝗼. 𝗧𝗿𝘆 𝗮𝗴𝗮𝗶𝗻.", event.threadID, event.messageID);
        });

    } catch (error) {
        console.error("❌ Error in cosplay command:", error.message);
        api.sendMessage("🚫 𝗔𝗻 𝗲𝗿𝗿𝗼𝗿 𝗼𝗰𝗰𝘂𝗿𝗿𝗲𝗱 𝘄𝗵𝗶𝗹𝗲 𝗳𝗲𝘁𝗰𝗵𝗶𝗻𝗴 𝘃𝗶𝗱𝗲𝗼.", event.threadID, event.messageID);
    }
};