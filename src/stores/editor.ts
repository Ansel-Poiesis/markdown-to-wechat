import { ref, computed, shallowRef } from 'vue'
import { defineStore } from 'pinia'
import { useDraftStore } from '@/stores/drafts'

const STORAGE_KEY = 'wechat-md-draft'
const RECOVERY_KEY = 'wechat-md-workspace-backup'

export interface WorkspaceBackup {
  version: 1
  draftId: number | null
  content: string
  updatedAt: string
}

function isWorkspaceBackup(value: unknown): value is WorkspaceBackup {
  const candidate = value as Partial<WorkspaceBackup> | null
  return Boolean(
    candidate &&
    candidate.version === 1 &&
    (candidate.draftId === null ||
      (Number.isSafeInteger(candidate.draftId) && Number(candidate.draftId) >= 0)) &&
    typeof candidate.content === 'string' &&
    typeof candidate.updatedAt === 'string' &&
    Number.isFinite(Date.parse(candidate.updatedAt)),
  )
}

export const useEditorStore = defineStore('editor', () => {
  const content = ref('')
  const persistenceError = ref<string | null>(null)
  const saveState = ref('已自动保存')
  const editorView = shallowRef<unknown>(null)
  const recovery = ref<WorkspaceBackup | null>(null)
  const drafts = useDraftStore()
  let readFailed = false

  try {
    const storedRecovery = localStorage.getItem(RECOVERY_KEY)
    if (storedRecovery !== null) {
      const parsed: unknown = JSON.parse(storedRecovery)
      if (!isWorkspaceBackup(parsed)) throw new Error('Invalid workspace backup')
      recovery.value = parsed
      content.value = parsed.content
    } else {
      content.value = localStorage.getItem(STORAGE_KEY) ?? ''
    }
  } catch {
    readFailed = true
    persistenceError.value =
      '无法读取编辑区备份；请检查浏览器存储权限后刷新。当前修改请先另行备份。'
    saveState.value = '保存失败'
  }

  const setContent = (value: string) => {
    content.value = value
    saveDraft()
  }

  const markSaving = () => {
    saveState.value = '保存中...'
  }

  const markSaved = () => {
    saveState.value = persistenceError.value ? '保存失败' : '已自动保存'
  }

  function saveDraft(): boolean {
    // Never overwrite an unreadable backup with an empty initial workspace.
    if (readFailed) return false
    markSaving()
    try {
      // Content and identity are written together, independently of the larger draft archive.
      const timestamp = Math.max(
        Date.now(),
        Date.parse(recovery.value?.updatedAt || '') + 1 || 0,
        Date.parse(drafts.activeDraft?.updatedAt || '') + 1 || 0,
      )
      const backup: WorkspaceBackup = {
        version: 1,
        draftId: drafts.activeDraftId,
        content: content.value,
        updatedAt: new Date(timestamp).toISOString(),
      }
      localStorage.setItem(RECOVERY_KEY, JSON.stringify(backup))
      recovery.value = backup
      persistenceError.value = null
      markSaved()
      return true
    } catch {
      persistenceError.value =
        '编辑区备份未能写入本地存储，请先复制原稿或导出，检查存储空间和权限。'
      saveState.value = '保存失败'
      return false
    }
  }

  return {
    content: computed(() => content.value || ''),
    saveState,
    persistenceError,
    recovery: computed(() => recovery.value),
    editorView,
    setContent,
    markSaving,
    markSaved,
    saveDraft,
  }
})
