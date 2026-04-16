import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface DailyLog {
  date: string;         // "YYYY-MM-DD"
  pickRate: number;     // efficiency % (e.g. 98)
  hours: number;        // hours worked (e.g. 8.5)
  cases?: number;       // total cases picked
  uph?: number;         // units per hour
  note?: string;
}

export interface WeeklyGoal {
  targetRate: number;   // pick rate % goal
  weekStart: string;    // "YYYY-MM-DD" Monday of the week
}

interface PerformanceState {
  logs: DailyLog[];
  weeklyGoal: WeeklyGoal | null;

  // Per-user keyed by username
  userLogs: Record<string, DailyLog[]>;
  userGoals: Record<string, WeeklyGoal | null>;

  logToday: (username: string, pickRate: number, hours: number, note?: string, cases?: number, uph?: number) => void;
  setGoal: (username: string, targetRate: number) => void;
  getRecentLogs: (username: string, days?: number) => DailyLog[];
  getYesterdayLog: (username: string) => DailyLog | null;
  getTodayLog: (username: string) => DailyLog | null;
  getGoal: (username: string) => WeeklyGoal | null;
  getWeekAvg: (username: string) => number | null;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function mondayOfWeek(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

export const usePerformanceStore = create<PerformanceState>()(
  persist(
    (set, get) => ({
      logs: [],
      weeklyGoal: null,
      userLogs: {},
      userGoals: {},

      logToday(username, pickRate, hours, note, cases, uph) {
        const date = todayStr();
        set((s) => {
          const existing = s.userLogs[username] ?? [];
          const filtered = existing.filter((l) => l.date !== date);
          return {
            userLogs: {
              ...s.userLogs,
              [username]: [...filtered, { date, pickRate, hours, note, cases, uph }].sort(
                (a, b) => a.date.localeCompare(b.date)
              ),
            },
          };
        });
      },

      setGoal(username, targetRate) {
        const weekStart = mondayOfWeek(todayStr());
        set((s) => ({
          userGoals: {
            ...s.userGoals,
            [username]: { targetRate, weekStart },
          },
        }));
      },

      getRecentLogs(username, days = 7) {
        const logs = get().userLogs[username] ?? [];
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        const cutoffStr = cutoff.toISOString().slice(0, 10);
        return logs.filter((l) => l.date >= cutoffStr).sort(
          (a, b) => b.date.localeCompare(a.date)
        );
      },

      getYesterdayLog(username) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yd = yesterday.toISOString().slice(0, 10);
        return get().userLogs[username]?.find((l) => l.date === yd) ?? null;
      },

      getTodayLog(username) {
        const today = todayStr();
        return get().userLogs[username]?.find((l) => l.date === today) ?? null;
      },

      getGoal(username) {
        return get().userGoals[username] ?? null;
      },

      getWeekAvg(username) {
        const logs = get().getRecentLogs(username, 7);
        if (!logs.length) return null;
        return Math.round(logs.reduce((s, l) => s + l.pickRate, 0) / logs.length);
      },
    }),
    { name: "picksmart-performance" }
  )
);
