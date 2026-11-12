import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { seedData } from './activityStore';
import { useActivityStore } from './activityStore';
import { useUiStore } from './uiStore';
import { uid } from '../utils/helpers';

const cleanFiles = (files) =>
  (Array.isArray(files) ? files : []).filter(
    (file) => file && typeof file.url === 'string' && !file.url.startsWith('data:')
  );

export const useFileStore = create(
  persist(
    (set, get) => ({
      files: cleanFiles(seedData.projectFiles),

      addFile: (data) => {
        const file = {
          id: uid('file'),
          projectId: data.projectId,
          name: (data.name || 'Untitled link').trim(),
          url: data.url,
          kind: data.kind || 'file',
          driveType: data.driveType || null,
          source: 'google-drive',
          thumbnailUrl: data.thumbnailUrl || null,
          previewUrl: data.previewUrl || null,
          addedBy: useUiStore.getState().currentUserId || null,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ files: [file, ...state.files] }));
        useActivityStore.getState().log({
          type: 'file',
          message: `Drive link '${file.name}' was attached`,
          actorId: file.addedBy,
          projectId: file.projectId,
        });
        return file;
      },

      removeFile: (id) => {
        const file = get().files.find((f) => f.id === id);
        if (!file) return;
        set((state) => ({ files: state.files.filter((f) => f.id !== id) }));
        useActivityStore.getState().log({
          type: 'file',
          message: `Drive link '${file.name}' was removed`,
          actorId: useUiStore.getState().currentUserId,
          projectId: file.projectId,
        });
      },

      deleteFilesByProject: (projectId) =>
        set((state) => ({ files: state.files.filter((f) => f.projectId !== projectId) })),

      reset: (files) => set({ files: cleanFiles(files) }),
    }),
    {
      name: 'pulse-files',
      version: 2,
      migrate: (persisted, version) =>
        version < 2 ? { files: cleanFiles(persisted?.files) } : persisted,
    }
  )
);
