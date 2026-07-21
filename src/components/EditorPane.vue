<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import { EditorView, basicSetup } from 'codemirror'
import { Compartment } from '@codemirror/state'
import { markdown } from '@codemirror/lang-markdown'
import { keymap } from '@codemirror/view'
import { oneDark } from '@codemirror/theme-one-dark'
import { markdownCommandsKeymap } from '@/composables/useMarkdownCommands'
import { useAiFormatting } from '@/composables/useAiFormatting'
import { useEditorStore } from '@/stores/editor'
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

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{
  'update:modelValue': [value: string]
  loadSample: []
  scroll: [ratio: number]
}>()

const editorHost = ref<HTMLDivElement>()
const editorStore = useEditorStore()
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

function stripMarkdown(input: string): string {
  return input
    .replace(/^#{1,6}\s+/gm, '') // headings
    .replace(/\*\*(.+?)\*\*/g, '$1') // bold
    .replace(/\*(.+?)\*/g, '$1') // italic
    .replace(/~~(.+?)~~/g, '$1') // strikethrough
    .replace(/==(.+?)==/g, '$1') // highlight
    .replace(/`([^`]+)`/g, '$1') // inline code
    .replace(/```[\s\S]*?```/g, '') // code blocks
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1') // images → alt text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links → text
    .replace(/^\s*[-*+]\s+/gm, '') // unordered lists
    .replace(/^\s*\d+\.\s+/gm, '') // ordered lists
    .replace(/^\s*>\s*/gm, '') // blockquotes
    .replace(/^\s*-\s*\[[ xX]\]\s*/gm, '') // task lists
    .replace(/^---+\s*$/gm, '') // horizontal rules
    .replace(/\n{3,}/g, '\n\n') // excess blank lines
}

function handlePure() {
  const stripped = stripMarkdown(props.modelValue)
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
let saveTimer: ReturnType<typeof setTimeout> | null = null
let fadeTimer: ReturnType<typeof setTimeout> | null = null

function showSaveState(label: string) {
  saveLabel.value = label
  saveVisible.value = true
  if (saveTimer) clearTimeout(saveTimer)
  if (fadeTimer) clearTimeout(fadeTimer)
  saveTimer = setTimeout(() => {
    saveLabel.value = '已保存'
    fadeTimer = setTimeout(() => {
      saveVisible.value = false
    }, 2000)
  }, 600)
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
          // Fire and forget async image processing
          void (async () => {
            for (const file of files) {
              ui.showToast(`处理图片 ${file.name}...`, 'info')
              const result = await processImageFile(file)
              const { from } = v.state.selection.main
              v.dispatch({
                changes: { from, insert: result.markdown },
                selection: { anchor: from + result.markdown.length },
              })
              const saved = result.originalSize - result.compressedSize
              ui.showToast(
                saved > 1024
                  ? `图片已插入 (${formatFileSize(result.originalSize)} → ${formatFileSize(result.compressedSize)}, 节省 ${formatFileSize(saved)})`
                  : `图片已插入 (${formatFileSize(result.compressedSize)})`,
                'success',
              )
            }
          })()
          return true
        },
        drop: (event, v) => {
          const files = getImageFilesFromDragDrop(event)
          if (files.length === 0) return false
          event.preventDefault()
          const pos = v.posAtCoords({ x: event.clientX, y: event.clientY })
          if (pos === null) return false
          // Fire and forget async image processing
          void (async () => {
            for (const file of files) {
              ui.showToast(`处理图片 ${file.name}...`, 'info')
              const result = await processImageFile(file)
              v.dispatch({
                changes: { from: pos, insert: result.markdown },
                selection: { anchor: pos + result.markdown.length },
              })
              ui.showToast(`图片已插入 (${formatFileSize(result.compressedSize)})`, 'success')
            }
          })()
          return true
        },
      }),
    ],
    parent: editorHost.value,
  })
  editorStore.editorView = view as unknown
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
  () => ui.colorMode,
  (mode) => {
    view?.dispatch({
      effects: colorModeCompartment.reconfigure(mode === 'dark' ? oneDark : []),
    })
  },
)
</script>

<template>
  <section
    v-bind="$attrs"
    class="workspace-panel animate-panel-1"
    aria-label="Markdown 编辑区"
  >
    <div class="panel-toolbar">
      <div class="panel-heading">
        <span class="panel-heading__icon"><AppIcon name="pen" :size="14" /></span>
        <strong class="panel-heading__label flex items-center gap-1.5">
          原稿
          <Transition name="fade">
            <span
              v-show="saveVisible"
              class="inline-flex items-center gap-0.5 text-[10px] text-text-tertiary"
            >
              <AppIcon v-if="saveLabel === '保存中...'" name="save" :size="11" />
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
  padding: 32px 24px 8px;
  background: var(--color-workspace);
  overflow: auto;
  display: flex;
  align-items: flex-start;
}

.editor-canvas {
  position: relative;
  min-width: 0;
  flex: 1 0 auto;
  min-height: calc(100dvh - 170px);
  background: var(--color-surface);
  border-radius: 2px;
  overflow: hidden;
  box-shadow: var(--shadow-canvas);
}

.editor-host {
  position: absolute;
  inset: 0;
}

div :deep(.cm-editor) {
  height: 100%;
  background: var(--color-surface);
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
  padding: 16px 20px 16px 20px;
}
div :deep(.cm-gutters) {
  border-right: 1px solid var(--color-border-subtle);
  background: var(--color-surface);
}
div :deep(.cm-lineNumbers) {
  color: var(--color-text-tertiary);
  font-size: 12px;
}

.editor-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.editor-action-button {
  min-width: 0;
  height: 28px;
  padding: 0 10px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: var(--color-text-tertiary);
  background: var(--color-bg);
  border: 1px solid var(--color-border-subtle);
  font-size: 10px;
  line-height: 1;
  font-weight: 650;
  transition:
    background 0.16s ease,
    color 0.16s ease,
    box-shadow 0.16s ease;
}

.editor-action-button--active {
  color: var(--color-text);
  background: var(--color-surface);
  box-shadow: var(--shadow-xs);
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
