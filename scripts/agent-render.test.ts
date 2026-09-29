import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  closeSync,
  existsSync,
  ftruncateSync,
  mkdtempSync,
  openSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, describe, expect, it, vi } from 'vitest'
import { inspectImageHeader, runAgentCli } from './agent-render'
import { parseAgentRequest } from '../src/agent/contract'
import { renderAgentArticle } from '../src/agent/render'
import * as renderer from '../src/services/wechatRenderer'

const cli = fileURLToPath(import.meta.resolve('tsx/cli'))
const directory = mkdtempSync(join(tmpdir(), 'markdown-agent-test-'))
if (!resolve(directory).startsWith(resolve(tmpdir()) + sep))
  throw new Error('Invalid test cleanup path')
afterAll(() => rmSync(directory, { recursive: true, force: true }))
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=',
  'base64',
)
function run(args: string[]) {
  const result = spawnSync(
    process.execPath,
    [cli, '--tsconfig', 'tsconfig.node.json', 'scripts/agent-render.ts', ...args],
    {
      cwd: process.cwd(),
      encoding: 'utf8',
      timeout: 15_000,
      maxBuffer: 20 * 1024 * 1024,
      windowsHide: true,
    },
  )
  expect(result.error).toBeUndefined()
  expect(result.stdout).not.toBe('')
  return { ...result, body: JSON.parse(result.stdout) }
}
function request(taskId: string, extra: Record<string, unknown> = {}) {
  const path = join(directory, `${taskId}.json`)
  writeFileSync(
    path,
    JSON.stringify({ schemaVersion: 1, taskId, markdown: '# 测试\n\n正文', ...extra }),
    { flag: 'wx' },
  )
  return path
}

describe('agent CLI process and integrity contract', { timeout: 30_000 }, () => {
  it('discovers capabilities and returns structured argument errors', () => {
    expect(run(['discover']).body.commands).toContain('attach-image')
    const invalid = run(['discover', '--request', 'ignored.json'])
    expect(invalid.status).toBe(1)
    expect(invalid.body).toMatchObject({ ok: false, error: { code: 'INVALID_ARGUMENT' } })
    expect(run(['render', '--unexpected']).status).toBe(1)
    expect(run(['validate', '--request', 'a.json', '--request', 'b.json']).body.error.code).toBe(
      'INVALID_ARGUMENT',
    )
  })

  it('reads UTF-8 Markdown relative to request and validates without writing jobs', () => {
    writeFileSync(join(directory, '中文.md'), '# 中文\n\n正文', { flag: 'wx' })
    const path = request('validate-01', { markdown: undefined, inputPath: '中文.md' })
    const result = run(['validate', '--request', path])
    expect(result.status).toBe(0)
    expect(result.body).toMatchObject({
      status: 'validated',
      request: { markdown: '# 中文\n\n正文' },
    })
    expect(existsSync(join(directory, 'validate-01'))).toBe(false)
    expect(result.body.scope).toContain('not checked')
  })

  it('writes complete manifest hashes and exactly shared core HTML, refuses reuse', () => {
    const path = request('html-01', { output: 'html', theme: 'yuebai', title: '标题' })
    const result = run(['render', '--request', path, '--output-root', directory])
    expect(result.status).toBe(0)
    expect(result.body.manifest).toMatchObject({
      status: 'rendered_needs_review',
      compatibility: { status: 'not_applicable' },
      publication: 'not_started',
    })
    const expected = renderAgentArticle(parseAgentRequest(readFileSync(path, 'utf8')))
    expect(readFileSync(join(result.body.jobDir, 'article.html'), 'utf8')).toBe(expected.document)
    for (const artifact of result.body.manifest.artifacts) {
      const buffer = readFileSync(join(result.body.jobDir, artifact.path))
      expect(buffer.length).toBe(artifact.bytes)
      expect(createHash('sha256').update(buffer).digest('hex')).toBe(artifact.sha256)
    }
    const again = run(['render', '--request', path, '--output-root', directory])
    expect(again.status).toBe(3)
    expect(again.body.error.code).toBe('JOB_EXISTS')
  })

  it('retains failure evidence and returns exit 2 when the renderer gate rejects HTML', () => {
    const path = request('gate-failure')
    const rendered = renderer.renderWechatMarkdown('# 原稿')
    const spy = vi
      .spyOn(renderer, 'renderWechatMarkdown')
      .mockReturnValue({
        ...rendered,
        valid: false,
        issues: [{ level: 'danger', text: 'Injected rejected HTML for gate regression' }],
      })
    try {
      const result = runAgentCli(['render', '--request', path, '--output-root', directory])
      expect(result).toMatchObject({
        ok: false,
        exitCode: 2,
        manifest: { status: 'compatibility_failed', compatibility: { status: 'failed' } },
      })
      expect(
        JSON.parse(readFileSync(join(directory, 'gate-failure', 'manifest.json'), 'utf8')).status,
      ).toBe('compatibility_failed')
    } finally {
      spy.mockRestore()
    }
  })

  it('rejects oversized files before allocating their contents and rejects invalid UTF-8', () => {
    const huge = join(directory, 'oversized.json')
    const fd = openSync(huge, 'wx')
    try {
      ftruncateSync(fd, 16 * 1024 * 1024 + 1)
    } finally {
      closeSync(fd)
    }
    expect(run(['validate', '--request', huge]).body.error.code).toBe('FILE_TOO_LARGE')
    const badUtf8 = join(directory, 'invalid-utf8.json')
    writeFileSync(badUtf8, Buffer.from([0xc3, 0x28]), { flag: 'wx' })
    expect(run(['validate', '--request', badUtf8]).body.error.code).toBe('INVALID_UTF8')
  })

  it.each([
    ['path-network', { markdown: undefined, inputPath: '\\\\server\\private.md' }],
    ['path-device', { markdown: undefined, inputPath: 'NUL.txt' }],
    ['path-stream', { markdown: undefined, inputPath: 'safe.md:secret' }],
    ['path-control', { markdown: undefined, inputPath: 'bad\n.md' }],
    ['path-secret', { markdown: undefined, inputPath: '.env' }],
    ['unknown-fields', { apiKey: 'unexpected' }],
    ['imagegen-limit', { output: 'imagegen-long', markdown: 'x'.repeat(4001) }],
    ['render-expansion', { markdown: '`x` '.repeat(25_000) }],
  ])('rejects unsafe paths, unknown fields and expansion before output: %s', (taskId, extra) => {
    const path = request(taskId as string, extra as Record<string, unknown>)
    const result = run(['render', '--request', path, '--output-root', directory])
    expect(result.status).toBe(1)
    expect(result.body.ok).toBe(false)
    expect(existsSync(join(directory, taskId as string))).toBe(false)
  })

  it('attaches a real image file with hash receipt and never upgrades human review', () => {
    const path = request('image-01', { output: 'imagegen-long' })
    const rendered = run(['render', '--request', path, '--output-root', directory])
    expect(rendered.body.manifest.status).toBe('waiting_for_imagegen')
    const imagePath = join(directory, 'actual.png')
    writeFileSync(imagePath, png, { flag: 'wx' })
    const originalManifest = readFileSync(join(rendered.body.jobDir, 'manifest.json'), 'utf8')
    const result = run(['attach-image', '--job-dir', rendered.body.jobDir, '--image', imagePath])
    expect(result.status).toBe(0)
    expect(result.body.receipt).toMatchObject({
      status: 'needs_review',
      textFidelity: 'unverified',
      humanReview: 'required',
      publication: 'not_started',
      image: { format: 'png', width: 1, height: 1 },
    })
    expect(result.body.receipt.image.sha256).toBe(createHash('sha256').update(png).digest('hex'))
    expect(readFileSync(join(rendered.body.jobDir, 'manifest.json'), 'utf8')).toBe(originalManifest)
    expect(
      run(['attach-image', '--job-dir', rendered.body.jobDir, '--image', imagePath]).status,
    ).toBe(3)
  })

  it('rejects changed source artifacts and malicious manifest paths before attachment', () => {
    const path = request('tamper-01', { output: 'imagegen-long' })
    const result = run(['render', '--request', path, '--output-root', directory])
    writeFileSync(join(result.body.jobDir, 'article.md'), 'changed')
    const corrupted = run([
      'attach-image',
      '--job-dir',
      result.body.jobDir,
      '--image',
      join(directory, 'actual.png'),
    ])
    expect(corrupted.status).toBe(4)
    expect(corrupted.body.error.code).toBe('INTEGRITY_FAILED')
    const manifestPath = join(result.body.jobDir, 'manifest.json')
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
    manifest.artifacts[0].path = '../actual.png'
    writeFileSync(manifestPath, JSON.stringify(manifest))
    expect(
      run([
        'attach-image',
        '--job-dir',
        result.body.jobDir,
        '--image',
        join(directory, 'actual.png'),
      ]).status,
    ).toBe(4)
    expect(existsSync(join(result.body.jobDir, 'image-attachment'))).toBe(false)
  })

  it('rejects fake/truncated images and unreasonable dimensions', () => {
    expect(inspectImageHeader(png)).toMatchObject({ format: 'png', width: 1, height: 1 })
    expect(() => inspectImageHeader(Buffer.from('<svg onload="alert(1)"></svg>'))).toThrow(
      '图片必须',
    )
    expect(() => inspectImageHeader(png.subarray(0, 40))).toThrow('图片必须')
    const bomb = Buffer.from(png)
    bomb.writeUInt32BE(100_000, 16)
    expect(() => inspectImageHeader(bomb)).toThrow('图片必须')
  })

  it('reads JPEG/WebP dimensions and rejects malformed container lengths', () => {
    // Minimal structural fixtures exercise headers only, not a full image decoder.
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xc0, 0, 8, 8, 0, 2, 0, 3, 1, 0xff, 0xda, 0, 6, 1, 1, 0, 0, 1, 0xff, 0xd9])
    expect(inspectImageHeader(jpeg)).toMatchObject({ format: 'jpeg', width: 3, height: 2 })
    const webp = Buffer.alloc(30)
    webp.write('RIFF', 0)
    webp.writeUInt32LE(22, 4)
    webp.write('WEBPVP8 ', 8)
    webp.writeUInt32LE(10, 16)
    Buffer.from([0x9d, 0x01, 0x2a]).copy(webp, 23)
    webp.writeUInt16LE(3, 26)
    webp.writeUInt16LE(2, 28)
    expect(inspectImageHeader(webp)).toMatchObject({ format: 'webp', width: 3, height: 2 })
    webp.writeUInt32LE(100, 16)
    expect(() => inspectImageHeader(webp)).toThrow('图片必须')
    const malformedJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xda, 0xff, 0xd9])
    expect(() => inspectImageHeader(malformedJpeg)).toThrow('图片必须')
  })
})
