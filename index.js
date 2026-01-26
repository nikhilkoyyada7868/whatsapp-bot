const express = require("express");
const bodyParser = require("body-parser");
const twilio = require("twilio");

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

app.post("/whatsapp", (req, res) => {
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message("Welcome to whatsapp bot created by Nikhil Koyyada ");
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
    res.type("text/xml").send(twiml.toString());
});

app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});