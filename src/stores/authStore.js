import { create } from 'zustand';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../services/firebase';

let started = false;

const FRIENDLY_ERRORS = {
  'auth/invalid-credential': 'Email or password is incorrect.',
  'auth/invalid-email': 'Enter a valid email address.',
  'auth/user-not-found': 'Email or password is incorrect.',
  'auth/wrong-password': 'Email or password is incorrect.',
  'auth/email-already-in-use': 'An account with this email already exists. Try signing in instead.',
  'auth/weak-password': 'Choose a stronger password with at least 6 characters.',
  'auth/missing-password': 'Enter your password.',
  'auth/operation-not-allowed': 'Email/password sign-in is not enabled in Firebase Authentication.',
  'auth/network-request-failed': 'Network error. Check your connection and try again.',
  'auth/too-many-requests': 'Too many attempts. Wait a moment and try again.',
  'auth/user-disabled': 'This account has been disabled. Contact the workspace owner.',
  'auth/requires-recent-login': 'Please sign in again to continue.',
};

const friendlyError = (error) =>
  FRIENDLY_ERRORS[error?.code] || error?.message || 'Something went wrong. Please try again.';

const sanitizeUser = (user) =>
  user
    ? {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        emailVerified: Boolean(user.emailVerified),
      }
    : null;

export const useAuthStore = create((set) => ({
  user: null,
  status: isFirebaseConfigured ? 'initializing' : 'unconfigured',
  initialized: false,
  busy: false,
  error: null,

  init: () => {
    if (started) return;
    started = true;
    if (!isFirebaseConfigured || !auth) {
      set({ status: 'unconfigured', initialized: true, error: null });
      return;
    }
    set({ status: 'initializing' });
    onAuthStateChanged(
      auth,
      (user) => {
        set({
          user: sanitizeUser(user),
          status: user ? 'authenticated' : 'unauthenticated',
          initialized: true,
          error: null,
        });
      },
      (error) => {
        set({
          status: 'unauthenticated',
          initialized: true,
          error: friendlyError(error),
        });
      }
    );
  },

  signIn: async (email, password) => {
    if (!isFirebaseConfigured) return false;
    set({ busy: true, error: null });
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      return true;
    } catch (error) {
      set({ error: friendlyError(error) });
      return false;
    } finally {
      set({ busy: false });
    }
  },

  signUp: async ({ name, email, password }) => {
    if (!isFirebaseConfigured) return false;
    set({ busy: true, error: null });
    try {
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (name?.trim()) {
        await updateProfile(credential.user, { displayName: name.trim() });
        const base = sanitizeUser(credential.user) || {
          uid: credential.user.uid,
          email: credential.user.email || '',
          displayName: '',
          emailVerified: false,
        };
        set({ user: { ...base, displayName: name.trim() } });
      }
      return true;
    } catch (error) {
      set({ error: friendlyError(error) });
      return false;
    } finally {
      set({ busy: false });
    }
  },

  resetPassword: async (email) => {
    if (!isFirebaseConfigured) return false;
    set({ busy: true, error: null });
    try {
      await sendPasswordResetEmail(auth, email.trim());
      return true;
    } catch (error) {
      set({ error: friendlyError(error) });
      return false;
    } finally {
      set({ busy: false });
    }
  },

  signOut: async () => {
    if (!isFirebaseConfigured) return;
    set({ busy: true });
    try {
      const { flushWorkspaceSync } = await import('../services/workspaceSync');
      await flushWorkspaceSync();
    } catch {
      // Best-effort flush before ending the session.
    }
    try {
      await firebaseSignOut(auth);
    } finally {
      // Keep the local cache so unsynced work is not lost. Firestore remains
      // the source of truth when a signed-in user reopens the app.
      set({ user: null, status: 'unauthenticated', busy: false, error: null });
    }
  },

  clearError: () => set({ error: null }),
}));
