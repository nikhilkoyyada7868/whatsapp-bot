const express = require("express");
const bodyParser = require("body-parser");
const twilio = require("twilio");

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

    // STEP 1: Emotion selection
    if (emotions[message]) {
        const emotion = emotions[message];
        userState[from] = { stage: "SUB_EMOTION", emotion };

        let reply = `You selected *${emotion}*.\n\nChoose a sub-emotion:\n`;
        subEmotions[emotion].forEach((sub, i) => {
            reply += `${i + 1}) ${sub}\n`;
        });

        twiml.message(reply);
    }

    // STEP 2: Sub-emotion selection
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

    // STEP 3: Optional "why"
    else if (userState[from]?.stage === "WHY") {
        const note = message.toUpperCase() === "SKIP" ? "" : message;

        const summary = userState[from];

        // (For now, just log — DB comes next step)
        console.log({
            user: from,
            emotion: summary.emotion,
            subEmotion: summary.subEmotion,
            note,
            date: new Date()
        });

        twiml.message(
            `Your mood has been saved ✅\n\n` +
            `Emotion: *${summary.emotion}*\n` +
            `Sub-emotion: *${summary.subEmotion}*`
        );

        // Reset conversation
        delete userState[from];
    }

    // DEFAULT / FIRST MESSAGE
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

app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});