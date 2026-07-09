import { create } from 'zustand';

export interface SessionProfile {
  name: string;
  email: string;
  org: string;
  avatarUrl?: string;
}

interface SessionState {
  mode: 'guest' | 'authenticated';
  userId: string | null;
  createdAt: Date | null;
  syncStatus: 'synced' | 'syncing' | 'offline' | 'error' | null;
  profile: SessionProfile | null;
  initGuestSession: (userId: string) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  mode: 'guest',
  userId: null,
  createdAt: null,
  syncStatus: null,
  profile: null,
  initGuestSession: (userId: string) => {
    set({ mode: 'guest', userId, createdAt: new Date() });
  },
}));
