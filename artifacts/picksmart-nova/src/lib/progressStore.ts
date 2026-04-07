import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SCORING } from '@/data/scoringRules';

export interface LessonProgress {
  moduleId: string;
  started: boolean;
  completed: boolean;
  testScore: number | null;
  totalQuestions: number | null;
  passed: boolean;
  completedAt: string | null;
}

export interface MistakeProgress {
  mistakeId: string;
  started: boolean;
  completed: boolean;
  testScore: number | null;
  totalQuestions: number | null;
  passed: boolean;
  completedAt: string | null;
}

interface ProgressState {
  // Lesson progress
  progress: Record<string, LessonProgress>;
  startLesson: (moduleId: string) => void;
  completeLesson: (moduleId: string, score: number, total: number) => void;
  getProgress: (moduleId: string) => LessonProgress | null;

  // Mistake coaching progress
  mistakeProgress: Record<string, MistakeProgress>;
  startMistakeCoaching: (mistakeId: string) => void;
  completeMistakeCoaching: (mistakeId: string, score: number, total: number) => void;

  // Simulation
  simulationCompleted: boolean;
  lastSimulationScore: number;
  completeSimulation: (score: number) => void;

  // Derived scoring
  getTotalPoints: () => number;
  getLessonsCompleted: () => number;
  getMistakesCompleted: () => number;
  getAvgLessonScore: () => number;
  getAvgMistakeScore: () => number;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      progress: {},
      mistakeProgress: {},
      simulationCompleted: false,
      lastSimulationScore: 0,

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

      startMistakeCoaching: (mistakeId) =>
        set(state => ({
          mistakeProgress: {
            ...state.mistakeProgress,
            [mistakeId]: {
              ...(state.mistakeProgress[mistakeId] ?? {
                mistakeId,
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

      completeMistakeCoaching: (mistakeId, score, total) =>
        set(state => ({
          mistakeProgress: {
            ...state.mistakeProgress,
            [mistakeId]: {
              mistakeId,
              started: true,
              completed: true,
              testScore: score,
              totalQuestions: total,
              passed: score / total >= 0.8,
              completedAt: new Date().toISOString(),
            },
          },
        })),

      completeSimulation: (score) =>
        set({ simulationCompleted: true, lastSimulationScore: score }),

      getTotalPoints: () => {
        const state = get();
        let pts = 0;

        for (const p of Object.values(state.progress)) {
          if (p.passed) {
            pts += SCORING.lessonPass;
            if (p.testScore !== null && p.totalQuestions !== null && p.testScore === p.totalQuestions) {
              pts += SCORING.lessonPerfectBonus;
            }
          }
        }

        for (const m of Object.values(state.mistakeProgress)) {
          if (m.passed) {
            pts += SCORING.mistakeCoachingPass;
            if (m.testScore !== null && m.totalQuestions !== null && m.testScore === m.totalQuestions) {
              pts += SCORING.mistakePerfectBonus;
            }
          }
        }

        if (state.simulationCompleted) {
          pts += SCORING.simulationComplete;
          if (state.lastSimulationScore >= 100) pts += SCORING.goldPerformanceBonus;
        }

        return pts;
      },

      getLessonsCompleted: () =>
        Object.values(get().progress).filter(p => p.passed).length,

      getMistakesCompleted: () =>
        Object.values(get().mistakeProgress).filter(m => m.passed).length,

      getAvgLessonScore: () => {
        const passed = Object.values(get().progress).filter(p => p.testScore !== null && p.totalQuestions !== null);
        if (passed.length === 0) return 0;
        const avg = passed.reduce((sum, p) => sum + (p.testScore! / p.totalQuestions!) * 100, 0) / passed.length;
        return Math.round(avg);
      },

      getAvgMistakeScore: () => {
        const passed = Object.values(get().mistakeProgress).filter(m => m.testScore !== null && m.totalQuestions !== null);
        if (passed.length === 0) return 0;
        const avg = passed.reduce((sum, m) => sum + (m.testScore! / m.totalQuestions!) * 100, 0) / passed.length;
        return Math.round(avg);
      },
    }),
    { name: 'picksmart-lesson-progress' }
  )
);
