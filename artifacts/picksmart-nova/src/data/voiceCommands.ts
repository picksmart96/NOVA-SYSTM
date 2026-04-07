export interface VoiceCommand {
  command: string;
  aliases: string[];
  description: string;
  category: string;
  modes: string[];
}

export const VOICE_COMMANDS: VoiceCommand[] = [
  {
    command: "ready",
    aliases: ["go", "confirm"],
    description: "Confirm you are ready to proceed to the next step or have completed the current one.",
    category: "Navigation",
    modes: ["training", "production", "ultra_fast"],
  },
  {
    command: "repeat",
    aliases: ["say again", "again"],
    description: "NOVA repeats the last spoken instruction.",
    category: "Navigation",
    modes: ["training", "production", "ultra_fast"],
  },
  {
    command: "short",
    aliases: ["shortage", "short pick"],
    description: "Flag the current location as a short pick (quantity unavailable).",
    category: "Picking",
    modes: ["training", "production", "ultra_fast"],
  },
  {
    command: "slow",
    aliases: ["slow down"],
    description: "Ask NOVA to speak more slowly for the current session.",
    category: "Settings",
    modes: ["training", "production"],
  },
  {
    command: "pause",
    aliases: ["hold", "wait"],
    description: "Pause the session timer and NOVA voice output.",
    category: "Navigation",
    modes: ["training", "production"],
  },
  {
    command: "resume",
    aliases: ["continue", "start"],
    description: "Resume the paused session.",
    category: "Navigation",
    modes: ["training", "production"],
  },
  {
    command: "help",
    aliases: ["nova help", "hey nova"],
    description: "Open the NOVA help panel with guidance and tips.",
    category: "Support",
    modes: ["training", "production", "ultra_fast"],
  },
  {
    command: "emergency stop",
    aliases: ["stop", "emergency"],
    description: "Immediately stop all NOVA voice output and pause the session. Alert supervisor.",
    category: "Safety",
    modes: ["training", "production", "ultra_fast"],
  },
  {
    command: "back",
    aliases: ["go back", "previous"],
    description: "Return to the previous stop (trainer mode only).",
    category: "Navigation",
    modes: ["training"],
  },
  {
    command: "skip",
    aliases: ["next", "skip stop"],
    description: "Skip the current stop (trainer mode only, requires supervisor override in production).",
    category: "Navigation",
    modes: ["training"],
  },
];
