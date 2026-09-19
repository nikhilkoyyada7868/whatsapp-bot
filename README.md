<div align="center">

# WhatsApp Mood Tracker

### A conversational mood journal that works inside WhatsApp.

![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=nodedotjs&logoColor=white)
![Twilio](https://img.shields.io/badge/Twilio-WhatsApp-F22F46?logo=twilio&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-Local_storage-003B57?logo=sqlite&logoColor=white)

</div>

## Why this exists

Mood-tracking apps often fail because opening another app and filling out a form feels like work. This prototype moves the habit into WhatsApp: reply with a number, choose a more precise emotion, optionally explain why, and the entry is saved.

## Conversation flow

```text
Any message
   ↓
Choose 1 of 9 emotions
   ↓
Choose a matching sub-emotion
   ↓
Add a note or type SKIP
   ↓
Entry saved to SQLite
```

Send `history` to choose a 7-day, 30-day, or one-year summary. The bot returns emotion counts and a dated list of entries.

## Features

- Nine top-level moods and context-specific sub-emotions
- Optional free-text reflection
- Per-phone-number history
- WhatsApp-compatible TwiML responses
- Local SQLite persistence with automatic schema creation
- JSON endpoint at `GET /moods` for prototype inspection

## Tech stack

- Node.js and Express 5
- Twilio WhatsApp webhooks and TwiML
- better-sqlite3
- body-parser

## Run locally

```bash
git clone https://github.com/nikhilkoyyada7868/whatsapp-bot.git
cd whatsapp-bot
npm install
node index.js
```

The server listens on `http://localhost:3000`. Expose it over HTTPS with a tunneling tool, then configure your Twilio WhatsApp sandbox's incoming-message webhook to:

```text
POST https://your-public-url.example/whatsapp
```

No Twilio credentials are required in this process because the app responds directly to each inbound webhook with TwiML.

## Data model

Each entry stores the sender's phone identifier, emotion, sub-emotion, optional note, and creation time in `moods.db`.

## Prototype boundaries

- Conversation state is held in memory and is lost on restart.
- `GET /moods` is unauthenticated and exposes all stored entries; it is for local demos only.
- Incoming Twilio signatures are not currently validated.
- Phone identifiers and notes are sensitive data and need encryption, retention controls, consent, access control, and deletion workflows before real-world use.
- The history summary counts entries; it is not a clinical assessment or mental-health advice.

## Next product steps

Add durable session state, webhook verification, authenticated private history, scheduled check-ins, trend visualization, export/delete controls, and crisis-language safety handling.
