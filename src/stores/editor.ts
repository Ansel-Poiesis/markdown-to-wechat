import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'

const STORAGE_KEY = 'wechat-md-draft'

export const useEditorStore = defineStore('editor', () => {
  const content = useStorage(STORAGE_KEY, '')
  const saveState = ref('已自动保存')
  const editorView = ref<unknown>(null)

  const setContent = (value: string) => {
    content.value = value
  }

  const markSaving = () => {
    saveState.value = '保存中...'
  }

  const markSaved = () => {
    saveState.value = '已自动保存'
  }

  const saveDraft = () => {
    // useStorage 已自动持久化
    saveState.value = '已自动保存'
  }

  return {
    content: computed(() => content.value || ''),
    saveState,
    editorView,
    setContent,
    markSaving,
    markSaved,
    saveDraft,
  }
})
