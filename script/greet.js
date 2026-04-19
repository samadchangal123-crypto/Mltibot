module.exports.config = {
  name: "greet",
  version: "1.2.0",
  hasPermission: 0,
  credits: "AJ + Updated by Kashif Raza",
  description: "Auto responds to common greetings (Funny Roman Urdu)",
  commandCategory: "autobot",
  usages: "[hi | hello | etc.]",
  cooldowns: 3,
};

module.exports.handleEvent = async function ({ event, api }) {
  const message = event.body?.toLowerCase().trim();
  if (!message) return;

  const greetings = [
    "hi", "hello", "hey", "yo", "sup", "heya", "hola",
    "wassup", "oi"
  ];

  if (greetings.includes(message)) {
    const replies = [
      "Hi... bas hi? itni si baat k liye ping kiya? 😭",
      "Hello ji, chai piyoge ya sirf hi hi krni hai? ☕😂",
      "Hi bol ke gayab na ho jana, warna block list ready hai 😏",
      "Oye hoye hi! lagta hai free ho aaj 😜",
      "Hi ka reply mil gaya, ab kya plan hai boss? 😎",
      "Hello! kya haal hai ya bas attendance laga rahe ho? 😂",
      "Hi... itni energy hi me laga di, ab baat bhi kar lo 🤨",
      "Hello hello! lagta hai koi kaam hai warna yaad nahi karte 😏",
      "Hi ji, aaj bari yaad aa rahi hai meri 😌",
      "Oye hi! seedha bolo kya chahiye 😆"
    ];

    const randomReply = replies[Math.floor(Math.random() * replies.length)];
    return api.sendMessage(randomReply, event.threadID, event.messageID);
  }
};

module.exports.run = async function () {
  // No manual command needed
};