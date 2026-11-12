import { create } from 'zustand';

export const useSyncStore = create((set) => ({
  status: 'idle',
  lastSyncedAt: null,
  error: null,

  setStatus: (status) => set({ status }),
  markSynced: () => set({ status: 'synced', lastSyncedAt: new Date().toISOString(), error: null }),
  fail: (error) =>
    set({
      status: 'error',
      error: typeof error === 'string' ? error : error?.message || 'Could not sync your workspace.',
    }),
  reset: () => set({ status: 'idle', lastSyncedAt: null, error: null }),
}));
