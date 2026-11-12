import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import RequireAuth from './components/auth/RequireAuth';
import AuthPage from './components/auth/AuthPage';
import OverviewPage from './pages/OverviewPage';
import MyTasksPage from './pages/MyTasksPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import TeamPage from './pages/TeamPage';
import CalendarPage from './pages/CalendarPage';
import ReportsPage from './pages/ReportsPage';
import AssistantPage from './pages/AssistantPage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';
import { useUiStore } from './stores/uiStore';
import { useAuthStore } from './stores/authStore';
import { isFirebaseConfigured } from './services/firebase';
import { initWorkspaceSync } from './services/workspaceSync';

export default function App() {
  const theme = useUiStore((s) => s.theme);
  const initAuth = useAuthStore((s) => s.init);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    initAuth();
    initWorkspaceSync();
  }, [initAuth]);

  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route element={isFirebaseConfigured ? <RequireAuth /> : <AppLayout />}>
        <Route path="/" element={<OverviewPage />} />
        <Route path="/tasks" element={<MyTasksPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />
        <Route path="/team" element={<TeamPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/assistant" element={<AssistantPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
