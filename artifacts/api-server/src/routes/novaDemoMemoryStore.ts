interface TurnEntry {
  role: "user" | "assistant";
  content: string;
}

interface DemoSession {
  turns: TurnEntry[];
  summary: string;
}

const sessions = new Map<string, DemoSession>();

export function getDemoSession(sessionId: string): DemoSession {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, { turns: [], summary: "" });
  }
  return sessions.get(sessionId)!;
}

export function addDemoTurn(sessionId: string, role: "user" | "assistant", content: string) {
  const session = getDemoSession(sessionId);
  session.turns.push({ role, content });

  // Keep only last 12 turns and build a rolling summary string
  if (session.turns.length > 12) {
    session.turns = session.turns.slice(-12);
  }

  session.summary = session.turns
    .slice(-6)
    .map((t) => `${t.role === "user" ? "User" : "NOVA"}: ${t.content}`)
    .join("\n");
}

export function clearDemoSession(sessionId: string) {
  sessions.set(sessionId, { turns: [], summary: "" });
}
