import OpenAI from "openai";

import { env } from './env';

const cleanKey = (key: string): string => {
  if (!key) return "";
  return key.trim().replace(/^"|"$/g, "");
};

export const getLLMClientAndModel = (language: string = "en") => {
  const provider = env.LLM_PROVIDER?.toLowerCase() || "openrouter";
  const isArabic = language.toLowerCase() === "ar";

  if (provider === "openai") {
    const client = new OpenAI({
      apiKey: cleanKey(env.OPENAI_API_KEY || env.OPENROUTER_API_KEY),
    });
    const model = isArabic ? env.OPENAI_MODEL_AR : env.OPENAI_MODEL_EN;
    return { client, model };
  }

  if (provider === "gemini") {
    const client = new OpenAI({
      apiKey: cleanKey(env.GEMINI_API_KEY),
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
    });
    const model = isArabic ? env.GEMINI_MODEL_AR : env.GEMINI_MODEL_EN;
    return { client, model };
  }

  // Default: OpenRouter
  const client = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: cleanKey(env.OPENROUTER_API_KEY),
    defaultHeaders: {
      "X-Title": "NJrk.Fit",
    },
  });
  const model = isArabic ? env.LLM_MODEL_AR : env.LLM_MODEL_EN;
  return { client, model };
};