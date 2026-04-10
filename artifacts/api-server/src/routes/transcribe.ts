import express, { Router } from "express";
import { speechToText } from "@workspace/integrations-openai-ai-server/audio";

const router = Router();

/**
 * POST /api/transcribe?lang=en
 * Body: raw audio bytes (Content-Type: audio/webm | audio/ogg | audio/mp4 | audio/wav)
 * Returns: { transcript: string }
 *
 * Passes audio directly to OpenAI Whisper without ffmpeg conversion.
 * Whisper natively supports webm, ogg, mp3, mp4, and wav — no format conversion needed.
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
      // Detect format directly from Content-Type — no ffmpeg needed.
      // Whisper supports webm, ogg, mp3, mp4, wav natively.
      const ct: string = (req.headers["content-type"] ?? "audio/webm").toLowerCase();
      let format: "wav" | "mp3" | "webm" = "webm";
      if (ct.includes("mp3") || ct.includes("mpeg")) format = "mp3";
      else if (ct.includes("wav"))                   format = "wav";
      else                                           format = "webm"; // webm/ogg both work

      console.log(`[transcribe] format: ${format}`);

      const transcript = await speechToText(audioBuffer, format);
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
