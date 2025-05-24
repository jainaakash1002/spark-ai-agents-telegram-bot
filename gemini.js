import { GoogleGenerativeAI } from "@google/generative-ai";

const defaultConfig = {
    temperature: 0.9,
    topK: 1,
    topP: 1,
    maxOutputTokens: 1024,
};

const createGeminiClient = (apiKey) => {
    return new GoogleGenerativeAI(apiKey);
};

export async function getGeminiResponse(prompt, apiKey = process.env.GEMINI_API_KEY) {
    try {
        const genAI = createGeminiClient(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: defaultConfig
        });

        const response = result.response;
        return response.text();
    } catch (error) {
        console.error("Error generating text:", error);
        throw error;
    }
}

export async function getGeminiChatResponse(history, apiKey = process.env.GEMINI_API_KEY) {
    try {
        const genAI = createGeminiClient(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

        const chat = model.startChat({
            history,
            generationConfig: defaultConfig
        });

        const lastMessage = history[history.length - 1];
        const lastUserMessage = lastMessage.parts[0].text;

        const result = await chat.sendMessage(lastUserMessage);
        return result.response.text();
    } catch (error) {
        console.error("Error generating text with history:", error);
        throw error;
    }
}