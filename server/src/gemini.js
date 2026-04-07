import { GoogleGenAI, createUserContent, createPartFromUri } from "@google/genai";
import { systemInstruction } from "./prompts.js";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function uploadPdfToGemini(filePath, mimeType = "application/pdf") {
  const uploadedFile = await ai.files.upload({
    file: filePath,
    config: { mimeType },
  });

  return uploadedFile;
}

export async function askGemini({ message, history = [], activeFile = null }) {
  const priorTurns = history;

  const currentUserContent = activeFile
    ? createUserContent([
        createPartFromUri(activeFile.uri, activeFile.mimeType),
        message,
      ])
    : {
        role: "user",
        parts: [{ text: message }],
      };

  const contents = [...priorTurns, currentUserContent];

  const maxAttempts = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        config: {
          systemInstruction,
          temperature: 0.3,
          maxOutputTokens: 2000,
        },
        contents,
      });

      return response.text;
    } catch (error) {
      lastError = error;

      const status = error?.status;
      const messageText = error?.message || "";

      const isRetryable =
        status === 503 ||
        messageText.includes("503") ||
        messageText.toLowerCase().includes("high demand") ||
        messageText.toLowerCase().includes("unavailable");

      if (!isRetryable || attempt === maxAttempts) {
        throw error;
      }

      await sleep(1000 * attempt);
    }
  }

  throw lastError;
}