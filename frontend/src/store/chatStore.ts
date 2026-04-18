import { defineStore } from 'pinia';
import { ref } from 'vue';
import { sessionApi, setConfig } from '../apis/opencode/api';
import type { Session } from '../types';

export const useChatStore = defineStore('chat', () => {
  const hasSession = ref(false);
  const currentSession = ref<Session | null>(null);
  const sessionList = ref<Session[]>([]);
  const loading = ref(false);
  const listLoading = ref(false);
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

  const fetchSessions = async () => {
    listLoading.value = true;
    try {
      const baseURL = getOpenCodeURL();
      setConfig({ baseURL });
      
      const sessions = await sessionApi.list({ limit: 50 });
      sessionList.value = sessions as Session[];

      const savedSessionId = localStorage.getItem('g3_current_session_id');
      if (!currentSession.value && savedSessionId) {
        const found = sessionList.value.find(s => s.id === savedSessionId);
        if (found) {
          selectSession(found);
        }
      }

      return sessions;
    } catch (error) {
      console.error('[ChatStore] Failed to fetch sessions:', error);
    } finally {
      listLoading.value = false;
    }
  };

  const startNewSession = async () => {
    loading.value = true;
    try {
      const baseURL = getOpenCodeURL();
      setConfig({ baseURL });

      const session = await sessionApi.create({ title: '新会话' });
      
      currentSession.value = session as Session;
      hasSession.value = true;
      localStorage.setItem('g3_current_session_id', session.id);

      await fetchSessions();
      return session;
    } catch (error) {
      console.error('[ChatStore] Failed to create session:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const selectSession = async (session: Session) => {
    currentSession.value = session;
    hasSession.value = true;
    localStorage.setItem('g3_current_session_id', session.id);
  };

  const resetSession = () => {
    hasSession.value = false;
    currentSession.value = null;
    localStorage.removeItem('g3_current_session_id');
  };

  return {
    hasSession,
    currentSession,
    sessionList,
    loading,
    listLoading,
    sending,
    isSidebarCollapsed,
    isRightSidebarCollapsed,
    currentMode,
    toggleSidebar,
    toggleRightSidebar,
    fetchSessions,
    startNewSession,
    selectSession,
    resetSession,
    getOpenCodeURL
  };
});
