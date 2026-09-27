import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { renderWechatMarkdown } from '../src/services/wechatRenderer'
import { MarkdownRenderLimitError } from '../src/utils/markdownRenderer'

const scenarios: Record<string, () => string> = {
  prose_10k: () => '普通段落包含文字与标点。'.repeat(834),
  prose_100k: () => '普通段落包含文字与标点。'.repeat(8334),
  prose_1m: () => '普通段落包含文字与标点。'.repeat(83334),
  links_100: () =>
    Array.from({ length: 100 }, (_, i) => `[link ${i}](https://example.com/${i}?x=1&y=2)`).join(
      ' ',
    ),
  links_1000: () =>
    Array.from({ length: 1000 }, (_, i) => `[link ${i}](https://example.com/${i}?x=1&y=2)`).join(
      ' ',
    ),
  links_5000: () =>
    Array.from({ length: 5000 }, (_, i) => `[link ${i}](https://example.com/${i}?x=1&y=2)`).join(
      ' ',
    ),
  brackets_200k: () => '[a]('.repeat(50000),
  heading_brackets_200k: () => '# ' + '['.repeat(200000),
  backticks_200k: () => '`a'.repeat(100000),
  comments_200k: () => '```js\n' + '/*x'.repeat(66667) + '\n```',
  nested_lists_64: () =>
    Array.from({ length: 64 }, (_, i) => ' '.repeat(i * 2) + '- item').join('\n'),
  nested_lists_256: () =>
    Array.from({ length: 256 }, (_, i) => ' '.repeat(i * 2) + '- item').join('\n'),
  nested_lists_512: () =>
    Array.from({ length: 512 }, (_, i) => ' '.repeat(i * 2) + '- item').join('\n'),
  quote_20000: () => '>'.repeat(20000) + ' tail',
  table_5000: () => '| one | two |\n| --- | --- |\n' + '| a\\|b | `x|y` |\n'.repeat(5000),
  table_4000: () => '| one | two |\n| --- | --- |\n' + '| a\\|b | `x|y` |\n'.repeat(4000),
  html_expansion: () => '<'.repeat(1100000),
  source_over_budget: () => 'x'.repeat(2 * 1024 * 1024 + 1),
  list_over_budget: () => '- item\n'.repeat(25000),
  emphasis_over_budget: () => '**bold** '.repeat(25000),
  lines_over_budget: () => '\n'.repeat(50000),
  table_padding_over_budget: () =>
    'a | '.repeat(2000) + '\n' + '--- | '.repeat(2000) + '\n' + 'x |\n'.repeat(10000),
}
const expectedRejections = new Set([
  'backticks_200k',
  'table_5000',
  'html_expansion',
  'source_over_budget',
  'list_over_budget',
  'emphasis_over_budget',
  'lines_over_budget',
  'table_padding_over_budget',
])

const caseIndex = process.argv.indexOf('--case')
if (caseIndex >= 0) {
  const name = process.argv[caseIndex + 1] || ''
  const input = scenarios[name]?.()
  if (input === undefined) throw new Error(`Unknown scenario: ${name}`)
  // Warm imports and JIT separately from the measured input; this is not a browser latency claim.
  renderWechatMarkdown('warmup')
  const before = process.memoryUsage()
  const start = performance.now()
  let result: ReturnType<typeof renderWechatMarkdown> | undefined
  let rejection: string | undefined
  try {
    result = renderWechatMarkdown(input)
  } catch (error) {
    if (!(error instanceof MarkdownRenderLimitError)) throw error
    rejection = error.message
  }
  const elapsedMs = performance.now() - start
  const after = process.memoryUsage()
  process.stdout.write(
    JSON.stringify({
      name,
      inputChars: input.length,
      inputBytes: Buffer.byteLength(input),
      outputBytes: result ? Buffer.byteLength(result.html) : 0,
      elapsedMs: Math.round(elapsedMs * 100) / 100,
      heapBeforeMiB: Math.round(before.heapUsed / 10485.76) / 100,
      heapAfterMiB: Math.round(after.heapUsed / 10485.76) / 100,
      rssAfterMiB: Math.round(after.rss / 10485.76) / 100,
      valid: result?.valid ?? false,
      issueCount: result?.issues.length ?? 0,
      status: rejection ? 'budget_rejected' : 'rendered',
      rejection,
      passed: expectedRejections.has(name) ? !!rejection : !!result?.valid,
    }),
  )
} else {
  const rows: unknown[] = []
  let failed = false
  for (const name of Object.keys(scenarios)) {
    try {
      const output = execFileSync(
        process.execPath,
        [
          '--max-old-space-size=384',
          '--import',
          'tsx',
          fileURLToPath(import.meta.url),
          '--case',
          name,
        ],
        {
          cwd: process.cwd(),
          env: { ...process.env, TSX_TSCONFIG_PATH: 'tsconfig.node.json' },
          timeout: 15000,
          maxBuffer: 1024 * 1024,
          encoding: 'utf8',
          windowsHide: true,
        },
      )
      const row = JSON.parse(output)
      rows.push(row)
      if (!row.passed) failed = true
      console.log(JSON.stringify(row))
    } catch (error) {
      failed = true
      const row = {
        name,
        error: error instanceof Error ? error.message.slice(0, 1000) : String(error),
      }
      rows.push(row)
      console.log(JSON.stringify(row))
    }
  }
  const report = {
    node: process.version,
    platform: `${process.platform}/${process.arch}`,
    limit: { perCaseTimeoutMs: 15000, childHeapMiB: 384 },
    measuredAt: new Date().toISOString(),
    rows,
  }
  const outputIndex = process.argv.indexOf('--output')
  if (outputIndex >= 0 && process.argv[outputIndex + 1])
    writeFileSync(process.argv[outputIndex + 1]!, JSON.stringify(report, null, 2) + '\n', 'utf8')
  if (failed) process.exitCode = 1
}
