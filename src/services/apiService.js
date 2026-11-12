const AI_BASE = (import.meta.env.VITE_AI_API_BASE || '').replace(/\/$/, '');
const AI_ENDPOINT = `${AI_BASE}/api/ai/chat`;
const HEALTH_ENDPOINT = `${AI_BASE}/api/ai/health`;

const fetchWithTimeout = async (url, options = {}, timeout = 55000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};

export const getAiHealth = async () => {
  try {
    const res = await fetchWithTimeout(HEALTH_ENDPOINT, { method: 'GET' }, 4000);
    if (!res.ok) throw new Error('Health check failed');
    return await res.json();
  } catch {
    return { configured: false, engine: 'local', reachable: false, model: null, provider: null };
  }
};

let healthCache = null;
let healthCacheAt = 0;

const canUseAi = async () => {
  if (!healthCache || Date.now() - healthCacheAt > 60_000) {
    healthCache = await getAiHealth();
    healthCacheAt = Date.now();
  }
  return healthCache?.configured === true && healthCache?.reachable !== false;
};

export const requestAi = async ({ history, context, sessionId }) => {
  if (!(await canUseAi())) {
    const error = new Error('AI is not configured on the server.');
    error.code = 'NOT_CONFIGURED';
    throw error;
  }

  const res = await fetchWithTimeout(AI_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: history.map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
      context,
      today: new Date().toISOString().slice(0, 10),
      sessionId,
    }),
  });

  let payload = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok) {
    const error = new Error(payload?.error || `AI request failed (${res.status})`);
    error.code = payload?.code || 'REQUEST_FAILED';
    error.status = res.status;
    error.hint = payload?.hint;
    throw error;
  }

  return {
    reply: payload?.reply || '',
    actions: Array.isArray(payload?.actions) ? payload.actions : [],
    requiresConfirmation: Boolean(payload?.requiresConfirmation),
    engine: payload?.engine || 'opencode',
  };
};

export const exportWorkspace = async () => {
  const { useProjectStore } = await import('../stores/projectStore');
  const { useTaskStore } = await import('../stores/taskStore');
  const { useTeamStore } = await import('../stores/teamStore');
  const { useActivityStore } = await import('../stores/activityStore');
  const { useNotificationStore } = await import('../stores/notificationStore');
  const { useFileStore } = await import('../stores/fileStore');
  const { useStatusLinkStore } = await import('../stores/statusLinkStore');
  const { useProjectCategoryStore } = await import('../stores/projectCategoryStore');
  const { useRequirementStore } = await import('../stores/requirementStore');
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    projects: useProjectStore.getState().projects,
    tasks: useTaskStore.getState().tasks,
    members: useTeamStore.getState().members,
    activity: useActivityStore.getState().entries,
    notifications: useNotificationStore.getState().notifications,
    projectFiles: useFileStore.getState().files,
    statusLinks: useStatusLinkStore.getState().links,
    projectCategories: useProjectCategoryStore.getState().config,
    requirements: useRequirementStore.getState().requirements,
  };
};

export const importWorkspace = async (payload) => {
  if (!payload || typeof payload !== 'object') throw new Error('Invalid file');
  if (!Array.isArray(payload.projects) || !Array.isArray(payload.tasks) || !Array.isArray(payload.members)) {
    throw new Error('File is missing projects, tasks or members');
  }
  const { useProjectStore } = await import('../stores/projectStore');
  const { useTaskStore } = await import('../stores/taskStore');
  const { useTeamStore } = await import('../stores/teamStore');
  const { useActivityStore } = await import('../stores/activityStore');
  const { useNotificationStore } = await import('../stores/notificationStore');
  const { useFileStore } = await import('../stores/fileStore');
  const { useStatusLinkStore } = await import('../stores/statusLinkStore');
  const { useProjectCategoryStore } = await import('../stores/projectCategoryStore');
  const { useRequirementStore } = await import('../stores/requirementStore');

  useProjectStore.getState().reset(payload.projects);
  useTaskStore.getState().reset(payload.tasks);
  useTeamStore.getState().reset(payload.members);
  if (Array.isArray(payload.activity)) useActivityStore.setState({ entries: payload.activity });
  if (Array.isArray(payload.notifications))
    useNotificationStore.setState({ notifications: payload.notifications });
  useFileStore.getState().reset(Array.isArray(payload.projectFiles) ? payload.projectFiles : []);
  useStatusLinkStore.getState().reset(payload.statusLinks);
  useProjectCategoryStore.getState().reset(payload.projectCategories);
  useRequirementStore.getState().reset(Array.isArray(payload.requirements) ? payload.requirements : []);
};
