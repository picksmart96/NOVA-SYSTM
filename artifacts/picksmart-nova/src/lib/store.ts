import { create } from 'zustand';
import type { UserRole } from '@/data/users';
import type { VoiceMode } from '@/data/assignments';

interface AppState {
  role: UserRole;
  setRole: (role: UserRole) => void;
  userId: string;
  setUserId: (userId: string) => void;
}

interface NovaState {
  activeAssignmentId: string | null;
  setActiveAssignmentId: (id: string | null) => void;
  voiceMode: VoiceMode;
  setVoiceMode: (mode: VoiceMode) => void;
  isSessionActive: boolean;
  setSessionActive: (active: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  role: 'trainer',
  setRole: (role) => set({ role }),
  userId: 'user-1',
  setUserId: (userId) => set({ userId }),
}));

export const useNovaStore = create<NovaState>((set) => ({
  activeAssignmentId: null,
  setActiveAssignmentId: (id) => set({ activeAssignmentId: id }),
  voiceMode: 'training',
  setVoiceMode: (mode) => set({ voiceMode: mode }),
  isSessionActive: false,
  setSessionActive: (active) => set({ isSessionActive: active }),
}));
