import express, { Router } from "express";
import { speechToText, ensureCompatibleFormat } from "@workspace/integrations-openai-ai-server/audio";

const router = Router();

/**
 * POST /api/transcribe?lang=en
 * Body: raw audio bytes (Content-Type: audio/webm or audio/ogg or audio/mp4)
 * Returns: { transcript: string }
 *
 * Uses gpt-4o-mini-transcribe via the built-in speechToText helper.
 * Audio is automatically converted to WAV when the format isn't directly supported.
 */
router.post(
  "/transcribe",
  express.raw({ type: ["audio/*", "application/octet-stream"], limit: "25mb" }),
  async (req, res) => {
    const audioBuffer: Buffer = req.body as Buffer;

    if (!Buffer.isBuffer(audioBuffer) || audioBuffer.length < 100) {
      return res.status(400).json({ error: "No audio data received." });
    }

    console.log(`[transcribe] received ${audioBuffer.length} bytes`);

    try {
      // Detect and convert to a format supported by speechToText: wav | mp3 | webm
      const { buffer: compatBuffer, format } = await ensureCompatibleFormat(audioBuffer);
      console.log(`[transcribe] format: ${format}`);

      // speechToText supports "wav" | "mp3" | "webm" — default to wav if unknown
      const safeFormat: "wav" | "mp3" | "webm" =
        format === "mp3" ? "mp3" : format === "webm" ? "webm" : "wav";

      const transcript = await speechToText(compatBuffer, safeFormat);
      const cleaned = transcript?.trim() ?? "";
      console.log(`[transcribe] result: "${cleaned}"`);
      return res.json({ transcript: cleaned });
    } catch (err) {
      console.error("[transcribe] error:", err);
      return res.status(500).json({ error: "Transcription failed." });
    }
  },
);

export default router;
