<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { EditorView, basicSetup } from 'codemirror'
import { markdown } from '@codemirror/lang-markdown'
import { keymap } from '@codemirror/view'
import { markdownCommandsKeymap } from '@/composables/useMarkdownCommands'
import { useSmartFormat } from '@/composables/useSmartFormat'
import { mimoFormatStream } from '@/composables/useMimoStream'
import { useEditorStore } from '@/stores/editor'
import { useUiStore } from '@/stores/ui'
import {
  processImageFile,
  getImageFilesFromClipboard,
  getImageFilesFromDragDrop,
  formatFileSize,
} from '@/composables/useImageUpload'
import AppIcon from '@/components/ui/AppIcon.vue'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{
  'update:modelValue': [value: string]
  loadSample: []
  scroll: [ratio: number]
}>()

const editorHost = ref<HTMLDivElement>()
const editorStore = useEditorStore()
const ui = useUiStore()
const { formatMarkdown } = useSmartFormat()
let view: EditorView | null = null

// Track which format mode is active for toggle styling
const formatMode = ref<'none' | 'pure' | 'format'>('none')
const formatLoading = ref(false)
let formatJustApplied = false
let formatAbort: AbortController | null = null

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

async function handleAutoFormat() {
  if (formatLoading.value) {
    // Cancel ongoing request
    formatAbort?.abort()
    formatLoading.value = false
    return
  }
  formatLoading.value = true
  formatAbort = new AbortController()
  try {
    await mimoFormatStream(props.modelValue, {
      signal: formatAbort.signal,
      onChunk: (text) => {
        // Progressive update — user sees results streaming in
        formatJustApplied = true
        emit('update:modelValue', text)
      },
    })
    formatMode.value = 'format'
    ui.showToast('已自动排版', 'success')
  } catch (e: unknown) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      ui.showToast('已取消排版', 'info')
      return
    }
    const msg = e instanceof Error ? e.message : '排版服务异常'
    ui.showToast(msg, 'error')
  } finally {
    formatLoading.value = false
    formatAbort = null
  }
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
</script>

<template>
  <section
    class="animate-panel-1 flex flex-col min-h-0 rounded-2xl bg-surface shadow-sm overflow-hidden border border-border-subtle dark:border dark:border-border"
    aria-label="Markdown 编辑区"
  >
    <div
      class="flex items-center justify-between gap-3 h-11 px-4 shrink-0 text-[11px] font-semibold tracking-widest uppercase text-text-tertiary border-b border-border-subtle dark:border-border"
    >
      <strong class="text-text-secondary font-semibold flex items-center gap-1.5">
        文本
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
      <div class="flex items-center gap-0.5 bg-bg rounded-lg p-0.5">
        <button
          type="button"
          class="flex items-center gap-1 h-6 px-2 rounded-md text-[10px] font-medium transition-all active:scale-95"
          :class="
            formatMode === 'pure'
              ? 'bg-surface text-text shadow-sm font-semibold'
              : 'text-text-tertiary hover:text-text'
          "
          title="清除所有 Markdown 格式，仅保留纯文本"
          @click="handlePure"
        >
          纯净
        </button>
        <button
          type="button"
          class="flex items-center gap-1 h-6 px-2 rounded-md text-[10px] font-medium transition-all active:scale-95"
          :class="[
            formatMode === 'format'
              ? 'bg-surface text-text shadow-sm font-semibold'
              : 'text-text-tertiary hover:text-text',
            formatLoading && 'opacity-60 cursor-wait',
          ]"
          :disabled="formatLoading"
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
          {{ formatLoading ? '取消' : '排版' }}
        </button>
      </div>
    </div>
    <div class="flex-1 min-h-0 relative overflow-hidden">
      <div ref="editorHost" class="absolute inset-0 font-mono text-sm leading-relaxed"></div>
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
              加载示例内容
            </button>
          </div>
        </div>
      </Transition>
    </div>
  </section>
</template>

<style scoped>
div :deep(.cm-editor) {
  height: 100%;
  background: var(--color-surface);
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

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
