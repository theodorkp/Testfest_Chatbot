import "dotenv/config";
import express from "express";
import cors from "cors";
import { askGemini } from "./gemini.js";

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "testfest-chatbot-api" });
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Feltet 'message' må være en tekststreng." });
    }

    const answer = await askGemini({
      message,
      history: Array.isArray(history) ? history : [],
    });

    res.json({ answer });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({
      error: "Noe gikk galt ved kall til språkmodellen.",
    });
  }
});

app.listen(port, () => {
  console.log(`Server kjører på http://localhost:${port}`);
});