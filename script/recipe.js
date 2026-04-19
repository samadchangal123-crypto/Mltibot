const axios = require("axios");

module.exports.config = {
  name: 'recipe',
  version: '1.0.0',
  role: 0,
  hasPrefix: true,
  aliases: ['cook', 'foodie'],
  description: "Get a random recipe with ingredients and instructions.",
  usage: "recipe",
  credits: 'Vern',
  cooldown: 3
};

module.exports.run = async function ({ api, event }) {
  const threadID = event.threadID;
  const messageID = event.messageID;
  const senderID = event.senderID;

  api.sendMessage("🍳 Looking for a delicious recipe...", threadID, async (err, info) => {
    if (err) return;

    try {
      const res = await axios.get("https://rapido.zetsu.xyz/api/recipe");
      const { name, category, ingredients, instructions } = res.data;

      if (!name || !category || !Array.isArray(ingredients) || !instructions) {
        return api.editMessage("⚠️ Invalid recipe data received from the API.", info.messageID);
      }

      const ingredientList = ingredients.map(i => `• ${i}`).join("\n");
      const previewInstructions = instructions.length > 1500
        ? instructions.slice(0, 1500) + "..."
        : instructions;

      const timePH = new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" });

      api.getUserInfo(senderID, (err, infoUser) => {
        const userName = infoUser?.[senderID]?.name || "Unknown User";

        const reply = `🍽️ 𝗥𝗘𝗖𝗜𝗣𝗘 𝗧𝗜𝗠𝗘
━━━━━━━━━━━━━━━━━━
👨‍🍳 Name: ${name}
📂 Category: ${category}

🥬 Ingredients:
${ingredientList}

📋 Instructions:
${previewInstructions}
━━━━━━━━━━━━━━━━━━
👤 Requested by: ${userName}
🕰 Time: ${timePH}`;

        api.editMessage(reply, info.messageID);
      });

    } catch (error) {
      console.error("[recipe.js] API Error:", error.message || error);
      api.editMessage("❌ Couldn't fetch a recipe at the moment. Please try again later.", info.messageID);
    }
  });
};