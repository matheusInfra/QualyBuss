import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = 3001; // Porta diferente do Vite (3000/5173)

app.use(cors());
app.use(express.json());

// Rota de Chat
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        const apiKey = process.env.GOOGLE_AI_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: 'Configuração de API Key ausente no servidor.' });
        }

        const genAI = new GoogleGenerativeAI(apiKey);

        // Configuração solicitada: Gemini 1.5 Flash com Temperatura 0.3
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 1000,
            }
        });

        console.log('Sending message to Gemini (1.5 Flash, Temp 0.3)...');

        const result = await model.generateContent(message);
        const response = await result.response;
        const text = response.text();

        console.log('Response received.');
        res.json({ text });

    } catch (error) {
        console.error('SERVER ERROR:', error);
        // Extract Google API error details if available
        const status = error.status || 500;
        const message = error.message || 'Internal Server Error';
        res.status(status).json({ error: message, details: error.errorDetails });
    }
});

app.listen(port, () => {
    console.log(`✅ Servidor de Chat (Self-Hosted) rodando em http://localhost:${port}`);
});
