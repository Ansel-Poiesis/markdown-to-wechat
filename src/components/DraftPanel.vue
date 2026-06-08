<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useEditorStore } from '@/stores/editor'
import { useUiStore } from '@/stores/ui'
import type { Draft } from '@/types'
import AppIcon from '@/components/ui/AppIcon.vue'

const editorStore = useEditorStore()
const ui = useUiStore()

const STORAGE_KEY = 'wechat-md-drafts'
const ACTIVE_DRAFT_KEY = 'wechat-md-active-draft-id'
const drafts = ref<Draft[]>([])
const activeDraftId = ref<number | null>(null)
const editingId = ref<number | null>(null)
const editName = ref('')
const showConfirmDelete = ref<number | null>(null)

const activeDraft = computed(() =>
  activeDraftId.value === null
    ? null
    : drafts.value.find((d) => d.id === activeDraftId.value) || null,
)

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

function loadDrafts() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    const parsed = stored ? JSON.parse(stored) : []
    drafts.value = Array.isArray(parsed) ? parsed.filter(isDraft) : []

    const storedActive = Number(localStorage.getItem(ACTIVE_DRAFT_KEY))
    activeDraftId.value =
      Number.isFinite(storedActive) && drafts.value.some((d) => d.id === storedActive)
        ? storedActive
        : null
  } catch {
    drafts.value = []
    activeDraftId.value = null
  }
}

function saveDrafts() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts.value))
  } catch {
    /* ignore */
  }
}

function saveActiveDraft() {
  if (activeDraftId.value === null) return
  const draft = drafts.value.find((d) => d.id === activeDraftId.value)
  if (!draft) return
  if (draft.content === editorStore.content) return
  draft.content = editorStore.content
  draft.updatedAt = new Date().toISOString()
  saveDrafts()
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

function getPreview(content: string): string {
  const text = content.replace(/[#*`~\[\]()]/g, '').trim()
  return text.length > 60 ? text.slice(0, 60) + '…' : text || '（空白草稿）'
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

function createDraft() {
  saveActiveDraft()
  const now = new Date().toISOString()
  const draft: Draft = {
    id: Date.now(),
    name: `草稿 ${drafts.value.length + 1}`,
    content: '',
    createdAt: now,
    updatedAt: now,
  }
  drafts.value.unshift(draft)
  saveDrafts()
  persistActiveDraft(draft.id)
  editorStore.setContent('')
  ui.showToast('已创建新草稿')
}

function saveCurrentAsDraft() {
  const content = editorStore.content
  if (!content.trim()) {
    ui.showToast('当前内容为空', 'error')
    return
  }
  const now = new Date().toISOString()
  const draft: Draft = {
    id: Date.now(),
    name: `草稿 ${drafts.value.length + 1}`,
    content,
    createdAt: now,
    updatedAt: now,
  }
  drafts.value.unshift(draft)
  saveDrafts()
  persistActiveDraft(draft.id)
  ui.showToast(`已保存为「${draft.name}」`)
}

function loadDraft(id: number) {
  saveActiveDraft()
  const draft = drafts.value.find((d) => d.id === id)
  if (!draft) return
  persistActiveDraft(id)
  editorStore.setContent(draft.content)
  ui.showToast(`已加载「${draft.name}」`)
}

function deleteDraft(id: number) {
  const deletingActive = activeDraftId.value === id
  drafts.value = drafts.value.filter((d) => d.id !== id)
  if (deletingActive) persistActiveDraft(null)
  saveDrafts()
  showConfirmDelete.value = null
  ui.showToast(deletingActive ? '已删除当前草稿，编辑内容仍保留' : '已删除草稿')
}

function renameDraft(id: number) {
  const draft = drafts.value.find((d) => d.id === id)
  if (!draft) return
  editingId.value = id
  editName.value = draft.name
}

function confirmRename() {
  if (editingId.value === null) return
  const draft = drafts.value.find((d) => d.id === editingId.value)
  if (draft && editName.value.trim()) {
    draft.name = editName.value.trim()
    saveDrafts()
  }
  editingId.value = null
}

function saveToDraft(id: number) {
  saveActiveDraft()
  const draft = drafts.value.find((d) => d.id === id)
  if (!draft) return
  draft.content = editorStore.content
  draft.updatedAt = new Date().toISOString()
  saveDrafts()
  persistActiveDraft(id)
  ui.showToast(`已保存到「${draft.name}」`)
}

const sortedDrafts = computed(() =>
  [...drafts.value].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  ),
)

onMounted(() => {
  loadDrafts()
  if (activeDraft.value) {
    editorStore.setContent(activeDraft.value.content)
  }
})

watch(
  () => editorStore.content,
  (content) => {
    if (activeDraftId.value === null) return
    const draft = drafts.value.find((d) => d.id === activeDraftId.value)
    if (!draft || draft.content === content) return
    draft.content = content
    draft.updatedAt = new Date().toISOString()
    saveDrafts()
  },
)

defineExpose({ saveCurrentAsDraft, createDraft })
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex items-center justify-between gap-2 mb-1">
      <div class="min-w-0">
        <h3 class="text-[11px] font-semibold tracking-widest uppercase text-text-tertiary">
          草稿管理
        </h3>
        <p v-if="activeDraft" class="text-[10px] text-text-tertiary truncate mt-0.5">
          正在编辑：{{ activeDraft.name }}
        </p>
      </div>
      <div class="flex gap-1">
        <button
          type="button"
          title="保存当前为新草稿"
          class="w-7 h-7 flex items-center justify-center rounded-md text-text-tertiary hover:text-accent hover:bg-accent/10 transition-all active:scale-90"
          @click="saveCurrentAsDraft"
        >
          <AppIcon name="save" :size="14" />
        </button>
        <button
          type="button"
          title="新建空白草稿"
          class="w-7 h-7 flex items-center justify-center rounded-md text-text-tertiary hover:text-accent hover:bg-accent/10 transition-all active:scale-90"
          @click="createDraft"
        >
          <AppIcon name="plus" :size="14" />
        </button>
      </div>
    </div>

    <div v-if="!sortedDrafts.length" class="text-center py-6 text-text-tertiary text-[12px]">
      <AppIcon name="fileText" :size="24" class="opacity-30 mb-2" />
      <p>还没有保存的草稿</p>
    </div>

    <div class="flex flex-col gap-1 max-h-[280px] overflow-y-auto">
      <div
        v-for="draft in sortedDrafts"
        :key="draft.id"
        class="group relative flex flex-col p-2.5 rounded-xl border transition-all cursor-pointer"
        :class="
          activeDraftId === draft.id
            ? 'border-accent/30 bg-accent/[0.04]'
            : 'border-transparent hover:border-border-subtle hover:bg-surface-hover'
        "
        @click="loadDraft(draft.id)"
      >
        <div class="flex items-center gap-2 mb-1">
          <template v-if="editingId === draft.id">
            <input
              v-model="editName"
              class="flex-1 min-w-0 h-6 px-2 text-[13px] rounded border border-accent bg-surface text-text focus:outline-none"
              @click.stop
              @keydown.enter.stop="confirmRename"
              @keydown.escape.stop="editingId = null"
              @blur="confirmRename"
            />
          </template>
          <template v-else>
            <strong class="flex-1 min-w-0 text-[13px] font-medium text-text truncate">{{
              draft.name
            }}</strong>
          </template>
          <span
            v-if="activeDraftId === draft.id"
            class="text-[9px] font-semibold text-accent bg-accent/10 px-1.5 py-0.5 rounded-full shrink-0"
          >
            当前
          </span>
          <span class="text-[10px] text-text-tertiary shrink-0">{{
            formatDate(draft.updatedAt)
          }}</span>
        </div>
        <p class="text-[11px] text-text-tertiary leading-relaxed line-clamp-2">
          {{ getPreview(draft.content) }}
        </p>
        <div
          class="flex items-center gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <button
            type="button"
            title="保存当前内容到此草稿"
            class="w-6 h-6 flex items-center justify-center rounded text-text-tertiary hover:text-accent hover:bg-accent/10 transition-all"
            @click.stop="saveToDraft(draft.id)"
          >
            <AppIcon name="save" :size="12" />
          </button>
          <button
            type="button"
            title="重命名"
            class="w-6 h-6 flex items-center justify-center rounded text-text-tertiary hover:text-info hover:bg-info/10 transition-all"
            @click.stop="renameDraft(draft.id)"
          >
            <AppIcon name="pencil" :size="12" />
          </button>
          <button
            v-if="showConfirmDelete !== draft.id"
            type="button"
            title="删除"
            class="w-6 h-6 flex items-center justify-center rounded text-text-tertiary hover:text-danger hover:bg-danger/10 transition-all"
            @click.stop="showConfirmDelete = draft.id"
          >
            <AppIcon name="trash" :size="12" />
          </button>
          <button
            v-else
            type="button"
            title="确认删除"
            class="w-6 h-6 flex items-center justify-center rounded text-danger bg-danger/10 transition-all"
            @click.stop="deleteDraft(draft.id)"
          >
            <AppIcon name="check" :size="12" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
