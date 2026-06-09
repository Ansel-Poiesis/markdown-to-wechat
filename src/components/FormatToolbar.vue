<script setup lang="ts">
import { useEditorStore } from '@/stores/editor'

const editorStore = useEditorStore()

interface ToolbarAction {
  label: string
  title: string
  action: () => void
  className?: string
}

function getEditorView() {
  const view = editorStore.editorView as {
    state: { doc: { toString: () => string }; selection: { main: { from: number; to: number } } }
    dispatch: (spec: unknown) => void
  } | null
  if (!view?.state?.doc || !view.dispatch) return null
  return view
}

function wrapSelection(before: string, after: string) {
  const view = getEditorView()
  if (!view) return
  const doc = view.state.doc.toString()
  const { from, to } = view.state.selection.main
  const selected = doc.slice(from, to)

  // Toggle: if selection is already wrapped, unwrap
  if (
    selected.startsWith(before)
    && selected.endsWith(after)
    && selected.length > before.length + after.length
  ) {
    const inner = selected.slice(before.length, selected.length - after.length)
    view.dispatch({
      changes: { from, to, insert: inner },
      selection: { anchor: from, head: from + inner.length },
    })
    return
  }

  // Wrap
  const replacement = `${before}${selected || '文本'}${after}`
  view.dispatch({
    changes: { from, to, insert: replacement },
    selection: {
      anchor: from + before.length,
      head: from + before.length + (selected || '文本').length,
    },
  })
}

function insertAtLineStart(prefix: string) {
  const view = getEditorView()
  if (!view) return
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
    // For headings, replace existing heading prefix
    const headingMatch = line.match(/^#{1,6}\s/)
    if (headingMatch && prefix.startsWith('#')) {
      view.dispatch({
        changes: { from: lineStart, to: lineStart + headingMatch[0].length, insert: prefix },
      })
    } else {
      view.dispatch({
        changes: { from: lineStart, to: lineStart, insert: prefix },
      })
    }
  }
}

function insertBlock(text: string) {
  const view = getEditorView()
  if (!view) return
  const doc = view.state.doc.toString()
  const { from } = view.state.selection.main
  const insertText = doc.length === 0 || doc[from - 1] === '\n' ? text : `\n${text}`
  view.dispatch({
    changes: { from, to: from, insert: insertText },
    selection: { anchor: from + insertText.length },
  })
}

function insertLink() {
  const view = getEditorView()
  if (!view) return
  const doc = view.state.doc.toString()
  const { from, to } = view.state.selection.main
  const selected = doc.slice(from, to)
  const replacement = `[${selected || '链接文本'}](https://)`
  view.dispatch({
    changes: { from, to, insert: replacement },
    selection: {
      anchor: from + (selected ? selected.length + 3 : 1),
      head: from + (selected ? selected.length + 3 : 5),
    },
  })
}

function insertImage() {
  const view = getEditorView()
  if (!view) return
  const { from, to } = view.state.selection.main
  const replacement = `![图片描述](https://)`
  view.dispatch({
    changes: { from, to, insert: replacement },
    selection: { anchor: from + 2, head: from + 6 },
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
  const view = getEditorView()
  if (!view) return
  const doc = view.state.doc.toString()
  const { from, to } = view.state.selection.main
  const selected = doc.slice(from, to)
  const replacement = `\`\`\`\n${selected || '代码'}\n\`\`\``
  view.dispatch({
    changes: { from, to, insert: replacement },
    selection: { anchor: from + 4, head: from + 4 + (selected || '代码').length },
  })
}

const groups: { label: string; actions: ToolbarAction[] }[] = [
  {
    label: '格式',
    actions: [
      { label: 'B', title: '加粗 Ctrl+B', action: () => wrapSelection('**', '**'), className: 'font-black' },
      { label: 'I', title: '斜体 Ctrl+I', action: () => wrapSelection('*', '*'), className: 'italic' },
      { label: 'S', title: '删除线', action: () => wrapSelection('~~', '~~'), className: 'line-through opacity-80' },
      { label: 'H', title: '高亮', action: () => wrapSelection('==', '==') },
      { label: '<>', title: '行内代码 Ctrl+E', action: () => wrapSelection('`', '`') },
    ],
  },
  {
    label: '标题',
    actions: [
      { label: 'H1', title: '一级标题', action: () => insertAtLineStart('# ') },
      { label: 'H2', title: '二级标题', action: () => insertAtLineStart('## ') },
      { label: 'H3', title: '三级标题', action: () => insertAtLineStart('### ') },
    ],
  },
  {
    label: '列表',
    actions: [
      { label: '•', title: '无序列表', action: () => insertAtLineStart('- ') },
      { label: '1.', title: '有序列表', action: () => insertAtLineStart('1. ') },
      { label: '☑', title: '任务列表', action: () => insertAtLineStart('- [ ] ') },
    ],
  },
  {
    label: '插入',
    actions: [
      { label: '"', title: '引用', action: () => insertAtLineStart('> ') },
      { label: '{}', title: '代码块', action: insertCodeBlock },
      { label: '🔗', title: '链接', action: insertLink },
      { label: '🖼', title: '图片', action: insertImage },
      { label: '⊞', title: '表格', action: insertTable },
      { label: '—', title: '分割线', action: () => insertBlock('---\n') },
    ],
  },
]
</script>

<template>
  <div
    class="flex items-center gap-1 px-3 h-10 border-b border-border-subtle bg-surface/50 overflow-x-auto shrink-0"
  >
    <template v-for="(group, gi) in groups" :key="gi">
      <div v-if="gi > 0" class="w-px h-5 bg-border-subtle mx-0.5 shrink-0" />
      <div class="flex items-center gap-0.5">
        <button
          v-for="(item, ai) in group.actions"
          :key="ai"
          type="button"
          :title="item.title"
          class="w-7 h-7 flex items-center justify-center rounded-md text-text-tertiary hover:text-text hover:bg-surface-hover transition-all active:scale-90 shrink-0"
          @click="item.action"
        >
          <span class="text-[11px] font-bold leading-none select-none" :class="item.className">{{
            item.label
          }}</span>
        </button>
      </div>
    </template>
  </div>
</template>
