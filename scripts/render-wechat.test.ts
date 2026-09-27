import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { renderWechatMarkdown } from '../src/services/wechatRenderer'

const cli = fileURLToPath(import.meta.resolve('tsx/cli'))
function run(args: string[], input = '# 测试\n\n正文') {
  return spawnSync(process.execPath, [cli, '--tsconfig', 'tsconfig.node.json', 'scripts/render-wechat.ts', ...args], {
    cwd: process.cwd(), input, encoding: 'utf8', timeout: 10_000,
    maxBuffer: 12 * 1024 * 1024, windowsHide: true,
  })
}

describe('render CLI process contract', () => {
  it('renders stdin with exactly the shared core output', () => {
    const markdown = '# 合同\n\n`**literal**` 与 [链接](https://example.com/?a=1&b=2)'
    const result = run(['--format', 'json'], markdown)
    expect(result.error).toBeUndefined()
    expect(result.status).toBe(0)
    expect(JSON.parse(result.stdout)).toEqual(renderWechatMarkdown(markdown))
  })

  it('rejects invalid parameters on stderr with no success output', () => {
    const result = run(['--font-size', 'NaN'])
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('font-size 必须是数字')
    expect(result.stdout).toBe('')
  })

  it('exports a generic document to a UTF-8 path and escapes the title', () => {
    const directory = mkdtempSync(join(tmpdir(), 'wechat-cli-test-'))
    if (!resolve(directory).startsWith(resolve(tmpdir()) + sep)) throw new Error('Invalid cleanup path')
    try {
      const output = join(directory, '中文文章.html')
      const result = run(['--profile', 'generic', '--format', 'document', '--title', '<标题>', '--output', output], '[链接](https://example.com)')
      expect(result.status).toBe(0)
      const html = readFileSync(output, 'utf8')
      expect(html).toContain('<title>&lt;标题&gt;</title>')
      expect(html).toContain('href="https://example.com"')
      expect(html).not.toContain('leaf=')
    } finally {
      // This test owns precisely this mkdtemp directory, never a caller-provided path.
      rmSync(directory, { recursive: true, force: true })
    }
  })

  it('fails safely on adversarial token expansion without emitting partial HTML', () => {
    const result = run([], '`x` '.repeat(25_000))
    expect(result.status).toBe(1)
    expect(result.stdout).toBe('')
    expect(result.stderr).toContain('渲染失败')
  })
})
