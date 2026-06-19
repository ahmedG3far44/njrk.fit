import OpenAI from "openai";

import { env } from './env';

export const cleanKey = (key: string): string => {
  if (!key) return "";
  return key.trim().replace(/^"|"$/g, "");
};

export const getLLMClientAndModel = (language: string = "en") => {
  const isArabic = language.toLowerCase() === "ar";

  const client = new OpenAI({
    apiKey: cleanKey(env.GEMINI_API_KEY),
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
  });
  const model = isArabic ? env.GEMINI_MODEL_AR : env.GEMINI_MODEL_EN;
  return { client, model };
};