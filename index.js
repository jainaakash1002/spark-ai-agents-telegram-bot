import dotenv from "dotenv";
import TelegramBot from "node-telegram-bot-api";
import { getGeminiResponse,getGeminiChatResponse } from './gemini.js';
import pool from "./db.js";

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

// bot.on('message', async (msg) => {
//     if (msg.text && msg.text.startsWith('/')) return;

//     console.log(msg,"hehe");
    
//     const chatId = msg.chat.id;
//     const userMessage = msg.text;
    
//     try {
//         // await pool.query(
//         //     'INSERT INTO telegram_messages (message_id, user_id, first_name, last_name, username, is_bot, language_code, chat_type, text, date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
//         //     [
//         //         msg.message_id,
//         //         msg.from.id,
//         //         msg.from.first_name,
//         //         msg.from.last_name || null,
//         //         msg.from.username || null,
//         //         msg.from.is_bot,
//         //         msg.from.language_code || null,
//         //         msg.chat.type,
//         //         msg.text,
//         //         Math.floor(msg.date)
//         //     ]
//         // );


//         const [insertResult, historyResult] = await Promise.all([
//             // Insert new message
//             pool.query(
//                 'INSERT INTO telegram_messages (message_id, user_id, first_name, last_name, username, is_bot, language_code, chat_type, text, date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
//                 [
//                     msg.message_id,
//                     msg.from.id,
//                     msg.from.first_name,
//                     msg.from.last_name || null,
//                     msg.from.username || null,
//                     msg.from.is_bot,
//                     msg.from.language_code || null,
//                     msg.chat.type,
//                     msg.text,
//                     Math.floor(msg.date)
//                 ]
//             ),
//             // Fetch conversation history for this user
//             pool.query(
//                 'SELECT * FROM telegram_messages WHERE user_id = $1 ORDER BY date DESC',
//                 [msg.from.id]
//             )
//         ]);

//         console.log('User conversation history:', historyResult.rows);

//         bot.sendChatAction(chatId, 'typing');
        
//         const response = await getGeminiResponse(userMessage);
        
//         await bot.sendMessage(chatId, response);
//     } catch (error) {
//         console.error('Error:', error);
//         bot.sendMessage(chatId, 'Sorry, I encountered an error processing your request.');
//     }
// });


bot.on('message', async (msg) => {
    // Ignore commands
    if (msg.text && msg.text.startsWith('/')) return;

    console.log(msg,"hehe");
    
    const chatId = msg.chat.id;
    const userMessage = msg.text;
    const userId = msg.from.id;
    bot.sendChatAction(chatId, 'typing');

    
    try {
        // Simultaneously execute both database operations
        const [insertResult, historyResult] = await Promise.all([
            // Insert new message
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
            // Fetch conversation history for this user
            pool.query(
                'SELECT text FROM telegram_messages WHERE user_id = $1 ORDER BY date ASC',
                [userId]
            )
        ]);

        // Format conversation history for Gemini
        const chatHistory = historyResult.rows.map(row => ({
            role: "user",
            parts: [{ text: row.text }]
        }));

        // Add current message to history
        chatHistory.push({
            role: "user",
            parts: [{ text: userMessage }]
        });

        // Send "typing" action to show the bot is processing
        // bot.sendChatAction(chatId, 'typing');
        
        // Get response from Gemini using chat history
        const response = await getGeminiChatResponse(chatHistory);
        
        // Send the response back to user
        await bot.sendMessage(chatId, response);
    } catch (error) {
        console.error('Error:', error);
        bot.sendMessage(chatId, 'Sorry, I encountered an error processing your request.');
    }
});