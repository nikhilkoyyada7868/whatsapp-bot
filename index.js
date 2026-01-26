const express = require("express");
const bodyParser = require("body-parser");
const twilio = require("twilio");

const sqlite3 = require("sqlite3").verbose();

// Open (or create) SQLite database file
const db = new sqlite3.Database("./moods.db");

// Create table if it doesn't exist
db.run(`
  CREATE TABLE IF NOT EXISTS moods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT,
    emotion TEXT,
    sub_emotion TEXT,
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);


const app = express();
const userState = {};
app.use(bodyParser.urlencoded({ extended: false }));

app.post("/whatsapp", (req, res) => {
    const from = req.body.From;
    const message = req.body.Body.trim();
    const twiml = new twilio.twiml.MessagingResponse();

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

    // =========================
    // STEP 3: WHY (check FIRST)
    // =========================
    if (userState[from]?.stage === "WHY") {
        const note = message.toUpperCase() === "SKIP" ? "" : message;
        const summary = userState[from];

        db.run(
            `INSERT INTO moods (phone, emotion, sub_emotion, note)
   VALUES (?, ?, ?, ?)`,
            [from, summary.emotion, summary.subEmotion, note],
            (err) => {
                if (err) {
                    console.error("DB error:", err);
                }
            }
        );


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
    db.all(
        "SELECT phone, emotion, sub_emotion, note, created_at FROM moods ORDER BY created_at DESC",
        [],
        (err, rows) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json(rows);
        }
    );
});


app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});