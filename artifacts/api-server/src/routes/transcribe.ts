import express, { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

/**
 * POST /api/transcribe?lang=en
 * Body: raw audio bytes (Content-Type: audio/webm or audio/ogg)
 * Returns: { transcript: string }
 *
 * Uses OpenAI Whisper to transcribe mic audio recorded via MediaRecorder.
 * This replaces the broken Chrome webkitSpeechRecognition (Google cloud) approach.
 */
router.post(
  "/transcribe",
  express.raw({ type: ["audio/*", "application/octet-stream"], limit: "25mb" }),
  async (req, res) => {
    const lang = typeof req.query.lang === "string" ? req.query.lang : "en";
    const audioBuffer: Buffer = req.body as Buffer;

    if (!Buffer.isBuffer(audioBuffer) || audioBuffer.length < 100) {
      return res.status(400).json({ error: "No audio data received." });
    }

    console.log(`[transcribe] received ${audioBuffer.length} bytes, lang=${lang}`);

    try {
      // Node.js 18+ has File built-in (used as an UploadFile for OpenAI SDK)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const file = new File([audioBuffer], "audio.webm", { type: "audio/webm" }) as any;

      const transcription = await openai.audio.transcriptions.create({
        file,
        model: "whisper-1",
        language: lang.startsWith("es") ? "es" : "en",
      });

      const transcript = transcription.text?.trim() ?? "";
      console.log(`[transcribe] result: "${transcript}"`);
      return res.json({ transcript });
    } catch (err) {
      console.error("[transcribe] Whisper error:", err);
      return res.status(500).json({ error: "Transcription failed." });
    }
  },
);

export default router;
