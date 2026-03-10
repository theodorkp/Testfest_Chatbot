import { GoogleGenAI } from "@google/genai";
import { systemInstruction } from "./prompts.js";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function askGemini({ message, history = [] }) {
  const contents = [
    ...history,
    {
      role: "user",
      parts: [{ text: message }],
    },
  ];

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    config: {
      systemInstruction,
      temperature: 0.3,
      maxOutputTokens: 800,
    },
    contents,
  });

  return response.text;
}