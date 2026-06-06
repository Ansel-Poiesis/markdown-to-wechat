<script setup lang="ts">
import { useEditorStore } from '@/stores/editor'
import AppIcon from '@/components/ui/AppIcon.vue'

const editorStore = useEditorStore()

interface ToolbarAction {
  icon: string
  title: string
  action: () => void
  divider?: boolean
}

function wrapSelection(before: string, after: string) {
  const view = editorStore.editorView as {
    state?: { doc: { toString: () => string }; selection: { main: { from: number; to: number } } }
    dispatch?: (spec: unknown) => void
  } | null
  if (!view?.state?.doc || !view.dispatch) return
  const doc = view.state.doc.toString()
  const { from, to } = view.state.selection.main
  const selected = doc.slice(from, to)
  const replacement = `${before}${selected || '文本'}${after}`
  view.dispatch({
    changes: { from, to, insert: replacement },
    selection: { anchor: from + before.length, anchorEnd: from + before.length + (selected || '文本').length },
  })
}

function insertAtLineStart(prefix: string) {
  const view = editorStore.editorView as {
    state?: { doc: { toString: () => string }; selection: { main: { from: number } } }
    dispatch?: (spec: unknown) => void
  } | null
  if (!view?.state?.doc || !view.dispatch) return
  const doc = view.state.doc.toString()
  const { from } = view.state.selection.main
  const lineStart = doc.lastIndexOf('\n', from - 1) + 1
  const lineEnd = doc.indexOf('\n', from)
  const line = doc.slice(lineStart, lineEnd === -1 ? undefined : lineEnd)

  // Toggle: if already has prefix, remove it
  if (line.startsWith(prefix)) {
    view.dispatch({
      changes: { from: lineStart, to: lineStart + prefix.length, insert: '' },
    })
  } else {
    view.dispatch({
      changes: { from: lineStart, to: lineStart, insert: prefix },
    })
  }
}

function insertBlock(text: string) {
  const view = editorStore.editorView as {
    state?: { doc: { toString: () => string }; selection: { main: { from: number } } }
    dispatch?: (spec: unknown) => void
  } | null
  if (!view?.state?.doc || !view.dispatch) return
  const doc = view.state.doc.toString()
  const { from } = view.state.selection.main
  const insertText = doc.length === 0 || doc[from - 1] === '\n' ? text : `\n${text}`
  view.dispatch({
    changes: { from, to: from, insert: insertText },
    selection: { anchor: from + insertText.length },
  })
}

function insertLink() {
  const view = editorStore.editorView as {
    state?: { doc: { toString: () => string }; selection: { main: { from: number; to: number } } }
    dispatch?: (spec: unknown) => void
  } | null
  if (!view?.state?.doc || !view.dispatch) return
  const doc = view.state.doc.toString()
  const { from, to } = view.state.selection.main
  const selected = doc.slice(from, to)
  const replacement = `[${selected || '链接文本'}](https://)`
  view.dispatch({
    changes: { from, to, insert: replacement },
    selection: {
      anchor: from + (selected ? selected.length + 3 : 5),
      anchorEnd: from + replacement.length - 1,
    },
  })
}

function insertImage() {
  const view = editorStore.editorView as {
    state?: { doc: { toString: () => string }; selection: { main: { from: number; to: number } } }
    dispatch?: (spec: unknown) => void
  } | null
  if (!view?.state?.doc || !view.dispatch) return
  const doc = view.state.doc.toString()
  const { from, to } = view.state.selection.main
  const replacement = `![图片描述](https://)`
  view.dispatch({
    changes: { from, to, insert: replacement },
    selection: { anchor: from + 17, anchorEnd: from + replacement.length - 1 },
  })
}

function insertTable() {
  const table = `| 列1 | 列2 | 列3 |
| --- | --- | --- |
| 内容 | 内容 | 内容 |
`
  insertBlock(table)
}

function insertCodeBlock() {
  const view = editorStore.editorView as {
    state?: { doc: { toString: () => string }; selection: { main: { from: number; to: number } } }
    dispatch?: (spec: unknown) => void
  } | null
  if (!view?.state?.doc || !view.dispatch) return
  const doc = view.state.doc.toString()
  const { from, to } = view.state.selection.main
  const selected = doc.slice(from, to)
  const replacement = `\`\`\`\n${selected || '代码'}\n\`\`\``
  view.dispatch({
    changes: { from, to, insert: replacement },
    selection: { anchor: from + 4, anchorEnd: from + 4 + (selected || '代码').length },
  })
}

const actions: ToolbarAction[] = [
  { icon: 'bold', title: '加粗 (Ctrl+B)', action: () => wrapSelection('**', '**') },
  { icon: 'italic', title: '斜体 (Ctrl+I)', action: () => wrapSelection('*', '*') },
  { icon: 'strikethrough', title: '删除线', action: () => wrapSelection('~~', '~~') },
  { icon: 'highlight', title: '高亮', action: () => wrapSelection('==', '==') },
  { icon: 'code', title: '行内代码', action: () => wrapSelection('`', '`') },
  { icon: 'divider', title: '', action: () => {}, divider: true },
  { icon: 'h1', title: '一级标题', action: () => insertAtLineStart('# ') },
  { icon: 'h2', title: '二级标题', action: () => insertAtLineStart('## ') },
  { icon: 'h3', title: '三级标题', action: () => insertAtLineStart('### ') },
  { icon: 'divider', title: '', action: () => {}, divider: true },
  { icon: 'list', title: '无序列表', action: () => insertAtLineStart('- ') },
  { icon: 'orderedList', title: '有序列表', action: () => insertAtLineStart('1. ') },
  { icon: 'task', title: '任务列表', action: () => insertAtLineStart('- [ ] ') },
  { icon: 'divider', title: '', action: () => {}, divider: true },
  { icon: 'quote', title: '引用', action: () => insertAtLineStart('> ') },
  { icon: 'codeBlock', title: '代码块', action: insertCodeBlock },
  { icon: 'link', title: '链接', action: insertLink },
  { icon: 'image', title: '图片', action: insertImage },
  { icon: 'table', title: '表格', action: insertTable },
  { icon: 'hr', title: '分割线', action: () => insertBlock('---\n') },
]
</script>

<template>
  <div class="flex items-center gap-0.5 px-2 h-9 border-b border-border-subtle dark:border-border overflow-x-auto shrink-0">
    <template v-for="(item, i) in actions" :key="i">
      <div v-if="item.divider" class="w-px h-4 bg-border mx-1 shrink-0" />
      <button
        v-else
        type="button"
        :title="item.title"
        class="w-7 h-7 flex items-center justify-center rounded-md text-text-tertiary hover:text-text hover:bg-surface-hover transition-all active:scale-90 shrink-0"
        @click="item.action"
      >
        <span class="text-[11px] font-bold leading-none">{{ getLabel(item.icon) }}</span>
      </button>
    </template>
  </div>
</template>

<script lang="ts">
function getLabel(icon: string): string {
  const labels: Record<string, string> = {
    bold: 'B',
    italic: 'I',
    strikethrough: 'S',
    highlight: 'H',
    code: '<>',
    h1: 'H1',
    h2: 'H2',
    h3: 'H3',
    list: '•',
    orderedList: '1.',
    task: '☑',
    quote: '"',
    codeBlock: '{ }',
    link: '🔗',
    image: '🖼',
    table: '⊞',
    hr: '—',
  }
  return labels[icon] || icon
}
</script>
