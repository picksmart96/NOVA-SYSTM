import express from "express";
import OpenAI from "openai";

const app = express();
app.use(express.json());

// 🔑 OpenAI setup
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 🧪 Test route
app.get("/", (req, res) => {
  res.send("NOVA API is running 🚀");
});

// 🧠 NOVA HELP BOX (AI SYSTEM CONTROLLER)
app.post("/api/nova-help", async (req, res) => {
  try {
    const { message, userRole = "selector", userId = "unknown" } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // 🧠 AI DECISION ENGINE
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
You are NOVA Help Box (AI system controller).

You DO NOT just chat.
You ANALYZE problems and decide actions.

Return ONLY JSON like this:
{
  "action": "fix_assignment | reset_session | update_slot | none",
  "reason": "short explanation",
  "data": { }
}

Rules:
- If it's a simple question → action = "none"
- If system issue → choose correct action
- Never guess missing data
- Respect roles:
  - selector: read only
  - trainer: limited fixes
  - owner: full control
`
        },
        {
          role: "user",
          content: message
        }
      ]
    });

    const aiResponse = completion.choices[0].message.content;

    let parsed;
    try {
      parsed = JSON.parse(aiResponse || "{}");
    } catch {
      parsed = {
        action: "none",
        reason: "AI response not valid JSON",
        data: {}
      };
    }

    // ⚙️ ACTION HANDLER
    let result: any = null;

    switch (parsed.action) {

      case "fix_assignment":
        if (userRole !== "owner" && userRole !== "trainer") {
          return res.json({ reply: "Permission denied." });
        }

        // 🔧 TODO: connect real DB here
        result = { status: "assignment fixed" };
        break;

      case "reset_session":
        if (userRole !== "owner") {
          return res.json({ reply: "Only owner can reset sessions." });
        }

        result = { status: "session reset" };
        break;

      case "update_slot":
        if (userRole !== "owner") {
          return res.json({ reply: "Only owner can update slots." });
        }

        result = { status: "slot updated" };
        break;

      default:
        result = { status: "no action needed" };
    }

    // 🧾 LOG SYSTEM
    console.log("🔥 NOVA ACTION:", {
      userId,
      role: userRole,
      message,
      decision: parsed,
      result
    });

    // ✅ FINAL RESPONSE
    res.json({
      success: true,
      decision: parsed,
      result
    });

  } catch (error) {
    console.error("❌ NOVA ERROR:", error);
    res.status(500).json({
      success: false,
      error: "NOVA Help Box failed"
    });
  }
});


// =========================
// 🚀 CHOOSE ONE BELOW
// =========================

// ✅ FOR VERCEL (most likely YOU)
export default app;


// ❌ DO NOT USE THIS ON VERCEL
// app.listen(3000, () => {
//   console.log("NOVA API running on port 3000 🚀");
// });
