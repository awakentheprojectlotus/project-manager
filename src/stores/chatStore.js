import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useProjectStore } from './projectStore';
import { useTaskStore } from './taskStore';
import { useTeamStore } from './teamStore';
import { useUiStore } from './uiStore';
import { requestGemini } from '../services/apiService';
import { buildWorkspaceContext } from '../services/workspaceContext';
import { interpretLocally, getLocalWelcome } from '../services/aiEngine';
import {
  validateActions,
  executeActions,
  actionRequiresConfirmation,
  describeActions,
} from '../services/aiActions';
import { uid } from '../utils/helpers';

const welcomeMessage = () => ({
  id: uid('msg'),
  role: 'assistant',
  content: getLocalWelcome(),
  createdAt: new Date().toISOString(),
  engine: 'local',
  pendingActions: [],
  executedActions: [],
  notice: null,
});

const snapshot = () => ({
  projects: useProjectStore.getState().projects,
  tasks: useTaskStore.getState().tasks,
  members: useTeamStore.getState().members,
});

export const useChatStore = create(
  persist(
    (set, get) => ({
      messages: [welcomeMessage()],
      isThinking: false,
      lastEngine: null,
      lastNotice: null,

      sendMessage: async (rawText) => {
        const text = (rawText || '').trim();
        if (!text || get().isThinking) return;

        const userMessage = {
          id: uid('msg'),
          role: 'user',
          content: text,
          createdAt: new Date().toISOString(),
        };

        const history = [...get().messages, userMessage]
          .filter((m) => m.role === 'user' || m.role === 'assistant')
          .map((m) => ({ role: m.role, content: m.content }));

        set((state) => ({
          messages: [...state.messages, userMessage],
          isThinking: true,
          lastNotice: null,
        }));

        let outcome = null;
        let notice = null;

        try {
          const context = buildWorkspaceContext();
          outcome = await requestGemini({ history, context });
        } catch (err) {
          outcome = interpretLocally(text);
          outcome.engine = 'local';
          notice =
            err?.code === 'NOT_CONFIGURED'
              ? 'Gemini is not configured on the server — answered with the built-in local engine.'
              : err?.code === 'LOCATION_NOT_SUPPORTED'
                ? 'Gemini is unavailable from this server’s location (Google restricts the API by region). The local engine answered. Use a system-wide VPN/proxy in a supported country or host the API proxy there.'
                : err?.code === 'MODEL_UNAVAILABLE'
                  ? `${err.message} The local engine answered instead.`
                  : `Gemini is unavailable (${err?.message || 'network error'}) — answered with the local engine.`;
        }

        const current = snapshot();
        const { actions: validActions, errors } = validateActions(
          outcome.actions || [],
          current
        );
        const needsConfirmation =
          Boolean(outcome.requiresConfirmation) || actionRequiresConfirmation(validActions);

        const assistantMessage = {
          id: uid('msg'),
          role: 'assistant',
          content: outcome.reply || 'Done.',
          createdAt: new Date().toISOString(),
          engine: outcome.engine || 'local',
          pendingActions: needsConfirmation ? validActions : [],
          executedActions: [],
          requiresConfirmation: needsConfirmation,
          validationErrors: errors,
          notice,
        };

        if (!needsConfirmation && validActions.length) {
          const before = current;
          const execution = executeActions(validActions);
          assistantMessage.executedActions = describeActions(validActions, before);
          if (execution.failed) {
            assistantMessage.notice = `${execution.failed} action(s) failed.`;
          }
          assistantMessage.content = `${assistantMessage.content}`;
        }

        set((state) => ({
          messages: [...state.messages, assistantMessage],
          isThinking: false,
          lastEngine: assistantMessage.engine,
          lastNotice: notice,
        }));
      },

      confirmPending: (messageId) => {
        const message = get().messages.find((m) => m.id === messageId);
        if (!message?.pendingActions?.length) return;
        const current = snapshot();
        const { actions: valid, errors } = validateActions(message.pendingActions, current);
        if (!valid.length) {
          set((state) => ({
            messages: state.messages.map((m) =>
              m.id === messageId
                ? {
                    ...m,
                    pendingActions: [],
                    notice: `Could not apply: ${errors.join('; ') || 'invalid action'}`,
                  }
                : m
            ),
          }));
          return;
        }

        const execution = executeActions(valid);
        const summary = describeActions(valid, current);

        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === messageId
              ? {
                  ...m,
                  pendingActions: [],
                  requiresConfirmation: false,
                  executedActions: summary,
                  content: `${m.content}\n\nApplied ${execution.applied} of ${summary.length} change${
                    summary.length === 1 ? '' : 's'
                  }.`,
                  notice: execution.failed ? `${execution.failed} action(s) failed.` : m.notice,
                }
              : m
          ),
        }));
        useUiStore.getState().pushToast({
          type: execution.failed ? 'error' : 'success',
          title: execution.failed ? 'Some changes failed' : 'Changes applied',
          message: `${execution.applied} update${execution.applied === 1 ? '' : 's'} saved to your workspace.`,
        });
      },

      cancelPending: (messageId) => {
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === messageId
              ? {
                  ...m,
                  pendingActions: [],
                  requiresConfirmation: false,
                  content: `${m.content}\n\nCancelled — no changes were made.`,
                }
              : m
          ),
        }));
      },

      clearConversation: () => {
        set({
          messages: [welcomeMessage()],
          isThinking: false,
          lastEngine: null,
          lastNotice: null,
        });
      },
    }),
    {
      name: 'pulse-chat',
      version: 2,
      migrate: (persisted, version) =>
        version < 2
          ? { messages: [welcomeMessage()], lastEngine: null, lastNotice: null }
          : persisted,
      partialize: (state) => ({
        messages: state.messages,
        lastEngine: state.lastEngine,
        lastNotice: state.lastNotice,
      }),
    }
  )
);
