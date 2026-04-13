import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface VideoOverride {
  moduleId: string;
  youtubeId: string;
  customTitle?: string;
}

interface LessonVideoState {
  overrides: Record<string, VideoOverride>;
  setOverride: (moduleId: string, youtubeId: string, customTitle?: string) => void;
  removeOverride: (moduleId: string) => void;
  getOverride: (moduleId: string) => VideoOverride | null;
}

export const useLessonVideoStore = create<LessonVideoState>()(
  persist(
    (set, get) => ({
      overrides: {},

      setOverride: (moduleId, youtubeId, customTitle) => {
        set((s) => ({
          overrides: {
            ...s.overrides,
            [moduleId]: { moduleId, youtubeId: youtubeId.trim(), customTitle },
          },
        }));
      },

      removeOverride: (moduleId) => {
        set((s) => {
          const next = { ...s.overrides };
          delete next[moduleId];
          return { overrides: next };
        });
      },

      getOverride: (moduleId) => {
        return get().overrides[moduleId] ?? null;
      },
    }),
    { name: "psa-lesson-videos" }
  )
);

export function extractYoutubeId(input: string): string | null {
  const raw = input.trim();
  const patterns = [
    /(?:youtube\.com\/watch\?.*v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) {
    const m = raw.match(p);
    if (m) return m[1];
  }
  return null;
}
