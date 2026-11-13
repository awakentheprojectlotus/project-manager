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
import { useStatusLinkStore } from '../stores/statusLinkStore';
import { useProjectCategoryStore } from '../stores/projectCategoryStore';
import { useRequirementStore } from '../stores/requirementStore';
import { useChatStore } from '../stores/chatStore';
import { useUiStore } from '../stores/uiStore';
import { createSeed } from '../data/seed';
import { TEAM_AUTH_EMAILS } from '../constants';
import { normalize } from '../utils/match';

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
  requirements: Array.isArray(source.requirements) ? source.requirements : [],
  statusLinks:
    source.statusLinks && typeof source.statusLinks === 'object' ? source.statusLinks : {},
  projectCategories:
    source.projectCategories && typeof source.projectCategories === 'object'
      ? source.projectCategories
      : {},
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
    requirements: useRequirementStore.getState().requirements,
    statusLinks: useStatusLinkStore.getState().links,
    projectCategories: useProjectCategoryStore.getState().config,
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
    useStatusLinkStore.setState({ links: workspace.statusLinks });
    useProjectCategoryStore.setState({ config: workspace.projectCategories });
    useRequirementStore.setState({ requirements: workspace.requirements });

    let members = useTeamStore.getState().members;
    const authUser = useAuthStore.getState().user;
    const authEmail = authUser?.email?.toLowerCase() || '';

    // Upgrade placeholder seed emails to the Firebase login emails.
    const upgradedMembers = members.map((member) => {
      const loginEmail = TEAM_AUTH_EMAILS[member.id];
      if (!loginEmail) return member;
      const email = (member.email || '').toLowerCase();
      if (!email || email.endsWith('@pulse.app')) {
        return { ...member, email: loginEmail };
      }
      return member;
    });
    if (upgradedMembers.some((member, index) => member !== members[index])) {
      useTeamStore.setState({ members: upgradedMembers });
      members = upgradedMembers;
    }

    let preferred = authEmail
      ? members.find((member) => member.email?.toLowerCase() === authEmail)
      : null;

    if (!preferred && authEmail) {
      const mappedId = Object.keys(TEAM_AUTH_EMAILS).find(
        (id) => TEAM_AUTH_EMAILS[id].toLowerCase() === authEmail
      );
      preferred = mappedId ? members.find((member) => member.id === mappedId) : null;
    }

    if (!preferred && authUser?.displayName) {
      const displayName = normalize(authUser.displayName);
      preferred =
        members.find((member) => normalize(member.name) === displayName) || null;
    }

    if (preferred && authEmail && preferred.email?.toLowerCase() !== authEmail) {
      useTeamStore.getState().updateMember(preferred.id, { email: authUser.email });
      preferred = { ...preferred, email: authUser.email };
    }

    if (!preferred && authUser?.email) {
      preferred = useTeamStore.getState().addMember({
        name: authUser.displayName?.trim() || authUser.email.split('@')[0],
        email: authUser.email,
        role: 'Team Member',
      });
      members = useTeamStore.getState().members;
    }

    const localCurrent = useUiStore.getState().currentUserId;
    const targetUser =
      preferred?.id ||
      (members.some((member) => member.id === localCurrent)
        ? localCurrent
        : members[0]?.id || '');
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
    useStatusLinkStore.subscribe(scheduleSave),
    useProjectCategoryStore.subscribe(scheduleSave),
    useRequirementStore.subscribe(scheduleSave),
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
          applyWorkspace(local);
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
      scheduleSave();
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
