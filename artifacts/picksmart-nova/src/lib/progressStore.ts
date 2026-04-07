import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface LessonProgress {
  moduleId: string;
  started: boolean;
  completed: boolean;
  testScore: number | null;
  totalQuestions: number | null;
  passed: boolean;
  completedAt: string | null;
}

interface ProgressState {
  progress: Record<string, LessonProgress>;
  startLesson: (moduleId: string) => void;
  completeLesson: (moduleId: string, score: number, total: number) => void;
  getProgress: (moduleId: string) => LessonProgress | null;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      progress: {},
      startLesson: (moduleId) =>
        set(state => ({
          progress: {
            ...state.progress,
            [moduleId]: {
              ...(state.progress[moduleId] ?? {
                moduleId,
                started: false,
                completed: false,
                testScore: null,
                totalQuestions: null,
                passed: false,
                completedAt: null,
              }),
              started: true,
            },
          },
        })),
      completeLesson: (moduleId, score, total) =>
        set(state => ({
          progress: {
            ...state.progress,
            [moduleId]: {
              moduleId,
              started: true,
              completed: true,
              testScore: score,
              totalQuestions: total,
              passed: score / total >= 0.8,
              completedAt: new Date().toISOString(),
            },
          },
        })),
      getProgress: (moduleId) => get().progress[moduleId] ?? null,
    }),
    { name: 'picksmart-lesson-progress' }
  )
);
