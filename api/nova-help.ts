import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const { message, userRole = "selector", userId = "unknown" } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message required" });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
You are NOVA Help Box.

Return ONLY JSON:
{
  "action": "fix_assignment | reset_session | update_slot | none",
  "reason": "short explanation",
  "data": {}
}
`
        },
        {
          role: "user",
          content: message
        }
      ]
    });

    const aiText = completion.choices[0].message.content;

    let parsed;
    try {
      parsed = JSON.parse(aiText || "{}");
    } catch {
      parsed = { action: "none", reason: "Invalid JSON", data: {} };
    }

    res.status(200).json({
      success: true,
      decision: parsed
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed" });
  }
}
