import dotenv from "dotenv";
import express from "express";
import TelegramBot from "node-telegram-bot-api";
import { getGeminiResponse,getGeminiChatResponse } from './gemini.js';
import pool from "./db.js";
import cron from 'node-cron';

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// (async () => {
// 	await bot.setMyCommands([
// 		{ command: "alive", description: "Check the bot is alive or not" },
// 		{ command: "clearHistory", description: "Clear the history with bot!" },
// 	]);
// })();

// At the start of your bot initialization
(async () => {
    try {
        await bot.setMyCommands([
            { command: 'start', description: 'Start the bot' },
            { command: 'alive', description: 'Check if bot is running!' },
            { command: 'clearhistory', description: "Clear the history with bot!" },
        ]);
        console.log('Bot commands registered successfully');
    } catch (error) {
        console.error('Error setting bot commands:', error);
    }
})();

bot.onText(/\/start/, (msg) => {
	const chatId = msg.chat.id;
	const description =
		"Welcome to the Spark Ai Agent Bot! 🤖.\n\n - A powerful AI bot leveraging Google's Gemini model to provide intelligent responses with advanced reasoning capabilities for various tasks including coding, analysis, and creative collaboration.";
	bot.sendMessage(chatId, description);
});

bot.onText(/\/alive/, (msg) => {
	bot.sendMessage(msg.chat.id, "Hey Telegrammer I(🤖)'m up and running! How can i help you today?");
});

// bot.onText(/\/clearhistory/, async (msg) => {
//     try {
//         const userId = msg.from.id;
//         const deleteQuery = 'DELETE FROM telegram_messages WHERE user_id = $1';
//         const result = await pool.query(deleteQuery, [userId]);
//         bot.sendChatAction(userId, 'typing');

//         const response = result.rowCount > 0
//             ? `Successfully cleared ${result.rowCount} messages from your history.`
//             : 'No message history found to clear.';
//         if(result.rowCount > 0)    
//         await bot.sendMessage(msg.from.id, "Cleared your history!");
//     } catch (error) {
//         console.error('Failed to clear history:', error);
//         await bot.sendMessage(msg.chat.id, "Sorry, I couldn't clear your message history. Please try again later.");
//     }
// });

bot.onText(/\/clearhistory/, async (msg) => {
    const userId = msg.from.id;
    bot.sendChatAction(userId, 'typing');
    
    try {
        // Use a more efficient query with LIMIT 1 to check existence
        const checkQuery = 'SELECT EXISTS(SELECT 1 FROM telegram_messages WHERE user_id = $1 LIMIT 1)';
        const { exists } = (await pool.query(checkQuery, [userId])).rows[0];
        
        if (!exists) {
            await bot.sendMessage(userId, 'No message history found to clear.');
            return;
        }
        
        // If messages exist, perform the delete operation
        const deleteQuery = 'DELETE FROM telegram_messages WHERE user_id = $1';
        const result = await pool.query(deleteQuery, [userId]);
        await bot.sendMessage(userId, `Cleared yours ${result.rowCount} messages from our history!`);
        
    } catch (error) {
        console.error('Failed to clear history:', error);
        await bot.sendMessage(msg.chat.id, "Sorry, I couldn't clear your message history. Please try again later.");
    }
});
bot.on('message', async (msg) => {
    if (msg.text && msg.text.startsWith('/')) return;
    
    const chatId = msg.chat.id;
    const userMessage = msg.text;
    const userId = msg.from.id;
    bot.sendChatAction(chatId, 'typing');

    
    try {
        const [insertResult, historyResult] = await Promise.all([
            pool.query(
                'INSERT INTO telegram_messages (message_id, user_id, first_name, last_name, username, is_bot, language_code, chat_type, text, date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
                [
                    msg.message_id,
                    userId,
                    msg.from.first_name,
                    msg.from.last_name || null,
                    msg.from.username || null,
                    msg.from.is_bot,
                    msg.from.language_code || null,
                    msg.chat.type,
                    msg.text,
                    Math.floor(msg.date)
                ]
            ),
            pool.query(
                'SELECT text FROM telegram_messages WHERE user_id = $1 ORDER BY date ASC',
                [userId]
            )
        ]);

        const chatHistory = historyResult.rows.map(row => ({
            role: "user",
            parts: [{ text: row.text }]
        }));

        chatHistory.push({
            role: "user",
            parts: [{ text: userMessage }]
        });

        const response = await getGeminiChatResponse(chatHistory);
        
        await bot.sendMessage(chatId, response);
    } catch (error) {
        console.error('Error:', error);
        bot.sendMessage(chatId, 'Sorry, I encountered an error processing your request.');
    }
});

cron.schedule('*/5 * * * *', async () => {
    try {
        const response = await fetch(process.env.BASE_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        console.log('Cron job executed successfully:', new Date().toISOString());
    } catch (error) {
        console.error('Cron job failed:', error);
    }
});

cron.schedule('0 */3 * * *', async () => {
    try {
        const threeDoysAgo = Date.now() / 1000 - (3 * 24 * 60 * 60);
        const deleteQuery = 'DELETE FROM telegram_messages WHERE CAST(date AS BIGINT) < $1';
        const result = await pool.query(deleteQuery, [Math.floor(threeDoysAgo)]);
        console.log(`Cleanup completed: ${result.rowCount} old messages deleted at ${new Date().toISOString()}`);
    } catch (error) {
        console.error('Message cleanup failed:', error);
    }
});

app.get("/", (req, res) => {
	res.send("Hello Bot is Running!");
})

app.listen(port, () => {
	console.log(`Server is running on port ${port}`);
})