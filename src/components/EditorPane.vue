<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { EditorView, basicSetup } from 'codemirror'
import { Compartment } from '@codemirror/state'
import { markdown } from '@codemirror/lang-markdown'
import { keymap } from '@codemirror/view'
import { oneDark } from '@codemirror/theme-one-dark'
import { markdownCommandsKeymap } from '@/composables/useMarkdownCommands'
import { useAiFormatting } from '@/composables/useAiFormatting'
import { markdownToPlainText } from '@/composables/usePlainText'
import { useEditorStore } from '@/stores/editor'
import { useDraftStore } from '@/stores/drafts'
import { useSettingsStore } from '@/stores/settings'
import { useUiStore } from '@/stores/ui'
import {
  processImageFile,
  getImageFilesFromClipboard,
  getImageFilesFromDragDrop,
  formatFileSize,
} from '@/composables/useImageUpload'
import AppIcon from '@/components/ui/AppIcon.vue'
import AiFormatConfirmModal from '@/components/modals/AiFormatConfirmModal.vue'

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  modelValue: string
  saveRevision: number
  saveFailed: boolean
}>()
const emit = defineEmits<{
  'update:modelValue': [value: string]
  loadSample: []
  scroll: [ratio: number]
}>()

const editorHost = ref<HTMLDivElement>()
const editorStore = useEditorStore()
const draftStore = useDraftStore()
const settings = useSettingsStore()
const ui = useUiStore()
let view: EditorView | null = null
const colorModeCompartment = new Compartment()
const editorStyle = computed(() => ({
  fontSize: `${Number(settings.fontSize) || 16}px`,
}))

// Track which format mode is active for toggle styling
const formatMode = ref<'none' | 'pure' | 'format'>('none')
let formatJustApplied = false
const modelValue = computed(() => props.modelValue)

const {
  confirmOpen,
  formatLoading,
  requiresApiKey,
  canUndo,
  requestFormat,
  closeConfirm,
  confirmFormat,
  cancelFormat,
  undoFormat,
} = useAiFormatting({
  content: modelValue,
  documentId: computed(() => draftStore.activeDraftId),
  applyContent: (value) => {
    formatJustApplied = true
    emit('update:modelValue', value)
  },
  onApplied: () => {
    formatMode.value = 'format'
  },
  onUndone: () => {
    formatMode.value = 'none'
  },
})

function handlePure() {
  const stripped = markdownToPlainText(props.modelValue)
  formatJustApplied = true
  emit('update:modelValue', stripped)
  formatMode.value = 'pure'
  ui.showToast('已清除格式', 'info')
}

function handleAutoFormat() {
  if (formatLoading.value) {
    cancelFormat()
    return
  }
  requestFormat()
}

const saveLabel = ref('已自动保存')
const saveVisible = ref(false)
let fadeTimer: ReturnType<typeof setTimeout> | null = null

function showSaveState(label: string, keepVisible = false) {
  saveLabel.value = label
  saveVisible.value = true
  if (fadeTimer) clearTimeout(fadeTimer)
  if (!keepVisible && label !== '保存中...') {
    fadeTimer = setTimeout(() => {
      saveVisible.value = false
    }, 2000)
  }
}

function wrapSelection(view: EditorView, before: string, after: string) {
  const state = view.state
  const { from, to } = state.selection.main
  const selected = state.sliceDoc(from, to)
  const replacement = `${before}${selected || '文本'}${after}`
  view.dispatch({
    changes: { from, to, insert: replacement },
    selection: {
      anchor: from + before.length,
      head: from + before.length + (selected || '文本').length,
    },
  })
  return true
}

const formatKeymap = keymap.of([
  { key: 'Mod-b', run: (v) => wrapSelection(v, '**', '**') },
  { key: 'Mod-i', run: (v) => wrapSelection(v, '*', '*') },
  { key: 'Mod-Shift-x', run: (v) => wrapSelection(v, '~~', '~~') },
  { key: 'Mod-Shift-h', run: (v) => wrapSelection(v, '==', '==') },
  { key: 'Mod-e', run: (v) => wrapSelection(v, '`', '`') },
])

async function insertImages(files: File[], target: EditorView, from: number, to = from) {
  const originalDoc = target.state.doc
  const originalDraftId = draftStore.activeDraftId
  try {
    const results = []
    for (const file of files) {
      if (view !== target) return
      ui.showToast(`处理图片 ${file.name}...`, 'info')
      results.push(await processImageFile(file))
    }
    if (view !== target) return
    // Avoid inserting into a newly selected draft or stale offsets while decoding images.
    if (target.state.doc !== originalDoc || draftStore.activeDraftId !== originalDraftId) {
      ui.showToast('处理图片期间原稿已变化，请重新粘贴或拖入图片。', 'warning')
      return
    }
    const markdown = results.map((result) => result.markdown).join('\n\n')
    target.dispatch({
      changes: { from, to, insert: markdown },
      selection: { anchor: from + markdown.length },
    })
    const size = results.reduce((total, result) => total + result.compressedSize, 0)
    ui.showToast(`已插入 ${results.length} 张图片 (${formatFileSize(size)})`, 'success')
  } catch (error) {
    if (view !== target) return
    ui.showToast(
      error instanceof Error ? `图片插入失败：${error.message}` : '图片插入失败，请重试。',
      'error',
    )
  }
}

onMounted(() => {
  if (!editorHost.value) return
  view = new EditorView({
    doc: props.modelValue,
    extensions: [
      basicSetup,
      markdown(),
      markdownCommandsKeymap(),
      formatKeymap,
      EditorView.lineWrapping,
      EditorView.contentAttributes.of({ 'aria-label': 'Markdown 原稿编辑器' }),
      colorModeCompartment.of(ui.colorMode === 'dark' ? oneDark : []),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          emit('update:modelValue', update.state.doc.toString())
          showSaveState('保存中...')
        }
      }),
      EditorView.domEventHandlers({
        scroll: (_event, v) => {
          const scroller = v.scrollDOM
          const maxScroll = scroller.scrollHeight - scroller.clientHeight
          if (maxScroll > 0) {
            emit('scroll', scroller.scrollTop / maxScroll)
          }
        },
        paste: (event, v) => {
          const files = getImageFilesFromClipboard(event)
          if (files.length === 0) return false
          event.preventDefault()
          const { from, to } = v.state.selection.main
          void insertImages(files, v, from, to)
          return true
        },
        drop: (event, v) => {
          const files = getImageFilesFromDragDrop(event)
          if (files.length === 0) return false
          const pos = v.posAtCoords({ x: event.clientX, y: event.clientY })
          if (pos === null) return false
          event.preventDefault()
          void insertImages(files, v, pos)
          return true
        },
      }),
    ],
    parent: editorHost.value,
  })
  editorStore.editorView = view as unknown
})

onBeforeUnmount(() => {
  if (fadeTimer) clearTimeout(fadeTimer)
  if (editorStore.editorView === view) editorStore.editorView = null
  view?.destroy()
  view = null
})

watch(
  () => props.modelValue,
  (v, oldV) => {
    if (view && v !== view.state.doc.toString()) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: v },
      })
    }
    // Reset format mode when user edits (not when we just applied a format)
    if (formatJustApplied) {
      formatJustApplied = false
    } else if (oldV && v !== oldV) {
      formatMode.value = 'none'
    }
  },
)

watch(
  [() => props.saveRevision, () => props.saveFailed],
  () => showSaveState(props.saveFailed ? '保存失败' : '已保存', props.saveFailed),
  { immediate: true },
)

watch(
  () => ui.colorMode,
  (mode) => {
    view?.dispatch({
      effects: colorModeCompartment.reconfigure(mode === 'dark' ? oneDark : []),
    })
  },
)
</script>

<template>
  <section v-bind="$attrs" class="workspace-panel animate-panel-1" aria-label="Markdown 编辑区">
    <div class="panel-toolbar">
      <div class="panel-heading">
        <span class="panel-heading__icon"><AppIcon name="pen" :size="14" /></span>
        <strong class="panel-heading__label flex items-center gap-1.5">
          原稿
          <Transition name="fade">
            <span
              v-show="saveVisible"
              class="inline-flex items-center gap-0.5 text-[11px] text-text-tertiary"
              role="status"
              aria-live="polite"
            >
              <AppIcon v-if="saveLabel === '保存中...'" name="save" :size="11" />
              <AppIcon v-else-if="saveLabel === '保存失败'" name="alertCircle" :size="11" />
              <AppIcon v-else name="checkCircle" :size="11" />
              {{ saveLabel }}
            </span>
          </Transition>
        </strong>
      </div>
      <div class="editor-actions">
        <button
          v-if="canUndo"
          type="button"
          class="editor-action-button text-text-tertiary hover:text-text"
          title="撤销最近一次辅助排版"
          aria-label="撤销辅助排版"
          @click="undoFormat"
        >
          <AppIcon name="undo" :size="13" />
        </button>
        <button
          type="button"
          class="editor-action-button"
          :class="
            formatMode === 'pure'
              ? 'editor-action-button--active'
              : 'text-text-tertiary hover:text-text'
          "
          title="清除所有 Markdown 格式，仅保留纯文本"
          :aria-pressed="formatMode === 'pure'"
          @click="handlePure"
        >
          清除格式
        </button>
        <button
          type="button"
          class="editor-action-button"
          :class="[
            formatMode === 'format'
              ? 'editor-action-button--active'
              : 'text-text-tertiary hover:text-text',
            formatLoading && 'opacity-60 cursor-wait',
          ]"
          title="通过 AI 自动识别标题、加粗、引用等并写入 Markdown 语法（流式输出，再次点击取消）"
          :aria-pressed="formatMode === 'format'"
          @click="handleAutoFormat"
        >
          <svg v-if="formatLoading" class="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="3"
            />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          {{ formatLoading ? '取消' : '辅助排版' }}
        </button>
      </div>
    </div>
    <div class="editor-scroll">
      <div class="editor-canvas">
        <div
          ref="editorHost"
          class="editor-host font-mono leading-relaxed"
          :style="editorStyle"
        ></div>
        <Transition name="fade">
          <div
            v-if="!modelValue"
            class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 text-text-tertiary select-none pointer-events-none"
          >
            <AppIcon name="fileText" :size="32" class="opacity-40" />
            <div class="text-center">
              <p class="text-[13px] font-medium text-text-secondary mb-1">
                粘贴 Markdown 或拖入图片开始排版
              </p>
              <button
                type="button"
                class="text-xs text-accent hover:underline pointer-events-auto"
                @click="emit('loadSample')"
              >
                加载欢迎文本
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </section>

  <AiFormatConfirmModal
    :open="confirmOpen"
    :requires-api-key="requiresApiKey"
    @cancel="closeConfirm"
    @confirm="confirmFormat"
  />
</template>

<style scoped>
.editor-scroll {
  flex: 1;
  min-height: 0;
  padding: 0 14px 14px;
  background: transparent;
  overflow: hidden;
  display: flex;
  align-items: stretch;
}

.editor-canvas {
  position: relative;
  min-width: 0;
  flex: 1 1 0;
  min-height: 0;
  background: var(--color-editor);
  border-radius: 14px;
  overflow: hidden;
  box-shadow: var(--shadow-inset);
}

.editor-host {
  position: absolute;
  inset: 4px;
  border-radius: 11px;
  overflow: hidden;
}

div :deep(.cm-editor) {
  height: 100%;
  background: transparent;
  color: var(--color-text);
  font-size: inherit;
}
div :deep(.cm-editor.cm-focused) {
  outline: none;
}
div :deep(.cm-content) {
  font-size: inherit;
}
div :deep(.cm-scroller) {
  padding: 18px 10px 18px 6px;
  font-family: 'Cascadia Code', 'SFMono-Regular', Consolas, 'Microsoft YaHei UI', monospace;
  line-height: 1.8;
}
div :deep(.cm-gutters) {
  border-right: 1px solid var(--color-border-subtle);
  background: transparent;
}
div :deep(.cm-lineNumbers) {
  color: var(--color-text-tertiary);
  font-size: 12px;
}

div :deep(.cm-activeLine),
div :deep(.cm-activeLineGutter) {
  background: color-mix(in srgb, var(--color-accent) 5%, transparent);
}

.editor-canvas:focus-within {
  outline: 1px solid color-mix(in srgb, var(--color-accent) 40%, transparent);
  outline-offset: -1px;
}

.editor-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.editor-action-button {
  min-width: 0;
  height: 30px;
  padding: 0 10px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: var(--color-text-secondary);
  background: transparent;
  border: 1px solid transparent;
  font-size: 11px;
  line-height: 1;
  font-weight: 550;
  transition:
    background 0.16s ease,
    color 0.16s ease,
    box-shadow 0.16s ease;
}

.editor-action-button--active {
  color: var(--color-text);
  background: var(--color-surface-pressed);
  box-shadow: var(--shadow-inset-soft);
}

.editor-action-button:hover {
  background: var(--color-surface-hover);
}

.editor-action-button:active {
  box-shadow: var(--shadow-inset-soft);
}

@media (max-width: 639px) {
  .editor-scroll {
    padding: 0 10px 10px;
  }
  .editor-actions {
    gap: 2px;
  }
  .editor-action-button {
    padding: 0 7px;
    min-height: 34px;
  }
  div :deep(.cm-scroller) {
    padding: 14px 4px;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
