import { defineStore } from 'pinia'
import { ref } from 'vue'
import { keywordApi, setConfig, setAuthToken } from '../apis/extension/api'
import { useUserStore } from './userStore'
import type { Keyword, Prompt } from '../apis/extension/types/keyword'
import { getEnv } from '../utils/runtimeEnv'

export const useKeywordStore = defineStore('keyword', () => {
  const items = ref<{ keyword: Keyword; prompts: Prompt[] }[]>([])
  const loading = ref(false)
  const activeKeywordId = ref<string | null>(null)

  const activeKeyword = ref<{ keyword: Keyword; prompts: Prompt[] } | null>(null)

  const setActiveKeyword = (keywordId: string | null) => {
    activeKeywordId.value = keywordId
    if (keywordId) {
      activeKeyword.value = items.value.find(i => i.keyword.id === keywordId) ?? null
    } else {
      activeKeyword.value = null
    }
  }

  const fetchKeywords = async () => {
    loading.value = true
    try {
      const backendUrl = getEnv('VITE_BACKEND_URL')
      if (backendUrl) setConfig({ baseURL: backendUrl })

      const userStore = useUserStore()
      const token = userStore.token
      if (token) {
        setAuthToken(token)
      }

      const response = await keywordApi.getKeywords({})
      if (response.code === 0 && response.data?.items) {
        items.value = response.data.items
      }
    } catch (error) {
      console.error('[KeywordStore] Failed to fetch keywords:', error)
    } finally {
      loading.value = false
    }
  }

  return {
    items,
    loading,
    activeKeywordId,
    activeKeyword,
    setActiveKeyword,
    fetchKeywords,
  }
})
