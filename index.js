import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

//== Tambahan setup untuk __dirname di ES Modules ==//
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); 

const app = express();
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

//const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_MODEL = 'gemini-2.5-flash-lite';

app.use(cors());
app.use(express.json());

//=== Tambahan middleware untuk melayani file statis (frontend) ===//
// Serves all files in public_solution (HTML, CSS, JS) at the root path
//app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static('public'));

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Gemini Chatbot Server is running on port ${PORT}`);
});

app.post('/api/chat', async (req, res) => {
    const { conversation } = req.body;
    try {
        if(!Array.isArray(conversation)) throw new Error('Conversation must be an array of messages');
        
        const contents = conversation.map(({role, text}) => ({
            role,
            parts: [{ text }]   
        }));

        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents,
            config: {
                temperature: 0.9,
                systemInstruction: `Anda adalah asisten chatbot pariwisata yang sangat ahli. 
                Tugas utama Anda adalah memberikan informasi, rekomendasi destinasi, tips perjalanan, kuliner lokal, dan hal-hal yang berkaitan dengan pariwisata. 
                
                ATURAN KETAT:
                1. Jika pengguna bertanya tentang topik di luar pariwisata (seperti matematika, politik, sains umum, atau pemrograman), Anda WAJIB menjawab: "Maaf, pertanyaan Anda tidak relevan dengan topik pariwisata. Saya hanya dapat membantu hal-hal seputar perjalanan dan destinasi wisata."
                2. Selalu jawab dalam Bahasa Indonesia yang ramah dan membantu.`,
            },
        });
        res.status(200).json({ result: response.text });
    } catch (e) {  
        res.status(500).json({ error: e.message || 'An error occurred while processing your request' }); 
    }
    })
     