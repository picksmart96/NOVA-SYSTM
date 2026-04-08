/**
 * NovaVoiceStatus
 * Visual badge showing NOVA's current voice state.
 * Works with both useVoiceEngine (NOVA Trainer) and the
 * MediaRecorder/Whisper flow (NOVA Help).
 */

export type VoiceStateKey =
  | "idle"
  | "wake_listening"
  | "active_listening"
  | "thinking"
  | "speaking"
  | "stopped"
  | "error"
  | "recording"
  | "transcribing";

interface NovaVoiceStatusProps {
  state: VoiceStateKey;
  /** Optional text override — if not provided, uses built-in label */
  label?: string;
  /** Show a pulsing dot next to the badge */
  pulse?: boolean;
  className?: string;
}

const STATE_STYLES: Record<VoiceStateKey, { bg: string; text: string; dot: string; defaultLabel: string }> = {
  idle:            { bg: "bg-slate-700/40",   text: "text-slate-400",   dot: "bg-slate-500",  defaultLabel: "Idle" },
  wake_listening:  { bg: "bg-indigo-500/20",  text: "text-indigo-300",  dot: "bg-indigo-400", defaultLabel: "Waiting for Hey NOVA" },
  active_listening:{ bg: "bg-green-500/20",   text: "text-green-300",   dot: "bg-green-400",  defaultLabel: "Listening" },
  recording:       { bg: "bg-red-500/20",     text: "text-red-300",     dot: "bg-red-500",    defaultLabel: "Recording…" },
  transcribing:    { bg: "bg-blue-500/20",    text: "text-blue-300",    dot: "bg-blue-400",   defaultLabel: "Transcribing…" },
  thinking:        { bg: "bg-yellow-500/20",  text: "text-yellow-300",  dot: "bg-yellow-400", defaultLabel: "Thinking…" },
  speaking:        { bg: "bg-violet-500/20",  text: "text-violet-300",  dot: "bg-violet-400", defaultLabel: "NOVA Speaking" },
  stopped:         { bg: "bg-slate-700/40",   text: "text-slate-400",   dot: "bg-slate-500",  defaultLabel: "Stopped" },
  error:           { bg: "bg-red-700/30",     text: "text-red-300",     dot: "bg-red-500",    defaultLabel: "Error" },
};

export function NovaVoiceStatus({ state, label, pulse, className = "" }: NovaVoiceStatusProps) {
  const style = STATE_STYLES[state] ?? STATE_STYLES.idle;
  const displayLabel = label ?? style.defaultLabel;

  const shouldPulse =
    pulse ??
    (state === "wake_listening" ||
      state === "active_listening" ||
      state === "recording" ||
      state === "speaking");

  return (
    <span
      className={[
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold",
        style.bg,
        style.text,
        className,
      ].join(" ")}
    >
      <span
        className={[
          "w-1.5 h-1.5 rounded-full flex-shrink-0",
          style.dot,
          shouldPulse ? "animate-pulse" : "",
        ].join(" ")}
      />
      {displayLabel}
    </span>
  );
}

export default NovaVoiceStatus;
