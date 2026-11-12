import { createSeed } from '../data/seed';
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

export const resetDemoData = () => {
  const seed = createSeed();
  useProjectStore.setState({ projects: seed.projects });
  useTaskStore.setState({ tasks: seed.tasks });
  useTeamStore.setState({ members: seed.members });
  useActivityStore.setState({ entries: seed.activity });
  useNotificationStore.setState({ notifications: seed.notifications });
  useFileStore.setState({ files: seed.projectFiles || [] });
  useStatusLinkStore.setState({ links: seed.statusLinks || {} });
  useProjectCategoryStore.setState({ config: seed.projectCategories || {} });
  useRequirementStore.setState({ requirements: seed.requirements || [] });
  useUiStore.getState().setCurrentUser(seed.currentUserId);
  useChatStore.getState().clearConversation();
};

export const clearWorkspace = () => {
  useProjectStore.setState({ projects: [] });
  useTaskStore.setState({ tasks: [] });
  useTeamStore.setState({ members: [] });
  useActivityStore.setState({ entries: [] });
  useNotificationStore.setState({ notifications: [] });
  useFileStore.setState({ files: [] });
  useStatusLinkStore.setState({ links: {} });
  useProjectCategoryStore.setState({ config: {} });
  useRequirementStore.setState({ requirements: [] });
  useUiStore.getState().setCurrentUser('');
  useChatStore.getState().clearConversation();
};
