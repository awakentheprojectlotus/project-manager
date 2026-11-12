import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { useAuthStore } from '../stores/authStore';
import { useSyncStore } from '../stores/syncStore';
import { useProjectStore } from '../stores/projectStore';
import { useTaskStore } from '../stores/taskStore';
import { useTeamStore } from '../stores/teamStore';
import { useActivityStore } from '../stores/activityStore';
import { useNotificationStore } from '../stores/notificationStore';
import { useFileStore } from '../stores/fileStore';
import { useChatStore } from '../stores/chatStore';
import { useUiStore } from '../stores/uiStore';
import { createSeed } from '../data/seed';

const CONNECT_TIMEOUT = 15000;
const SAVE_DEBOUNCE = 650;
const WORKSPACE_ID = 'main';

let unsubscribeSnapshot = null;
let storeUnsubs = [];
let saveTimer = null;
let savePromise = Promise.resolve();
let connectTimer = null;
let hydrating = false;
let lastSerialized = null;
let started = false;

const workspaceRef = () => doc(db, 'workspaces', WORKSPACE_ID);

const syncErrorMessage = (error) => {
  const code = error?.code || '';
  if (code.includes('permission-denied')) {
    return 'Firestore permission denied. Deploy the updated firestore.rules so workspaces/main allows read and write.';
  }
  if (code.includes('unavailable') || code.includes('network')) {
    return 'Firestore is unreachable. Check your internet connection, VPN/proxy or firewall.';
  }
  if (code.includes('failed-precondition') || code.includes('not-found')) {
    return 'Firestore is not ready. Create a Firestore database for this Firebase project.';
  }
  if (code.includes('unauthenticated')) {
    return 'Firestore rejected the request. Authentication is disabled; check your firestore.rules.';
  }
  return error?.message || 'Could not sync with Firestore.';
};

const pickWorkspace = (source = {}) => ({
  projects: Array.isArray(source.projects) ? source.projects : [],
  tasks: Array.isArray(source.tasks) ? source.tasks : [],
  members: Array.isArray(source.members) ? source.members : [],
  activity: Array.isArray(source.activity) ? source.activity.slice(0, 120) : [],
  notifications: Array.isArray(source.notifications) ? source.notifications.slice(0, 60) : [],
  projectFiles: (Array.isArray(source.projectFiles) ? source.projectFiles : []).filter(
    (file) => file && typeof file.url === 'string' && !file.url.startsWith('data:')
  ),
  chatMessages: Array.isArray(source.chatMessages) ? source.chatMessages.slice(-120) : [],
});

const collect = () =>
  pickWorkspace({
    projects: useProjectStore.getState().projects,
    tasks: useTaskStore.getState().tasks,
    members: useTeamStore.getState().members,
    activity: useActivityStore.getState().entries,
    notifications: useNotificationStore.getState().notifications,
    projectFiles: useFileStore.getState().files,
    chatMessages: useChatStore.getState().messages,
  });

const applyWorkspace = (data) => {
  hydrating = true;
  try {
    const workspace = pickWorkspace(data);
    useProjectStore.setState({ projects: workspace.projects });
    useTaskStore.setState({ tasks: workspace.tasks });
    useTeamStore.setState({ members: workspace.members });
    useActivityStore.setState({ entries: workspace.activity });
    useNotificationStore.setState({ notifications: workspace.notifications });
    useFileStore.setState({ files: workspace.projectFiles });

    const members = useTeamStore.getState().members;
    const authEmail = useAuthStore.getState().user?.email?.toLowerCase();
    const preferred = authEmail
      ? members.find((m) => m.email && m.email.toLowerCase() === authEmail)
      : null;
    const localCurrent = useUiStore.getState().currentUserId;
    const targetUser =
      preferred?.id ||
      (members.some((m) => m.id === localCurrent) ? localCurrent : members[0]?.id || '');
    useUiStore.getState().setCurrentUser(targetUser);

    if (workspace.chatMessages.length) {
      useChatStore.setState({
        messages: workspace.chatMessages,
        isThinking: false,
        lastNotice: null,
      });
    }

    lastSerialized = JSON.stringify(workspace);
  } finally {
    hydrating = false;
  }
};

const saveNow = () => {
  if (!isFirebaseConfigured || !db || hydrating || !useAuthStore.getState().user) {
    return Promise.resolve();
  }
  const data = collect();
  const serialized = JSON.stringify(data);
  if (serialized === lastSerialized) return Promise.resolve();

  useSyncStore.getState().setStatus('syncing');
  savePromise = setDoc(workspaceRef(), {
    ...data,
    updatedAt: new Date().toISOString(),
  })
    .then(() => {
      lastSerialized = serialized;
      useSyncStore.getState().markSynced();
    })
    .catch((error) => {
      useSyncStore.getState().fail(syncErrorMessage(error));
    });
  return savePromise;
};


export const pushWorkspaceToFirestore = async () => {
  if (!isFirebaseConfigured || !db) {
    const message = 'Firebase is not configured. Add VITE_FIREBASE_* values to .env and restart the app.';
    useSyncStore.getState().fail(message);
    throw new Error(message);
  }
  if (!useAuthStore.getState().user) {
    const message = 'Sign in before saving the workspace to Firestore.';
    useSyncStore.getState().fail(message);
    throw new Error(message);
  }

  const data = collect();
  useSyncStore.getState().setStatus('syncing');
  try {
    await Promise.race([
      setDoc(workspaceRef(), {
        ...data,
        updatedAt: new Date().toISOString(),
      }),
      new Promise((_, reject) => {
        setTimeout(
          () =>
            reject(
              new Error(
                'Firestore did not respond within 20 seconds. Check your network and security rules.'
              )
            ),
          20000
        );
      }),
    ]);
    lastSerialized = JSON.stringify(data);
    useSyncStore.getState().markSynced();
    return true;
  } catch (error) {
    const message = syncErrorMessage(error);
    useSyncStore.getState().fail(message);
    throw new Error(message);
  }
};

export const flushWorkspaceSync = async () => {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  await saveNow();
  await savePromise;
};

const scheduleSave = () => {
  if (!unsubscribeSnapshot || hydrating) return;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    saveNow();
  }, SAVE_DEBOUNCE);
};

const subscribeToStores = () => {
  if (storeUnsubs.length) return;
  storeUnsubs = [
    useProjectStore.subscribe(scheduleSave),
    useTaskStore.subscribe(scheduleSave),
    useTeamStore.subscribe(scheduleSave),
    useActivityStore.subscribe(scheduleSave),
    useNotificationStore.subscribe(scheduleSave),
    useFileStore.subscribe(scheduleSave),
    useChatStore.subscribe(scheduleSave),
    useUiStore.subscribe(scheduleSave),
  ];
};

const unsubscribeFromStores = () => {
  storeUnsubs.forEach((unsubscribe) => unsubscribe());
  storeUnsubs = [];
};

const clearConnectTimer = () => {
  if (connectTimer) {
    clearTimeout(connectTimer);
    connectTimer = null;
  }
};

export const startWorkspaceSync = () => {
  if (!isFirebaseConfigured || !db || unsubscribeSnapshot) return;
  if (!useAuthStore.getState().user) return;

  useSyncStore.getState().setStatus('connecting');
  connectTimer = setTimeout(() => {
    if (useSyncStore.getState().status === 'connecting') {
      useSyncStore.getState().fail(
        'Could not connect to Firestore. Check your Firebase config, network and firestore.rules.'
      );
    }
  }, CONNECT_TIMEOUT);

  unsubscribeSnapshot = onSnapshot(
    workspaceRef(),
    async (snapshot) => {
      clearConnectTimer();
      if (snapshot.metadata?.hasPendingWrites) {
        useSyncStore.getState().markSynced();
        subscribeToStores();
        return;
      }

      if (!snapshot.exists()) {
        const local = collect();
        const hasLocalData = local.projects.length > 0 || local.members.length > 0;

        if (!hasLocalData) {
          const seed = createSeed();
          applyWorkspace({ ...seed, chatMessages: local.chatMessages });
        } else {
          lastSerialized = JSON.stringify(local);
        }

        subscribeToStores();
        useSyncStore.getState().setStatus('syncing');
        try {
          const initial = collect();
          await setDoc(workspaceRef(), {
            ...initial,
            updatedAt: new Date().toISOString(),
          });
          lastSerialized = JSON.stringify(initial);
          useSyncStore.getState().markSynced();
        } catch (error) {
          useSyncStore.getState().fail(syncErrorMessage(error));
        }
        return;
      }

      const remote = pickWorkspace(snapshot.data());
      if (JSON.stringify(remote) !== lastSerialized) {
        applyWorkspace(remote);
      }
      subscribeToStores();
      useSyncStore.getState().markSynced();
    },
    (error) => {
      clearConnectTimer();
      useSyncStore.getState().fail(syncErrorMessage(error));
    }
  );
};

export const stopWorkspaceSync = () => {
  clearConnectTimer();
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  if (unsubscribeSnapshot) {
    unsubscribeSnapshot();
    unsubscribeSnapshot = null;
  }
  unsubscribeFromStores();
  hydrating = false;
  lastSerialized = null;
  useSyncStore.getState().reset();
};

export const retryWorkspaceSync = () => {
  stopWorkspaceSync();
  startWorkspaceSync();
};

export const initWorkspaceSync = () => {
  if (!isFirebaseConfigured || started) return;
  started = true;

  let previousUid = useAuthStore.getState().user?.uid || null;
  if (previousUid) startWorkspaceSync();

  useAuthStore.subscribe((state) => {
    const uid = state.user?.uid || null;
    if (uid === previousUid) return;
    previousUid = uid;
    if (uid) startWorkspaceSync();
    else stopWorkspaceSync();
  });
};
