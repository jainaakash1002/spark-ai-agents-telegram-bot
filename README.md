# Spark AI Agent Bot 🤖

A powerful Telegram bot leveraging Google's Gemini model to provide intelligent responses with advanced reasoning capabilities. The bot processes multimodal inputs and offers interactive conversations with real-time typing indicators and message reactions.

## Features

- 🧠 Powered by Google's Gemini AI model
- 💬 Natural language processing and understanding
- ⚡ Real-time typing indicators for better user experience
- 🎯 Interactive message reactions
- 🔄 Continuous conversation support

## Commands

- `/start` - Initialize the bot and get welcome message
- `/alive` - Check if the bot is operational

## Setup

1. Clone the repository
2. Install dependencies:
```bash
npm install
```
3. Set up environment variables:
- `TELEGRAM_TOKEN`: Your Telegram bot token
- `GOOGLE_API_KEY`: Your Google API key
4. Start the bot:
```bash
npm start
```


## Tech Stack
- Node.js
- node-telegram-bot-api
- Google Gemini AI API
- dotenv for environment management
## Project Structure
```
├── index.js          # Main bot application
├── gemini.js         # Gemini API integration
├── db.js             # Database operations
├── package.json      # Project dependencies
└── .env              # Environment variables
```
## Contributing
Feel free to submit issues and enhancement requests!