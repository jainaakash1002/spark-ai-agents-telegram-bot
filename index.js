import dotenv from "dotenv";
import TelegramBot from "node-telegram-bot-api";
import { getGeminiResponse } from './gemini.js';

dotenv.config();

const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token, { polling: true });

(async () => {
	await bot.setMyCommands([
		{ command: "alive", description: "Check the bot is alive or not" }
	]);
})();

bot.onText(/\/start/, (msg) => {
	const chatId = msg.chat.id;
	const description =
		"Welcome to the Spark Ai Agent Bot! 🤖.\n\n - A powerful AI bot leveraging Google's Gemini model to provide intelligent responses with advanced reasoning capabilities for various tasks including coding, analysis, and creative collaboration.";
	bot.sendMessage(chatId, description);
});

bot.onText(/\/alive/, (msg) => {
	console.log(msg);
	bot.sendMessage(msg.chat.id, "Hey Telegrammer I(🤖)'m up and running! How can i help you today?");
});

bot.on('message', async (msg) => {
    // Ignore commands
    if (msg.text && msg.text.startsWith('/')) return;
    
    const chatId = msg.chat.id;
    const userMessage = msg.text;
    
    try {
        // Send "typing" action to show the bot is processing
        bot.sendChatAction(chatId, 'typing');
        
        // Get response from Gemini
        const response = await getGeminiResponse(userMessage);
        
        // Send the response back to user
        await bot.sendMessage(chatId, response);
    } catch (error) {
        console.error('Error:', error);
        bot.sendMessage(chatId, 'Sorry, I encountered an error processing your request.');
    }
});
