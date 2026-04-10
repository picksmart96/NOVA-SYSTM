import { WebSocketServer, WebSocket } from "ws";
import type { IncomingMessage, Server } from "node:http";
import { createNovaTrainerSession, type NovaTrainerSession, type Lang } from "./novaTrainerStateMachine.js";
import { ASSIGNMENTS, ASSIGNMENT_STOPS } from "./assignmentData.js";
import { logger } from "./logger.js";

const sessions = new Map<string, NovaTrainerSession>();

export function attachNovaRealtimeServer(httpServer: Server) {
  const wss = new WebSocketServer({
    server: httpServer,
    path: "/api/ws/nova-trainer",
  });

  wss.on("connection", (ws: WebSocket, _req: IncomingMessage) => {
    let sessionId: string | null = null;

    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(String(raw)) as { type: string; selector?: { userId: string; novaId: string; fullName?: string }; lang?: Lang; text?: string };

        // Keepalive ping — silently ignore, no response needed
        if (msg.type === "ping") return;

        if (msg.type === "init") {
          const { selector } = msg;
          if (!selector?.userId || !selector?.novaId) {
            ws.send(JSON.stringify({ type: "error", error: "Invalid selector." }));
            return;
          }

          sessionId = `${selector.userId}:${selector.novaId}`;

          const lang: Lang = msg.lang === "es" ? "es" : "en";
          const session = createNovaTrainerSession({
            selector: {
              userId: selector.userId,
              novaId: selector.novaId,
              fullName: selector.fullName ?? "",
            },
            assignments: ASSIGNMENTS,
            assignmentStops: ASSIGNMENT_STOPS,
            lang,
          });

          sessions.set(sessionId, session);
          logger.info({ sessionId }, "NOVA trainer session initialized");

          ws.send(JSON.stringify({ type: "state", state: session.snapshot() }));
          return;
        }

        if (!sessionId || !sessions.has(sessionId)) {
          ws.send(JSON.stringify({ type: "error", error: "Session not initialized." }));
          return;
        }

        const session = sessions.get(sessionId)!;

        if (msg.type === "input") {
          const state = session.handleWorkflowInput(msg.text ?? "");
          ws.send(JSON.stringify({ type: "state", state }));
          return;
        }

        if (msg.type === "get_state") {
          ws.send(JSON.stringify({ type: "state", state: session.snapshot() }));
          return;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        ws.send(JSON.stringify({ type: "error", error: msg }));
      }
    });

    ws.on("error", (err) => {
      logger.error({ err }, "NOVA trainer WebSocket error");
    });

    ws.on("close", () => {
      logger.info({ sessionId }, "NOVA trainer WebSocket closed");
    });
  });

  logger.info("NOVA realtime WebSocket server attached at /api/ws/nova-trainer");
  return wss;
}
