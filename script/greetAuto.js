const cron = require('node-cron');

const config = {
  name: "greethourly",
  version: "1.2.0",
  role: 0,
  credits: "ARI + AJ",
  description: "Automatic greetings at specific times (Asia/Karachi) with custom messages",
  hasPrefix: true,

  greetings: [
    {
      cronTime: '0 5 * * *',
      messages: [`Good morning! Have a great day ahead!`],
    },
    {
      cronTime: '0 8 * * *',
      messages: [`Hello Everyone Time Check 8:00 AM :>`],
    },
    {
      cronTime: '0 10 * * *',
      messages: [`Hello everyone! How's your day going?`],
    },
    {
      cronTime: '0 12 * * *',
      messages: [`Lunchtime reminder: Take a break and eat well!`],
    },
    {
      cronTime: '0 14 * * *',
      messages: [`Reminder: Don't forget your tasks for today!`],
    },
    {
      cronTime: '0 18 * * *',
      messages: [`Good evening! Relax and enjoy your evening.`],
    },
    {
      cronTime: '0 20 * * *',
      messages: [`Time to wind down. Have a peaceful evening.`],
    },
    {
      cronTime: '0 22 * * *',
      messages: [`Good night! Have a restful sleep.`],
    }
  ]
};

module.exports.config = config;

config.greetings.forEach((greeting) => {
  cron.schedule(greeting.cronTime, async () => {
    const message = typeof greeting.messages[0] === 'function'
      ? await greeting.messages[0]()
      : greeting.messages[0];

    api.getThreadList(20, null, ['INBOX']).then((list) => {
      list.forEach((thread) => {
        if (thread.isGroup) {
          api.sendMessage(message, thread.threadID).catch((error) => {
            console.log(`Error sending message: ${error}`, 'AutoGreet');
          });
        }
      });
    }).catch((error) => {
      console.log(`Error getting thread list: ${error}`, 'AutoGreet');
    });
  }, {
    scheduled: true,
    timezone: "Asia/Karachi"
  });
});
