<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useEditorStore } from '@/stores/editor'
import { useDraftStore } from '@/stores/drafts'
import { useUiStore } from '@/stores/ui'
import AppIcon from '@/components/ui/AppIcon.vue'

const editorStore = useEditorStore()
const draftStore = useDraftStore()
const ui = useUiStore()

const editingId = ref<number | null>(null)
const editName = ref('')
const showConfirmDelete = ref<number | null>(null)

function showSuccess(message: string) {
  if (!draftStore.persistenceError) ui.showToast(message)
}

function getPreview(content: string): string {
  const text = content.replace(/[#*`~[\]()]/g, '').trim()
  return text.length > 60 ? text.slice(0, 60) + '...' : text || '（空白草稿）'
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d
    .getMinutes()
    .toString()
    .padStart(2, '0')}`
}

function createDraft() {
  draftStore.updateActiveDraft(editorStore.content)
  const draft = draftStore.createDraft('')
  editorStore.setContent('')
  showSuccess(`已创建「${draft.name}」`)
}

function saveCurrentAsDraft() {
  const content = editorStore.content
  if (!content.trim()) {
    ui.showToast('当前内容为空', 'error')
    return
  }
  const draft = draftStore.saveCurrentAsDraft(content)
  showSuccess(`已保存为「${draft.name}」`)
}

function loadDraft(id: number) {
  draftStore.updateActiveDraft(editorStore.content)
  const draft = draftStore.drafts.find((item) => item.id === id)
  if (!draft) return
  draftStore.setActiveDraft(id)
  editorStore.setContent(draft.content)
  showSuccess(`已加载「${draft.name}」`)
}

function deleteDraft(id: number) {
  const deletingActive = draftStore.deleteDraft(id)
  showConfirmDelete.value = null
  showSuccess(deletingActive ? '已删除当前草稿，编辑内容仍保留' : '已删除草稿')
}

function renameDraft(id: number) {
  const draft = draftStore.drafts.find((item) => item.id === id)
  if (!draft) return
  editingId.value = id
  editName.value = draft.name
}

function confirmRename() {
  if (editingId.value === null) return
  if (editName.value.trim()) {
    draftStore.renameDraft(editingId.value, editName.value.trim())
  }
  editingId.value = null
}

function saveToDraft(id: number) {
  const draft = draftStore.updateDraft(id, editorStore.content)
  if (!draft) return
  showSuccess(`已保存到「${draft.name}」`)
}

onMounted(draftStore.loadDrafts)

defineExpose({ saveCurrentAsDraft, createDraft })
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex items-center justify-between gap-2 mb-1">
      <div class="min-w-0">
        <h3 class="text-[11px] font-semibold tracking-widest uppercase text-text-tertiary">
          草稿管理
        </h3>
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

    <div
      v-if="!draftStore.sortedDrafts.length"
      class="text-center py-6 text-text-tertiary text-[12px]"
    >
      <AppIcon name="fileText" :size="24" class="opacity-30 mb-2" />
      <p>输入内容后会自动保存草稿</p>
    </div>

    <div class="flex flex-col gap-1 max-h-[280px] overflow-y-auto">
      <div
        v-for="draft in draftStore.sortedDrafts"
        :key="draft.id"
        class="draft-card group"
        :class="draftStore.activeDraftId === draft.id ? 'draft-card--active' : ''"
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
            v-if="draftStore.activeDraftId === draft.id"
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
        <div class="draft-card__actions">
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

<style scoped>
.draft-card {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 10px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  transition:
    border-color 0.16s ease,
    background 0.16s ease;
}

.draft-card:hover,
.draft-card:focus-within {
  border-color: var(--color-border-subtle);
  background: var(--color-surface-hover);
}

.draft-card--active {
  border-color: color-mix(in srgb, var(--color-accent) 30%, var(--color-border));
  background: color-mix(in srgb, var(--color-accent) 5%, var(--color-surface));
}

.draft-card__actions {
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.16s ease;
}

.draft-card:hover .draft-card__actions,
.draft-card:focus-within .draft-card__actions,
.draft-card--active .draft-card__actions {
  opacity: 1;
}

@media (hover: none) {
  .draft-card__actions {
    opacity: 1;
  }
}
</style>
