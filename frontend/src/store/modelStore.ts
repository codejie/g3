import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { modelApi, setConfig, setAuthToken } from '../apis/extension/api'
import { useUserStore } from './userStore'
import type { Provider, Model } from '../apis/extension/types/model'

export const useModelStore = defineStore('model', () => {
  const items = ref<{ provider: Provider; models: Model[] }[]>([])
  const loading = ref(false)
  const selectedProviderId = ref<string | null>(null)
  const selectedModelId = ref<string | null>(null)

  const selectedProvider = computed<Provider | null>(() => {
    if (!selectedProviderId.value) return items.value[0]?.provider ?? null
    return items.value.find(i => i.provider.id === selectedProviderId.value)?.provider ?? null
  })

  const selectedModel = computed<Model | null>(() => {
    if (!selectedModelId.value) {
      return items.value[0]?.models[0] ?? null
    }
    for (const item of items.value) {
      const found = item.models.find(m => m.id === selectedModelId.value)
      if (found) return found
    }
    return null
  })

  const currentDisplay = computed(() => {
    const provider = selectedProvider.value
    const model = selectedModel.value
    if (!provider && !model) return '选择模型'
    if (!model) return provider!.name
    return model.name
  })

  const selectModel = (providerId: string, modelId: string) => {
    selectedProviderId.value = providerId
    selectedModelId.value = modelId
    localStorage.setItem('appgenius_selected_provider', providerId)
    localStorage.setItem('appgenius_selected_model', modelId)
  }

  const restoreSelection = () => {
    const savedProvider = localStorage.getItem('appgenius_selected_provider')
    const savedModel = localStorage.getItem('appgenius_selected_model')
    if (savedProvider) selectedProviderId.value = savedProvider
    if (savedModel) selectedModelId.value = savedModel
  }

  const fetchModels = async () => {
    loading.value = true
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL
      if (backendUrl) setConfig({ baseURL: backendUrl })

      const userStore = useUserStore()
      const token = userStore.token
      if (token) {
        setAuthToken(token)
      }

      const response = await modelApi.getModels({})
      if (response.code === 0 && response.data?.items) {
        items.value = response.data.items

        if (!selectedProviderId.value && !selectedModelId.value) {
          restoreSelection()
        }

        if (items.value.length > 0 && !selectedProviderId.value) {
          const firstProvider = items.value[0].provider
          const firstModel = items.value[0].models[0]
          selectedProviderId.value = firstProvider.id
          if (firstModel) selectedModelId.value = firstModel.id
        }
      }
    } catch (error) {
      console.error('[ModelStore] Failed to fetch models:', error)
    } finally {
      loading.value = false
    }
  }

  return {
    items,
    loading,
    selectedProviderId,
    selectedModelId,
    selectedProvider,
    selectedModel,
    currentDisplay,
    selectModel,
    fetchModels,
  }
})
