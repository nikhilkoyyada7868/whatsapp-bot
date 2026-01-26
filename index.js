const express = require("express");
const bodyParser = require("body-parser");
const twilio = require("twilio");

const app = express();
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

    // If user sends a valid emotion number
    if (emotions[message]) {
        twiml.message(
            `You selected: *${emotions[message]}* 👍`
        );
    } else {
        // Default response (first message or invalid input)
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