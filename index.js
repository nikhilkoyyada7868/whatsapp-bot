const express = require("express");
const bodyParser = require("body-parser");
const twilio = require("twilio");

const Database = require("better-sqlite3");

// Create / open DB
const db = new Database("moods.db");

// Create table if not exists
db.prepare(`
  CREATE TABLE IF NOT EXISTS moods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT,
    emotion TEXT,
    sub_emotion TEXT,
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();


const app = express();
const userState = {};
app.use(bodyParser.urlencoded({ extended: false }));

const emotions = {
    "1": "Happy",
    "2": "Sad",
    "3": "Angry",
    "4": "Anxious",
    "5": "Calm",
    "6": "Excited",
    "7": "Tired",
    "8": "Stressed",
    "9": "Grateful"
};

const subEmotions = {
    Happy: ["Content", "Proud", "Playful", "Optimistic", "Relieved"],
    Sad: ["Lonely", "Disappointed", "Hurt", "Hopeless", "Down"],
    Angry: ["Irritated", "Frustrated", "Resentful", "Jealous", "Offended"],
    Anxious: ["Worried", "Overwhelmed", "Nervous", "Insecure", "Restless"],
    Calm: ["Peaceful", "Relaxed", "Grounded", "Safe", "Balanced"],
    Excited: ["Motivated", "Energetic", "Curious", "Inspired", "Eager"],
    Tired: ["Drained", "Sleepy", "Burned out", "Fatigued", "Unmotivated"],
    Stressed: ["Pressured", "Tense", "Rushed", "Stuck", "Panicky"],
    Grateful: ["Thankful", "Blessed", "Appreciative", "Connected", "Satisfied"]
};


function getHistory(from, days) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    return db
        .prepare(`
      SELECT emotion, sub_emotion, note, created_at
      FROM moods
      WHERE phone = ?
        AND created_at >= ?
      ORDER BY created_at DESC
    `)
        .all(from, since.toISOString());
}


app.post("/whatsapp", (req, res) => {
    const from = req.body.From;
    const message = req.body.Body.trim();
    const twiml = new twilio.twiml.MessagingResponse();

    if (message.toLowerCase() === "history") {
        userState[from] = { stage: "HISTORY_RANGE" };

        twiml.message(
            "📊 Your mood history:\n\n" +
            "1) Last 7 days\n" +
            "2) Last 30 days\n" +
            "3) Last 1 year\n\n" +
            "Reply with a number."
        );

        return res.type("text/xml").send(twiml.toString());
    }

    else if (userState[from]?.stage === "HISTORY_RANGE") {
        const rangeMap = {
            "1": 7,
            "2": 30,
            "3": 365
        };

        const days = rangeMap[message];

        if (!days) {
            twiml.message("Please reply with 1, 2, or 3.");
            return res.type("text/xml").send(twiml.toString());
        }

        const rows = getHistory(from, days);

        if (rows.length === 0) {
            twiml.message("No mood entries found for this period.");
            delete userState[from];
            return res.type("text/xml").send(twiml.toString());
        }

        // Count emotions
        const counts = {};
        rows.forEach(r => {
            counts[r.emotion] = (counts[r.emotion] || 0) + 1;
        });

        let reply = `📊 Mood summary (last ${days} days):\n\n`;
        Object.entries(counts).forEach(([emotion, count]) => {
            reply += `• ${emotion}: ${count} times\n`;
        });

        reply += "\n📝 Entries:\n";
        rows.forEach(r => {
            reply += `- ${r.emotion} / ${r.sub_emotion} (${r.created_at.split("T")[0]})\n`;
        });

        twiml.message(reply);
        delete userState[from];

        return res.type("text/xml").send(twiml.toString());
    }

    // =========================
    // STEP 3: WHY (check FIRST)
    // =========================
    else if (userState[from]?.stage === "WHY") {
        const note = message.toUpperCase() === "SKIP" ? null : message;
        const summary = userState[from];

        db.prepare(
            `INSERT INTO moods (phone, emotion, sub_emotion, note)
   VALUES (?, ?, ?, ?)`
        ).run(from, summary.emotion, summary.subEmotion, note);



        twiml.message(
            `Your mood has been saved ✅\n\n` +
            `Emotion: *${summary.emotion}*\n` +
            `Sub-emotion: *${summary.subEmotion}*`
        );

        delete userState[from];
    }

    // =========================
    // STEP 2: SUB-EMOTION
    // =========================
    else if (userState[from]?.stage === "SUB_EMOTION") {
        const emotion = userState[from].emotion;
        const options = subEmotions[emotion];
        const index = parseInt(message) - 1;

        if (options[index]) {
            userState[from].subEmotion = options[index];
            userState[from].stage = "WHY";

            twiml.message(
                `Sub-emotion selected: *${options[index]}* 👍\n\n` +
                `Would you like to share why you feel this way?\n` +
                `Reply with text or type SKIP`
            );
        } else {
            twiml.message("Please reply with a valid number.");
        }
    }

    // =========================
    // STEP 1: EMOTION
    // =========================
    else if (emotions[message]) {
        const emotion = emotions[message];
        userState[from] = { stage: "SUB_EMOTION", emotion };

        let reply = `You selected *${emotion}*.\n\nChoose a sub-emotion:\n`;
        subEmotions[emotion].forEach((sub, i) => {
            reply += `${i + 1}) ${sub}\n`;
        });

        twiml.message(reply);
    }

    // =========================
    // DEFAULT / FIRST MESSAGE
    // =========================
    else {
        twiml.message(
            "How’s your mood today?\n\n" +
            "1) Happy\n" +
            "2) Sad\n" +
            "3) Angry\n" +
            "4) Anxious\n" +
            "5) Calm\n" +
            "6) Excited\n" +
            "7) Tired\n" +
            "8) Stressed\n" +
            "9) Grateful\n\n" +
            "Reply with a number (1-9)."
        );
    }

    res.type("text/xml").send(twiml.toString());
});

app.get("/moods", (req, res) => {
    try {
        const rows = db
            .prepare(
                "SELECT phone, emotion, sub_emotion, note, created_at FROM moods ORDER BY created_at DESC"
            )
            .all();

        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});



app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});