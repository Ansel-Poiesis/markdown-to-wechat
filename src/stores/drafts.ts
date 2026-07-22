import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Draft } from '@/types'

const STORAGE_KEY = 'wechat-md-drafts'
const ACTIVE_DRAFT_KEY = 'wechat-md-active-draft-id'
const AUTO_DRAFT_NAME = '自动草稿'
const UNTITLED_DRAFT_NAME = '未命名草稿'
const LEGACY_WELCOME_HEADING = '# 欢迎仪式：把 Markdown 变成公众号文章'
const WELCOME_HEADING = '# 把 Markdown 变成公众号文章'

function stripMarkdownInline(value: string): string {
  return value
    .replace(/!\[([^\]]*)]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)]\([^)]+\)/g, '$1')
    .replace(/[`*_~>#|[\]()]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function inferDraftName(content: string): string {
  const lines = content.split(/\r?\n/)
  const heading = lines
    .map((line) => line.match(/^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$/)?.[1])
    .find((value): value is string => Boolean(value?.trim()))

  const fallback = lines.find((line) => {
    const trimmed = line.trim()
    return (
      trimmed &&
      !trimmed.startsWith('```') &&
      !/^[-*_]{3,}$/.test(trimmed) &&
      !/^!\[[^\]]*]\([^)]+\)/.test(trimmed)
    )
  })

  const name = stripMarkdownInline(heading || fallback || '')
  if (!name) return UNTITLED_DRAFT_NAME
  return name.length > 28 ? `${name.slice(0, 28)}...` : name
}

function shouldAutoRenameDraft(draft: Draft): boolean {
  return (
    draft.name === AUTO_DRAFT_NAME ||
    draft.name === UNTITLED_DRAFT_NAME ||
    draft.name === inferDraftName(draft.content)
  )
}

function migrateLegacyWelcomeHeading(content: string): string {
  if (!content.startsWith(LEGACY_WELCOME_HEADING)) return content
  const boundary = content.charAt(LEGACY_WELCOME_HEADING.length)
  if (boundary && boundary !== '\n' && boundary !== '\r') return content
  return `${WELCOME_HEADING}${content.slice(LEGACY_WELCOME_HEADING.length)}`
}

export const useDraftStore = defineStore('drafts', () => {
  const drafts = ref<Draft[]>([])
  const activeDraftId = ref<number | null>(null)
  const loaded = ref(false)
  const persistenceError = ref<string | null>(null)

  const activeDraft = computed(() =>
    activeDraftId.value === null
      ? null
      : drafts.value.find((draft) => draft.id === activeDraftId.value) || null,
  )

  const sortedDrafts = computed(() =>
    [...drafts.value].sort((a, b) => {
      if (a.id === activeDraftId.value) return -1
      if (b.id === activeDraftId.value) return 1
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    }),
  )

  function loadDrafts() {
    if (loaded.value) return
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      const parsed = stored ? JSON.parse(stored) : []
      drafts.value = Array.isArray(parsed) ? parsed.filter(isDraft) : []

      let migrated = false
      for (const draft of drafts.value) {
        const content = migrateLegacyWelcomeHeading(draft.content)
        if (content === draft.content) continue
        const autoRename = shouldAutoRenameDraft(draft)
        draft.content = content
        if (autoRename) draft.name = inferDraftName(content)
        migrated = true
      }
      if (migrated) writeDrafts()

      const storedActive = Number(localStorage.getItem(ACTIVE_DRAFT_KEY))
      activeDraftId.value =
        Number.isFinite(storedActive) && drafts.value.some((draft) => draft.id === storedActive)
          ? storedActive
          : null
    } catch {
      drafts.value = []
      activeDraftId.value = null
      persistenceError.value = '无法读取本地草稿，请检查浏览器存储权限。'
    } finally {
      loaded.value = true
    }
  }

  function writeDrafts(): boolean {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts.value))
      return true
    } catch {
      persistenceError.value = '草稿未能写入本地存储，请检查浏览器存储空间或权限。'
      return false
    }
  }

  function saveDrafts(): boolean {
    persistenceError.value = null
    return writeDrafts()
  }

  function writeActiveDraft(id: number | null): boolean {
    try {
      if (id === null) {
        localStorage.removeItem(ACTIVE_DRAFT_KEY)
      } else {
        localStorage.setItem(ACTIVE_DRAFT_KEY, String(id))
      }
      return true
    } catch {
      persistenceError.value = '当前草稿状态未能写入本地存储，请检查浏览器存储权限。'
      return false
    }
  }

  function persistActiveDraft(id: number | null): boolean {
    activeDraftId.value = id
    persistenceError.value = null
    return writeActiveDraft(id)
  }

  function createDraft(content = '', name?: string) {
    persistenceError.value = null
    const now = new Date().toISOString()
    const latestId = drafts.value.reduce((max, draft) => Math.max(max, draft.id), 0)
    const draft: Draft = {
      id: Math.max(Date.now(), latestId + 1),
      name: name || inferDraftName(content),
      content,
      createdAt: now,
      updatedAt: now,
    }
    drafts.value.unshift(draft)
    writeDrafts()
    activeDraftId.value = draft.id
    writeActiveDraft(draft.id)
    return draft
  }

  function saveCurrentAsDraft(content: string) {
    return createDraft(content, inferDraftName(content))
  }

  function initializeWorkspace(editorContent: string, welcomeContent: string) {
    loadDrafts()
    if (activeDraft.value) return activeDraft.value.content

    const migratedEditorContent = migrateLegacyWelcomeHeading(editorContent)
    const initialContent = migratedEditorContent.trim() ? migratedEditorContent : welcomeContent
    if (initialContent.trim()) updateActiveDraft(initialContent)
    return initialContent
  }

  function setActiveDraft(id: number | null) {
    persistActiveDraft(id)
  }

  function updateActiveDraft(content: string): boolean {
    if (activeDraftId.value === null) {
      if (!content.trim()) return true
      createDraft(content, inferDraftName(content))
      return persistenceError.value === null
    }

    const draft = drafts.value.find((item) => item.id === activeDraftId.value)
    if (!draft || draft.content === content) return true
    if (shouldAutoRenameDraft(draft)) {
      draft.name = inferDraftName(content)
    }
    draft.content = content
    draft.updatedAt = new Date().toISOString()
    return saveDrafts()
  }

  function updateDraft(id: number, content: string) {
    const draft = drafts.value.find((item) => item.id === id)
    if (!draft) return null
    if (shouldAutoRenameDraft(draft)) {
      draft.name = inferDraftName(content)
    }
    draft.content = content
    draft.updatedAt = new Date().toISOString()
    persistenceError.value = null
    writeDrafts()
    activeDraftId.value = id
    writeActiveDraft(id)
    return draft
  }

  function renameDraft(id: number, name: string) {
    const draft = drafts.value.find((item) => item.id === id)
    if (!draft) return
    draft.name = name
    draft.updatedAt = new Date().toISOString()
    saveDrafts()
  }

  function deleteDraft(id: number) {
    persistenceError.value = null
    const deletingActive = activeDraftId.value === id
    drafts.value = drafts.value.filter((draft) => draft.id !== id)
    if (deletingActive) {
      activeDraftId.value = null
      writeActiveDraft(null)
    }
    writeDrafts()
    return deletingActive
  }

  return {
    drafts,
    activeDraftId,
    activeDraft,
    sortedDrafts,
    loaded,
    persistenceError,
    loadDrafts,
    saveDrafts,
    createDraft,
    saveCurrentAsDraft,
    initializeWorkspace,
    setActiveDraft,
    updateActiveDraft,
    updateDraft,
    renameDraft,
    deleteDraft,
  }
})

function isDraft(value: unknown): value is Draft {
  const candidate = value as Partial<Draft>
  return (
    typeof candidate?.id === 'number' &&
    typeof candidate.name === 'string' &&
    typeof candidate.content === 'string' &&
    typeof candidate.createdAt === 'string' &&
    typeof candidate.updatedAt === 'string'
  )
}
