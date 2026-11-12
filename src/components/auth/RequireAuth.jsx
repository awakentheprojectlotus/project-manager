import { Navigate } from 'react-router-dom';
import AppLayout from '../layout/AppLayout';
import AuthSplash from './AuthSplash';
import { useAuthStore } from '../../stores/authStore';
import { useSyncStore } from '../../stores/syncStore';
import { isFirebaseConfigured } from '../../services/firebase';

export default function RequireAuth() {
  const status = useAuthStore((s) => s.status);
  const initialized = useAuthStore((s) => s.initialized);
  const syncStatus = useSyncStore((s) => s.status);

  if (!isFirebaseConfigured) return <AppLayout />;

  if (!initialized || status === 'initializing') {
    return (
      <AuthSplash
        message="Checking your session…"
        description="Restoring your Firebase authentication state."
      />
    );
  }

  if (status !== 'authenticated') return <Navigate to="/auth" replace />;

  if (syncStatus === 'idle' || syncStatus === 'connecting') {
    return (
      <AuthSplash
        message="Loading your workspace…"
        description="Fetching projects, tasks and team members from Firestore."
      />
    );
  }

  return <AppLayout />;
}
