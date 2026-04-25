import { env } from './env';
import { Ollama } from 'ollama';
import { GoogleGenAI } from '@google/genai';

const gemini = new GoogleGenAI({
    apiKey: env.googleApiKey,
});

const ollama = new Ollama({
    host: 'http://localhost:11434'
});


import OpenAI from "openai";

const openrouter = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: "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",
});




export { gemini, ollama, openrouter }