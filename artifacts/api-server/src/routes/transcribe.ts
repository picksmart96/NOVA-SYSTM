import express, { Router } from "express";
import { openai, detectAudioFormat, toFile } from "@workspace/integrations-openai-ai-server/audio";

const router = Router();

/**
 * POST /api/transcribe?lang=en
 * Body: raw audio bytes (Content-Type: audio/webm | audio/ogg | audio/mp4 | audio/wav)
 * Returns: { transcript: string }
 *
 * Uses whisper-1 with magic-byte format detection. No ffmpeg required — whisper
 * natively handles webm/ogg/mp4/mp3/wav. Format is detected from buffer magic bytes
 * rather than Content-Type so the correct filename extension is always sent to OpenAI.
 */
router.post(
  "/transcribe",
  express.raw({ type: ["audio/*", "application/octet-stream"], limit: "25mb" }),
  async (req, res) => {
    const audioBuffer: Buffer = req.body as Buffer;

    if (!Buffer.isBuffer(audioBuffer) || audioBuffer.length < 100) {
      return res.status(400).json({ error: "No audio data received." });
    }

    const lang = (req.query.lang as string | undefined) || "en";
    console.log(`[transcribe] received ${audioBuffer.length} bytes, lang: ${lang}`);

    try {
      // Detect real format from buffer magic bytes (more reliable than Content-Type)
      const detected = detectAudioFormat(audioBuffer);
      // Map to supported file extensions; ogg is accepted as webm by Whisper
      const ext = detected === "unknown" ? "webm"
                : detected === "ogg"     ? "ogg"
                :                          detected;
      console.log(`[transcribe] detected format: ${detected} → file ext: .${ext}`);

      // Wrap in a File object so OpenAI SDK sends proper multipart/form-data
      const file = await toFile(audioBuffer, `audio.${ext}`);

      // whisper-1 is the most permissive and battle-tested model for audio formats
      const response = await openai.audio.transcriptions.create({
        file,
        model: "whisper-1",
        language: lang.startsWith("es") ? "es" : "en",
      });

      const cleaned = response.text?.trim() ?? "";
      console.log(`[transcribe] result: "${cleaned}"`);
      return res.json({ transcript: cleaned });
    } catch (err) {
      console.error("[transcribe] error:", err);
      return res.status(500).json({ error: "Transcription failed." });
    }
  },
);

export default router;
