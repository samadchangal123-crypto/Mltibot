module.exports.config = {
  name: "greethourly",
  version: "1.3.0",
  role: 0,
  credits: "ARI + AJ + Updated by Kashif Raza",
  description: "Automatic greetings at specific times (Pakistan Time) with custom messages",
  hasPrefix: true
};

const TIMEZONE = "Asia/Karachi"; // 🇵🇰 Pakistan Time

const SCHEDULES = [
  { hour: 7, messages: [
    "🌞 Good morning! A new day, a new opportunity!",
    "Good morning! Let’s start the day with a smile. 😊",
    "Rise and shine! Let’s make today productive 💪",
    "Morning! Don’t forget to eat breakfast. 🍳"
  ]},
  { hour: 12, messages: [
    "🍽️ It’s noon! Go eat so you’ll have energy.",
    "Happy lunch! Time to refill your energy. 🔋",
    "Good afternoon! You’re one step closer to your goals. 🚀"
  ]},
  { hour: 18, messages: [
    "🌆 Good evening! Keep pushing towards your goals!",
    "Good evening! Don’t forget to rest too. 💧",
    "It’s evening! Time to relax a bit. 🛋️"
  ]},
  { hour: 22, messages: [
    "🌙 Good night! Get some sleep so you’re fresh tomorrow.",
    "It’s late night! Rest now to recover your energy. 😴",
    "Good night! See you tomorrow for another challenge. ✨",
    "Go to sleep, enough overthinking for today."
  ]}
];

function getDatePK() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: TIMEZONE }));
}

function formatTimePK(date) {
  return new Intl.DateTimeFormat("en-PK", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  }).format(date);
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildMessage(messages) {
  const now = getDatePK();
  const base = pick(messages);
  const timeStr = formatTimePK(now);
  const weekday = now.toLocaleDateString("en-PK", { timeZone: TIMEZONE, weekday: "long" });
  return `${base}\n🕒 ${timeStr} • ${weekday}`;
}

async function getActiveThreads(api) {
  try {
    const inbox = await api.getThreadList(50, null, ["INBOX"]);
    return inbox
      .filter(t => (t.isGroup || t.participants.length > 1) && !t.isArchived)
      .map(t => t.threadID);
  } catch (err) {
    console.error("[greethourly] Error getting thread list:", err.message);
    return [];
  }
}

async function broadcast(api, messages) {
  const message = buildMessage(messages);
  const threads = await getActiveThreads(api);

  if (!threads.length) {
    console.warn("[greethourly] No active threads found.");
    return;
  }

  for (const id of threads) {
    try {
      await api.sendMessage(message, id);
      await sleep(500);
    } catch (e) {
      console.error(`[greethourly] Failed to send to ${id}:`, e.message);
    }
  }
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

let schedulerStarted = false;
function startScheduler(api) {
  if (schedulerStarted) return;
  schedulerStarted = true;

  function scheduleNext() {
    const now = getDatePK();
    let nextSchedule = null;

    for (const sched of SCHEDULES) {
      const target = new Date(now);
      target.setHours(sched.hour, 0, 0, 0);
      if (target > now) {
        nextSchedule = { time: target, messages: sched.messages };
        break;
      }
    }

    if (!nextSchedule) {
      const target = new Date(now);
      target.setDate(now.getDate() + 1);
      target.setHours(SCHEDULES[0].hour, 0, 0, 0);
      nextSchedule = { time: target, messages: SCHEDULES[0].messages };
    }

    const msUntilNext = nextSchedule.time - now;
    console.log(`[greethourly] Next greeting at ${nextSchedule.time.toLocaleString("en-PK", { timeZone: TIMEZONE })}`);

    setTimeout(async () => {
      await broadcast(api, nextSchedule.messages);
      scheduleNext(); 
    }, msUntilNext);
  }

  scheduleNext();
}

// Auto start when bot loads
module.exports.onLoad = function ({ api }) {
  startScheduler(api);
};

module.exports.run = function () { return; };
module.exports.handleEvent = function () { return; };