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

export async function askGemini({
  message,
  history = [],
  activeFile = null,
  activeUrl = null,
}) {
  let contents = [
    ...history,
    activeFile
      ? createUserContent([
          createPartFromUri(activeFile.uri, activeFile.mimeType),
          message,
        ])
      : {
          role: "user",
          parts: [{ text: message }],
        },
  ];

  const maxAttempts = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const config = {
        systemInstruction,
        temperature: 0.3,
        maxOutputTokens: 2000,
      };

      if (activeUrl) {
        config.tools = [{ urlContext: {} }];
        contents = [
          ...history,
          {
            role: "user",
            parts: [
              {
                text: `Svar på spørsmålet ved å bruke denne lenken som kontekst:\n${activeUrl}\n\nSpørsmål: ${message}`,
              },
            ],
          },
        ];
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents,
        config,
      });

      return {
        text: response.text,
        urlContextMetadata: response.candidates?.[0]?.urlContextMetadata || null,
      };
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