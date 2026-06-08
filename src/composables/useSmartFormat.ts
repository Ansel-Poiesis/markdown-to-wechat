/**
 * Smart markdown auto-formatting.
 *
 * Part 1 – run-once-on-paste: normalise punctuation, spacing, quotes.
 * Part 2 – called manually via shortcut: detect text worth bolding / quoting.
 */

/* ── helpers ─────────────────────────────────────────────── */

/** Straight → curly quotes (heuristic: word-boundary aware) */
function smartQuotes(s: string): string {
  // Double quotes: opening after whitespace/punctuation, closing before whitespace/punctuation
  s = s.replace(/(^|[\s"'（「『【《(])"/g, '$1\u201C')   // → "
  s = s.replace(/"([\s,.!?;:）」』】》)\u2014\u2026]|$)/g, '\u201D$1')  // → "
  // Single quotes / apostrophes
  s = s.replace(/(^|[\s"'（「『【《(])'/g, '$1\u2018')   // → '
  s = s.replace(/'([\s,.!?;:）」』】》)\u2014\u2026]|$)/g, '\u2019$1')  // → '
  return s
}

/* ── main formatter (paste / initial load) ───────────────── */

export function useSmartFormat() {
  function formatMarkdown(input: string): string {
    let s = input

    // --- CJK / ASCII spacing ---
    s = s.replace(/([\u4e00-\u9fff\u3000-\u303f\uff00-\uffef])([a-zA-Z0-9@#$%&])/g, '$1 $2')
    s = s.replace(/([a-zA-Z0-9@#$%&])([\u4e00-\u9fff\u3000-\u303f\uff00-\uffef])/g, '$1 $2')

    // --- Punctuation normalisation ---
    s = s.replace(/\.{3,}/g, '\u2026')           // ... → …
    s = s.replace(/([^-])--([^-])/g, '$1\u2014$2') // -- → — (em-dash)
    s = s.replace(/——/g, '\u2014\u2014')         // normalise existing em-dashes
    s = smartQuotes(s)

    // --- Whitespace cleanup ---
    s = s.replace(/\n{3,}/g, '\n\n')              // 3+ blank lines → 2

    // --- Ensure space after markers ---
    s = s.replace(/^(#{1,6})([^\s#])/gm, '$1 $2')  // #heading → # heading
    s = s.replace(/^([-+*])([-+*])(?![\s*+-])([^\s])/gm, '$1$2 $3') // handle **bold** edge
    s = s.replace(/^([-+])(?![-+*\s])([^\s])/gm, '$1 $2')   // -item → - item
    s = s.replace(/^(\d+\.)([^\s])/gm, '$1 $2')              // 1.item → 1. item

    return s
  }

  /* ── auto-bold / auto-quote (manual trigger) ────────────── */

  /**
   * Detect patterns worth emphasising and write markdown syntax.
   *
   * Rules:
   *  1. Chinese labels + colon → bold label
   *  2. "X 是/指/表示 Y" → bold term
   *  3. Chinese numbered lists (1、2、) → markdown lists (1. 2.)
   *  4. Short standalone lines → blockquote
   *  5. Very short title-like lines → H3 heading
   */
  function autoEmphasize(input: string): string {
    const lines = input.split('\n')
    const result: string[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? ''
      const trimmed = line.trim()

      // Skip already-formatted lines
      if (
        trimmed.startsWith('#') ||
        trimmed.startsWith('>') ||
        trimmed.startsWith('```') ||
        trimmed.startsWith('- ') ||
        trimmed.startsWith('* ') ||
        /^\d+\.\s/.test(trimmed)
      ) {
        result.push(line)
        continue
      }

      // Rule 1: Chinese label + colon → bold the label
      // Matches: 注意：xxx, 关键: xxx, 重要提示：xxx, etc.
      const labelMatch = trimmed.match(/^(注意|关键|提示|警告|说明|建议|总结|核心|重点|重要|小结|备注|提醒|注意了|重点是|关键在于|核心是)[:：]\s*(.+)/)
      if (labelMatch && !trimmed.startsWith('**')) {
        const [, label, content] = labelMatch
        const indent = line.match(/^(\s*)/)?.[1] ?? ''
        result.push(`${indent}**${label}：**${content}`)
        continue
      }

      // Rule 2: "X 是/指/表示/定义 Y" → bold X
      const defMatch = trimmed.match(/^([^\s,，。！？.!?]{2,20})\s+(是指|表示|定义为?|就是|即|叫做|称为|指的是)\s+(.+)/)
      if (defMatch && !trimmed.startsWith('**')) {
        const term = defMatch[1]!
        const verb = defMatch[2]!
        const rest = defMatch[3]!
        if (/[\u4e00-\u9fff]/.test(term)) {
          const indent = line.match(/^(\s*)/)?.[1] ?? ''
          result.push(`${indent}**${term}** ${verb} ${rest}`)
          continue
        }
      }

      // Rule 3: Chinese numbered lists: 1、xxx → 1. xxx
      const cnNumMatch = trimmed.match(/^(\d+)[、]\s*(.+)/)
      if (cnNumMatch) {
        const indent = line.match(/^(\s*)/)?.[1] ?? ''
        result.push(`${indent}${cnNumMatch[1]}. ${cnNumMatch[2]}`)
        continue
      }

      result.push(line)
    }

    // Second pass: blockquote and heading detection on standalone lines
    for (let i = 1; i < result.length - 1; i++) {
      const prev = result[i - 1]?.trim() ?? ''
      const curr = result[i]
      const next = result[i + 1]?.trim() ?? ''
      if (!curr) continue
      const currTrim = curr.trim()

      // Only process lines between blank lines
      if (prev !== '' || next !== '' || currTrim.length === 0) continue
      // Skip already-formatted
      if (/^[#>]|^```|^[-*+]|\*\*|^\d+\./.test(currTrim)) continue

      // Rule 5: Very short title-like line (2-15 chars, no punctuation) → H3
      if (
        currTrim.length >= 2 &&
        currTrim.length <= 15 &&
        !/[，。！？,.!?；;：:、]$/.test(currTrim) &&
        !/^\s/.test(curr) // no leading indent
      ) {
        result[i] = `### ${currTrim}`
        continue
      }

      // Rule 4: Short sentence (≤60 chars) → blockquote
      if (currTrim.length <= 60 && !currTrim.startsWith('>')) {
        result[i] = `> ${currTrim}`
      }
    }

    return result.join('\n')
  }

  return { formatMarkdown, autoEmphasize }
}
