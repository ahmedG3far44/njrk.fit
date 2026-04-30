import OpenAI from "openai";

import { env } from './env';
import { Ollama } from 'ollama';
import { GoogleGenAI } from '@google/genai';


const gemini = new GoogleGenAI({
    apiKey: env.GOOGLE_API_KEY,
});

const ollama = new Ollama({
    host: 'http://localhost:11434'
});



const openrouter = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: env.OPENROUTER_API_KEY,
});




export { gemini, ollama, openrouter }