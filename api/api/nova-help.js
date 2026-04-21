import OpenAI from "openai";

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  // OpenAI setup
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    // Safe body parsing (FIXED)
    const { message = "" } = req.body || {};

    if (!message) {
      return res.status(400).json({ error: "Message required" });
    }

    // AI call
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
You are NOVA Help Box.

You DO NOT just chat.
You analyze problems and return a system decision.

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

    // Return result
    return res.status(200).json({
      success: true,
      reply: completion.choices[0].message.content
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "NOVA Help Box failed" });
  }
}
