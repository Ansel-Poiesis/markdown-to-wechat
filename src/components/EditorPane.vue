<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { EditorView, basicSetup } from 'codemirror'
import { markdown } from '@codemirror/lang-markdown'
import { keymap } from '@codemirror/view'
import { useEditorStore } from '@/stores/editor'
import { useUiStore } from '@/stores/ui'
import { processImageFile, getImageFilesFromClipboard, getImageFilesFromDragDrop, formatFileSize } from '@/composables/useImageUpload'
import AppIcon from '@/components/ui/AppIcon.vue'
import FormatToolbar from '@/components/FormatToolbar.vue'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{
  'update:modelValue': [value: string]
  loadSample: []
  scroll: [ratio: number]
}>()

const editorHost = ref<HTMLDivElement>()
const editorStore = useEditorStore()
const ui = useUiStore()
let view: EditorView | null = null

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
    selection: { anchor: from + before.length, head: from + before.length + (selected || '文本').length },
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
      formatKeymap,
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
              ui.showToast(saved > 1024
                ? `图片已插入 (${formatFileSize(result.originalSize)} → ${formatFileSize(result.compressedSize)}, 节省 ${formatFileSize(saved)})`
                : `图片已插入 (${formatFileSize(result.compressedSize)})`, 'success')
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

watch(() => props.modelValue, (v) => {
  if (view && v !== view.state.doc.toString()) {
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: v },
    })
  }
})
</script>

<template>
  <section class="animate-panel-1 flex flex-col min-h-0 rounded-2xl bg-surface shadow-sm overflow-hidden border border-border-subtle dark:border dark:border-border" aria-label="Markdown 编辑区">
    <div class="flex items-center justify-between gap-3 h-11 px-4 shrink-0 text-[11px] font-semibold tracking-widest uppercase text-text-tertiary border-b border-border-subtle dark:border-border">
      <strong class="text-text-secondary font-semibold">Markdown</strong>
      <Transition name="fade">
        <span v-show="saveVisible" class="inline-flex items-center gap-1.5">
          <AppIcon v-if="saveLabel === '保存中...'" name="save" :size="12" />
          <AppIcon v-else name="checkCircle" :size="12" />
          {{ saveLabel }}
        </span>
      </Transition>
    </div>
    <FormatToolbar />
    <div class="flex-1 min-h-0 relative overflow-hidden">
      <div ref="editorHost" class="absolute inset-0 font-mono text-sm leading-relaxed"></div>
      <Transition name="fade">
        <div
          v-if="!modelValue"
          class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 text-text-tertiary select-none pointer-events-none"
        >
          <AppIcon name="fileText" :size="32" class="opacity-40" />
          <div class="text-center">
            <p class="text-[13px] font-medium text-text-secondary mb-1">粘贴 Markdown 或拖入图片开始排版</p>
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
  padding: 20px;
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
