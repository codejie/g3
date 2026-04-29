import { defineStore } from 'pinia';
import { ref } from 'vue';

const STORAGE_KEY = 'appgenius_current_project_id';

export const useChatStore = defineStore('chat', () => {
  const sending = ref(false);
  const isSidebarCollapsed = ref(false);
  const isRightSidebarCollapsed = ref(false);
  const currentMode = ref<'build' | 'plan'>('build');

  const toggleSidebar = () => {
    isSidebarCollapsed.value = !isSidebarCollapsed.value;
  };

  const toggleRightSidebar = () => {
    isRightSidebarCollapsed.value = !isRightSidebarCollapsed.value;
  };

  const getOpenCodeURL = (): string => {
    return import.meta.env.VITE_OPENCODE_URL || 'http://127.0.0.1:10090';
  };

  const saveCurrentProjectId = (projectId: string | null) => {
    if (projectId) {
      localStorage.setItem(STORAGE_KEY, projectId);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const loadCurrentProjectId = (): string | null => {
    return localStorage.getItem(STORAGE_KEY);
  };

  return {
    sending,
    isSidebarCollapsed,
    isRightSidebarCollapsed,
    currentMode,
    toggleSidebar,
    toggleRightSidebar,
    getOpenCodeURL,
    saveCurrentProjectId,
    loadCurrentProjectId,
  };
});
