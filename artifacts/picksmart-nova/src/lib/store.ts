import { create } from 'zustand';

type Role = 'owner' | 'supervisor' | 'trainer' | 'selector';

interface AppState {
  role: Role;
  setRole: (role: Role) => void;
  userId: string;
  setUserId: (userId: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  role: 'selector',
  setRole: (role) => set({ role }),
  userId: 'user-1',
  setUserId: (userId) => set({ userId }),
}));