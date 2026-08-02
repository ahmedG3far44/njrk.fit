import OpenAI from "openai";

import { env } from './env';

export const cleanKey = (key: string): string => {
  if (!key) return "";
  return key.trim().replace(/^"|"$/g, "");
};

export const getLLMClientAndModel = (_language: string = "en") => {
  const client = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: cleanKey(env.OPEN_ROUTER_API_KEY),
    defaultHeaders: {
      "HTTP-Referer": "https://njerka.xyz",
      "X-OpenRouter-Title": "Njerka.fit",
    },
  });
  const model = env.OPEN_ROUTER_MODEL || "openrouter/free";
  return { client, model };
};
