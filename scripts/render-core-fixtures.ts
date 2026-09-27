import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { themes, codeThemes } from '../src/config/themes'
import { renderMarkdown } from '../src/utils/markdownRenderer'

// Compare the core only. Theme components and the HTML gate come from this checkout.
const fixtures = [
  {
    name: 'query_escaping',
    markdown: '[a](https://example.com?x=1&y=2)',
    check: (html: string) =>
      html.includes('href="https://example.com?x=1&amp;y=2"') && !html.includes('&amp;amp;'),
  },
  {
    name: 'inline_code_atomic',
    markdown: '`**literal** [a](https://example.com)`',
    check: (html: string) => !html.includes('<a ') && !html.includes('<strong'),
  },
  {
    name: 'code_footnote_retained',
    markdown: '```md\n[^a]: literal\n```',
    check: (html: string) =>
      html.replace(/&#160;|&nbsp;/g, ' ').includes('[^a]: literal') && !html.includes('注释'),
  },
  {
    name: 'long_fence_keeps_inner_fence',
    markdown: '````md\n```\n## literal\n````',
    check: (html: string) => !html.includes('<h2') && html.includes('```'),
  },
  {
    name: 'table_pipe_cells',
    markdown: '| a | b |\n| --- | --- |\n| a\\|b | `x|y` |',
    check: (html: string) => (html.match(/<td /g) || []).length === 2,
  },
  {
    name: 'ordered_start',
    markdown: '7. seventh\n8. eighth',
    check: (html: string) => html.includes('>07</span>') && html.includes('>08</span>'),
  },
  {
    name: 'url_delimiters_preserved',
    markdown: 'paragraph ![*a*](https://example.com/a__b__c.png)',
    check: (html: string) =>
      html.includes('alt="*a*"') && html.includes('src="https://example.com/a__b__c.png"'),
  },
]

const baselineIndex = process.argv.indexOf('--baseline')
const baseline = baselineIndex >= 0 ? process.argv[baselineIndex + 1] : undefined
let renderer = renderMarkdown
if (baseline) {
  if (!/^[a-f0-9]{7,40}$/i.test(baseline))
    throw new Error('Use a verified commit SHA for --baseline')
  const source = execFileSync('git', ['show', `${baseline}:src/utils/markdownRenderer.ts`], {
    encoding: 'utf8',
    windowsHide: true,
  })
  const temporary = mkdtempSync(join(tmpdir(), 'markdown-renderer-fixture-'))
  const path = join(temporary, 'renderer.ts')
  writeFileSync(path, source, 'utf8')
  renderer = (await import(pathToFileURL(path).href)).renderMarkdown
}

const rows = fixtures.map((fixture) => {
  const html = renderer(
    fixture.markdown,
    { ...themes.magazine!.base, designKey: 'qiuhe' },
    codeThemes.paper!,
    { linkMode: 'inline', leafify: false },
  )
  return { name: fixture.name, passed: fixture.check(html) }
})
const report = {
  baseline: baseline || 'working-tree',
  scope: 'Core parser comparison; current theme components and gate dependencies',
  rows,
}
const outputIndex = process.argv.indexOf('--output')
if (outputIndex >= 0 && process.argv[outputIndex + 1])
  writeFileSync(process.argv[outputIndex + 1]!, JSON.stringify(report, null, 2) + '\n', 'utf8')
console.log(JSON.stringify(report, null, 2))
if (!baseline && rows.some((row) => !row.passed)) process.exitCode = 1
