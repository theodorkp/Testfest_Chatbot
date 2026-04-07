import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import path from "path";
import { askGemini, uploadPdfToGemini } from "./gemini.js";
import { getSuggestedPrompts, getSuggestedPromptById } from "./suggestedPrompts.js";
import "./seedSuggestedPrompts.js";

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({
  dest: uploadsDir,
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Kun PDF er støttet foreløpig."));
    }
    cb(null, true);
  },
});

// Én aktiv fil om gangen, i minnet
let activeFile = null;

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "testfest-chatbot-api" });
});

app.get("/api/suggested-prompts", (_req, res) => {
  res.json({ items: getSuggestedPrompts() });
});

app.get("/api/suggested-prompts/:id", (req, res) => {
  const item = getSuggestedPromptById(Number(req.params.id));

  if (!item) {
    return res.status(404).json({ error: "Fant ikke foreslått spørsmål." });
  }

  res.json(item);
});

app.get("/api/active-file", (_req, res) => {
  res.json({
    file: activeFile
      ? {
          name: activeFile.displayName,
          mimeType: activeFile.mimeType,
          uri: activeFile.uri,
        }
      : null,
  });
});

app.delete("/api/active-file", (_req, res) => {
  activeFile = null;
  res.json({ ok: true });
});

app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Ingen fil ble lastet opp." });
    }

    const uploaded = await uploadPdfToGemini(req.file.path, req.file.mimetype);

    activeFile = {
      uri: uploaded.uri,
      mimeType: uploaded.mimeType,
      displayName: req.file.originalname,
    };

    fs.unlink(req.file.path, () => {});

    res.status(201).json({
      ok: true,
      file: activeFile,
    });
  } catch (error) {
    console.error("Upload error:", error?.message || error);
    console.error("Full upload error:", error);

    res.status(500).json({
      error: "Kunne ikke laste opp PDF til språkmodellen.",
    });
  }
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: "Feltet 'message' må være en tekststreng.",
      });
    }

    const answer = await askGemini({
      message,
      history: Array.isArray(history) ? history : [],
      activeFile,
    });

    res.json({
      answer,
      source: activeFile ? "llm+file" : "llm",
      activeFile: activeFile
        ? {
            name: activeFile.displayName,
          }
        : null,
    });
  } catch (error) {
    console.error("Chat error:", error?.message || error);
    console.error("Full error:", error);

    const status = error?.status;
    const messageText = error?.message || "";

    if (
      status === 503 ||
      messageText.includes("503") ||
      messageText.toLowerCase().includes("high demand") ||
      messageText.toLowerCase().includes("unavailable")
    ) {
      return res.status(503).json({
        error:
          "Språkmodellen er midlertidig opptatt akkurat nå. Prøv igjen om noen sekunder.",
      });
    }

    res.status(500).json({
      error: "Noe gikk galt ved kall til språkmodellen.",
    });
  }
});

app.use((error, _req, res, _next) => {
  if (error?.message === "Kun PDF er støttet foreløpig.") {
    return res.status(400).json({ error: error.message });
  }

  if (error?.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      error: "Filen er for stor. Maks størrelse er 20 MB i denne første versjonen.",
    });
  }

  res.status(500).json({ error: "Ukjent serverfeil." });
});

app.listen(port, () => {
  console.log(`Server kjører på http://localhost:${port}`);
});