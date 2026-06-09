import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Draft } from '@/types'

const STORAGE_KEY = 'wechat-md-drafts'
const ACTIVE_DRAFT_KEY = 'wechat-md-active-draft-id'
const AUTO_DRAFT_NAME = '自动草稿'
const UNTITLED_DRAFT_NAME = '未命名草稿'

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

export const useDraftStore = defineStore('drafts', () => {
  const drafts = ref<Draft[]>([])
  const activeDraftId = ref<number | null>(null)
  const loaded = ref(false)

  const activeDraft = computed(() =>
    activeDraftId.value === null
      ? null
      : drafts.value.find((draft) => draft.id === activeDraftId.value) || null,
  )

  const sortedDrafts = computed(() =>
    [...drafts.value].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    ),
  )

  function loadDrafts() {
    if (loaded.value) return
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      const parsed = stored ? JSON.parse(stored) : []
      drafts.value = Array.isArray(parsed) ? parsed.filter(isDraft) : []

      const storedActive = Number(localStorage.getItem(ACTIVE_DRAFT_KEY))
      activeDraftId.value =
        Number.isFinite(storedActive) && drafts.value.some((draft) => draft.id === storedActive)
          ? storedActive
          : null
    } catch {
      drafts.value = []
      activeDraftId.value = null
    } finally {
      loaded.value = true
    }
  }

  function saveDrafts() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts.value))
    } catch {
      /* ignore */
    }
  }

  function persistActiveDraft(id: number | null) {
    activeDraftId.value = id
    try {
      if (id === null) {
        localStorage.removeItem(ACTIVE_DRAFT_KEY)
      } else {
        localStorage.setItem(ACTIVE_DRAFT_KEY, String(id))
      }
    } catch {
      /* ignore */
    }
  }

  function createDraft(content = '', name?: string) {
    const now = new Date().toISOString()
    const draft: Draft = {
      id: Date.now(),
      name: name || inferDraftName(content),
      content,
      createdAt: now,
      updatedAt: now,
    }
    drafts.value.unshift(draft)
    saveDrafts()
    persistActiveDraft(draft.id)
    return draft
  }

  function saveCurrentAsDraft(content: string) {
    return createDraft(content, inferDraftName(content))
  }

  function setActiveDraft(id: number | null) {
    persistActiveDraft(id)
  }

  function updateActiveDraft(content: string) {
    if (!content.trim()) return
    if (activeDraftId.value === null) {
      createDraft(content, inferDraftName(content))
      return
    }

    const draft = drafts.value.find((item) => item.id === activeDraftId.value)
    if (!draft || draft.content === content) return
    if (shouldAutoRenameDraft(draft)) {
      draft.name = inferDraftName(content)
    }
    draft.content = content
    draft.updatedAt = new Date().toISOString()
    saveDrafts()
  }

  function updateDraft(id: number, content: string) {
    const draft = drafts.value.find((item) => item.id === id)
    if (!draft) return null
    if (shouldAutoRenameDraft(draft)) {
      draft.name = inferDraftName(content)
    }
    draft.content = content
    draft.updatedAt = new Date().toISOString()
    saveDrafts()
    persistActiveDraft(id)
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
    const deletingActive = activeDraftId.value === id
    drafts.value = drafts.value.filter((draft) => draft.id !== id)
    if (deletingActive) persistActiveDraft(null)
    saveDrafts()
    return deletingActive
  }

  return {
    drafts,
    activeDraftId,
    activeDraft,
    sortedDrafts,
    loaded,
    loadDrafts,
    saveDrafts,
    createDraft,
    saveCurrentAsDraft,
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
