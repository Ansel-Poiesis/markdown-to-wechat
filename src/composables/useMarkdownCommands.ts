/**
 * CodeMirror 6 keymap for smart markdown editing:
 * - List continuation (-, *, +, 1.) on Enter
 * - Blockquote continuation (>) on Enter
 * - Empty item removal on Backspace
 */
import { keymap } from '@codemirror/view'
import type { EditorView } from '@codemirror/view'
import { Prec } from '@codemirror/state'

// Match list prefix: optional indentation + marker + trailing spaces
// Supports: -, *, +, 1., - [ ], - [x]
const LIST_RE = /^(\s*)([-*+]|\d+\.)\s+/
// Match task list prefix specifically
const TASK_RE = /^(\s*)([-*+])\s+\[([ xX])]\s*/

function getLinePrefix(text: string): string {
  return text.match(LIST_RE)?.[0] ?? ''
}

function isTaskItem(text: string): boolean {
  return TASK_RE.test(text)
}

/**
 * Continue list on Enter:
 * - Non-empty item → new line with same marker (task: unchecked)
 * - Empty item (only marker) → remove marker
 */
function enterInList(view: EditorView): boolean {
  const { state } = view
  const pos = state.selection.main.head
  const line = state.doc.lineAt(pos)
  const text = line.text

  // Only handle if there's a list prefix and cursor is NOT before the prefix end
  const match = text.match(LIST_RE)
  if (!match) return false

  const prefixEnd = line.from + match[0].length
  if (pos < prefixEnd) return false

  // Cursor after text like `- ` → continue list
  const contentAfterPrefix = text.slice(match[0].length)

  if (contentAfterPrefix.trim() === '') {
    // Empty list item → delete the whole line
    view.dispatch({
      changes: { from: line.from, to: line.to },
      selection: { anchor: line.from },
    })
  } else {
    // Non-empty → continue with same prefix
    let newPrefix = match[0]
    // Task list: always uncheck on new line
    if (isTaskItem(text)) {
      const taskMatch = text.match(TASK_RE)
      if (taskMatch) {
        newPrefix = `${taskMatch[1]}${taskMatch[2]} [ ] `
      }
    }
    view.dispatch({
      changes: { from: pos, insert: `\n${newPrefix}` },
      selection: { anchor: pos + 1 + newPrefix.length },
    })
  }
  return true
}

/**
 * Continue blockquote on Enter:
 * - Non-empty quote → new line with same prefix
 * - Empty quote (only ">") → remove prefix
 */
function enterInBlockquote(view: EditorView): boolean {
  const { state } = view
  const pos = state.selection.main.head
  const line = state.doc.lineAt(pos)
  const text = line.text

  // Match: optional whitespace + one or more ">" + optional trailing space
  const match = text.match(/^(\s*(?:>\s*)+)/)
  if (!match) return false

  const prefixEnd = line.from + match[0].length
  if (pos < prefixEnd) return false

  const contentAfterPrefix = text.slice(match[0].length)

  if (contentAfterPrefix.trim() === '') {
    // Empty blockquote line → delete the prefix
    view.dispatch({
      changes: { from: line.from, to: line.to },
      selection: { anchor: line.from },
    })
  } else {
    // Continue with same prefix
    const prefix = match[0]
    view.dispatch({
      changes: { from: pos, insert: `\n${prefix}` },
      selection: { anchor: pos + 1 + prefix.length },
    })
  }
  return true
}

/**
 * Combined Enter handler: try list first, then blockquote
 */
function enterHandler(view: EditorView): boolean {
  return enterInList(view) || enterInBlockquote(view)
}

/**
 * High-priority keymap for markdown editing.
 * Uses Prec.high so it runs before standardKeymap's Enter handling.
 */
export function markdownCommandsKeymap() {
  return Prec.high(keymap.of([
    { key: 'Enter', run: enterHandler },
  ]))
}
