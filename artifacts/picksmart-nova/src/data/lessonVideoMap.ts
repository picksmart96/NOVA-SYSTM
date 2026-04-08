/**
 * Maps each training module to a lesson video.
 * Set `youtubeId` to a real YouTube video ID (11 characters) to embed the video.
 * Leave `youtubeId` empty to show the YouTube search fallback link.
 *
 * How to get a YouTube video ID:
 *   1. Open a YouTube video
 *   2. Copy the part after "watch?v=" in the URL
 *   Example: https://www.youtube.com/watch?v=dQw4w9WgXcQ → ID is dQw4w9WgXcQ
 */
export interface LessonVideo {
  youtubeId: string;
  searchQuery: string;
  title: string;
}

export const LESSON_VIDEO_MAP: Record<string, LessonVideo> = {
  "mod-1": {
    youtubeId: "",
    searchQuery: "warehouse order picking training beginner how it works",
    title: "Warehouse Order Picking — Beginner Training",
  },
  "mod-2": {
    youtubeId: "",
    searchQuery: "warehouse safety training lifting ergonomics injury prevention",
    title: "Warehouse Safety & Injury Prevention",
  },
  "mod-3": {
    youtubeId: "",
    searchQuery: "pallet building stacking warehouse tutorial how to",
    title: "Pallet Building — The Tetris Method",
  },
  "mod-4": {
    youtubeId: "",
    searchQuery: "warehouse order picking efficiency speed pick path optimization",
    title: "Pick Path Optimization & Speed",
  },
  "mod-5": {
    youtubeId: "",
    searchQuery: "warehouse performance rate tracking metrics selector",
    title: "Warehouse Performance & Rate Tracking",
  },
  "mod-6": {
    youtubeId: "",
    searchQuery: "voice picking warehouse headset training simulation",
    title: "Real Shift Simulation — Voice Picking",
  },
};

export function getLessonVideo(moduleId: string): LessonVideo | null {
  if (LESSON_VIDEO_MAP[moduleId]) return LESSON_VIDEO_MAP[moduleId];
  // Normalize padded IDs: mod-001 → mod-1
  const normalized = moduleId.replace(/^mod-0*(\d+)$/, "mod-$1");
  return LESSON_VIDEO_MAP[normalized] ?? null;
}

export function getYoutubeEmbedUrl(youtubeId: string): string {
  return `https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1&autoplay=0`;
}

export function getYoutubeSearchUrl(query: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}
