module.exports.config = {
    name: "server",
    version: "2.0.0",
    hasPermssion: 2,
    credits: "ALIYA OFFICIAL (Updated)",
    description: "Tagged user ko loop mein gaaliyan bhejo",
    commandCategory: "group",
    usages: "server on @user | server off",
    cooldowns: 5
};

const intervals = {};

const messages = [
    "TERI BHANNN KA BHOSDA",
    "SALE GANDU KE BACHE",
    "CHAMAR KI OLADDDD",
    "TERI BHANNN KA REP KRWA DU",
    "TERI AMA KI CHUT PE CHAPAL MARU",
    "TERI BHANN KI CHUT SE KHUN NIKAL DUNGI",
    "TERI BHAMM KI CHUT BDI SEXY HE",
    "TERI AMA KI CHUT ME ACID DALL DU",
    "TERI MAA KI CHUT ME LUND DAAL KE PHOD DU",
    "TERE BAAP KA LUND CHUS LE SALE",
    "TERI BEHEN KO RATIYA ME CHODU",
    "GANDU MADARCHOD",
    "TERI MAA KA BHOSDA FAAD DU",
    "SALE HARAMI KE BACHE",
    "TERI BHEN KI CHUT ME THAALI BAJA DU",
    "RANDI KE BACHE",
    "TERE MUH ME MERA LUND",
    "TERI MAA KO DOGGY STYLE ME CHODU",
    "CHUTIYE KI AULAD",
    "TERI BEHEN KO PUBLIC ME CHOD KE VIDEO BANAU",
    "MADARCHOD SALE",
    "TERI AMA KI CHUT ME JHAADU DAAL DU",
    "TERE BAAP KI GAND ME LUND",
    "BHOSDIKE",
    "TERI BHEN KA BHOSDA",
    "SALE KAMINA",
    "TERI MAA KO CHODTE CHODTE THAK JAU",
    "GAND FAAD DU TERI",
    "TERI BEHEN KI CHUT ME SARSO KA TEL",
    "RANDI KI AULAD",
    "TERE MUH ME MUT DU",
    "MADARJAAT",
    "TERI MAA KI CHUT ME BOMB",
    "SALE CHUTIYA",
    "TERI BEHEN KO GANGBANG KARWA DU",
    "BHOSDIWALE",
    "TERI AMA KA RAP KAR DU",
    "LUND KE MOOT",
    "TERI BHEN KI GAAND ME UNGLI",
    "HARAMI KI OLAD",
    "TERE BAAP KO CHODU",
    "CHUT KA PAANI",
    "TERI MAA KI CHUT SE PAANI NIKALEGA",
    "SALE BEHENCHOD",
    "TERI BEHEN KA BUR",
    "GANDU KE PUTTAR",
    "TERI MAA KO NIGHT ME CHODU",
    "RANDI MADARCHOD",
    "TERI BHEN KI CHUT ME LUND GHUSADU",
    "CHAMAR MADARCHOD",
    "TERE MUH ME LUND DAAL KE CHOOS",
    "TERI MAA KI GAAND FAAD DU",
    "SALE KUTTE KI AULAD",
    "BHOSDA FAADNE WALA",
    "TERI BEHEN KO CHOD KE PREGNANT KAR DU",
    "MADARCHOD KI NASAL",
    "TERI AMA KI CHUT ME MIRCH DAAL DU",
    "SALE HARAMI GANDU",
    "TERI BHEN KA BHOOTA"
];

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID } = event;

    if (args[0] === "off") {
        if (intervals[threadID]) {
            clearInterval(intervals[threadID]);
            delete intervals[threadID];
            return api.sendMessage("❌ Sarvar mode OFF ho gaya", threadID, messageID);
        } else {
            return api.sendMessage("⚠️ Sarvar already OFF hai", threadID, messageID);
        }
    }

    if (args[0] === "on") {
        if (intervals[threadID]) {
            return api.sendMessage("⚠️ Sarvar already chal raha hai is group mein", threadID, messageID);
        }

        const mentionIDs = Object.keys(event.mentions);

        if (mentionIDs.length === 0) {
            return api.sendMessage(
                "⚠️ Kisi ko tag karo!\nUsage: server on @user",
                threadID,
                messageID
            );
        }

        const targetID = mentionIDs[0];
        const targetName = event.mentions[targetID];

        api.sendMessage(
            `✅ Sarvar mode ON!\n🎯 Target: ${targetName}\n🔥`,
            threadID,
            messageID
        );

        let i = Math.floor(Math.random() * messages.length);

        intervals[threadID] = setInterval(() => {
            const gali = messages[i];
            const body = `@${targetName} ${gali}`;

            api.sendMessage(
                {
                    body: body,
                    mentions: [
                        {
                            id: targetID,
                            tag: `@${targetName}`,
                            fromIndex: 0
                        }
                    ]
                },
                threadID
            );

            i = (i + 1) % messages.length;
        }, 25000);

        return;
    }

    return api.sendMessage(
        "📌 Usage:\n▸ server on @user — Target ko gaaliyan bhejo\n▸ server off — Band karo",
        threadID,
        messageID
    );
};
