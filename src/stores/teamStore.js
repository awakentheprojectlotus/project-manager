import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { seedData } from './activityStore';
import { useActivityStore } from './activityStore';
import { useTaskStore } from './taskStore';
import { uid } from '../utils/helpers';
import { todayISO } from '../utils/date';

export const useTeamStore = create(
  persist(
    (set, get) => ({
      members: seedData.members,

      addMember: (data) => {
        const existing = get().members;
        const member = {
          id: uid('tm'),
          name: (data.name || 'New Member').trim(),
          email: data.email?.trim() || '',
          role: data.role?.trim() || 'Contributor',
          avatarColor: existing.length % 7,
          status: 'active',
          capacity: Number(data.capacity) || 40,
          joinedAt: todayISO(),
        };
        set({ members: [...existing, member] });
        useActivityStore.getState().log({
          type: 'member',
          message: `Team member '${member.name}' was added`,
          projectId: null,
        });
        return member;
      },

      updateMember: (id, changes) => {
        let updated = null;
        set((state) => ({
          members: state.members.map((m) => {
            if (m.id !== id) return m;
            updated = { ...m, ...changes };
            return updated;
          }),
        }));
        return updated;
      },

      removeMember: (id) => {
        const member = get().members.find((m) => m.id === id);
        if (!member) return;
        set({ members: get().members.filter((m) => m.id !== id) });
        useTaskStore.getState().unassignMember(id);
        useActivityStore.getState().log({
          type: 'member',
          message: `Team member '${member.name}' was removed`,
          projectId: null,
        });
      },

      reset: (members) => set({ members }),
    }),
    {
      name: 'pulse-team',
      version: 2,
      migrate: (persisted, version) =>
        version < 2 ? { members: seedData.members } : persisted,
    }
  )
);
