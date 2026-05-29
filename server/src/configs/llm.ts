import OpenAI from "openai";

import { env } from './env';



const openrouter = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: env.OPENROUTER_API_KEY,
});

export { openrouter }