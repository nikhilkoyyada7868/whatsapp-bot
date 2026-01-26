const express = require("express");
const bodyParser = require("body-parser");
const twilio = require("twilio");

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

app.post("/whatsapp", (req, res) => {
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message("Webhook connected ✅");
    res.type("text/xml").send(twiml.toString());
});

app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});