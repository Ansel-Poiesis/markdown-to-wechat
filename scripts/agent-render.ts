import { createHash } from 'node:crypto'
import {
  closeSync,
  fstatSync,
  lstatSync,
  mkdirSync,
  openSync,
  readSync,
  realpathSync,
  writeFileSync,
} from 'node:fs'
import { basename, dirname, extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import {
  AgentContractError,
  discoverAgentCapabilities,
  isAgentTaskId,
  parseAgentRequest,
  validateAgentRequest,
  type AgentRenderRequest,
} from '../src/agent/contract'
import { renderAgentArticle } from '../src/agent/render'

const REQUEST_MAX_BYTES = 16 * 1024 * 1024
const SOURCE_MAX_BYTES = 8 * 1024 * 1024
const ARTIFACT_MAX_BYTES = 24 * 1024 * 1024
const IMAGE_MAX_BYTES = 50 * 1024 * 1024
const sha256 = (data: string | Buffer) => createHash('sha256').update(data).digest('hex')
const json = (value: unknown) => JSON.stringify(value, null, 2) + '\n'

class AgentCliError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly exitCode = 1,
  ) {
    super(message)
  }
}

function localPath(value: string): string {
  for (let index = 0; index < value.length; index++) {
    if (value.charCodeAt(index) < 32) throw new AgentCliError('UNSAFE_PATH', '本地路径不能含控制字符')
  }
  if (
    !value ||
    value.length > 4096 ||
    /[<>"|?*]/.test(value) ||
    /^[\\/]{2}/.test(value) ||
    /:/.test(value.replace(/^[A-Za-z]:[\\/]/, ''))
  ) {
    throw new AgentCliError(
      'UNSAFE_PATH',
      '仅接受普通本地路径，不接受网络、设备、URL、ADS 或控制字符路径',
    )
  }
  for (const part of value.split(/[\\/]/)) {
    if (
      part !== '.' &&
      part !== '..' &&
      (/[. ]$/.test(part) || /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(?:\.|$)/i.test(part))
    ) {
      throw new AgentCliError('UNSAFE_PATH', '路径包含系统保留名称或不确定的尾缀')
    }
  }
  return value
}

/** Allocate only after stat, then bounded reads: concurrent growth cannot bypass the cap. */
function readBounded(path: string, maximum: number): Buffer {
  const entry = lstatSync(path)
  if (entry.isSymbolicLink() || !entry.isFile())
    throw new AgentCliError('UNSAFE_PATH', '只接受普通文件，不接受符号链接或设备')
  const fd = openSync(path, 'r')
  try {
    const stat = fstatSync(fd)
    if (!stat.isFile() || stat.size > maximum)
      throw new AgentCliError('FILE_TOO_LARGE', `文件必须是最多 ${maximum} 字节的普通文件`)
    const buffer = Buffer.alloc(stat.size + 1)
    let length = 0
    while (length < buffer.length) {
      const count = readSync(fd, buffer, length, buffer.length - length, null)
      if (!count) break
      length += count
    }
    const after = fstatSync(fd)
    if (length !== stat.size || after.size !== stat.size || after.mtimeMs !== stat.mtimeMs)
      throw new AgentCliError('FILE_CHANGED', '读取时文件发生变化，请重试')
    return buffer.subarray(0, length)
  } finally {
    closeSync(fd)
  }
}

function readUtf8(path: string, maximum: number): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(readBounded(path, maximum))
  } catch (error) {
    if (error instanceof TypeError)
      throw new AgentCliError('INVALID_UTF8', '输入必须是有效 UTF-8 文件')
    throw error
  }
}

function loadRequest(pathValue: string): AgentRenderRequest {
  const path = resolve(localPath(pathValue))
  if (extname(path).toLowerCase() !== '.json')
    throw new AgentCliError('INVALID_REQUEST_PATH', '请求文件必须是 .json')
  const request = parseAgentRequest(readUtf8(path, REQUEST_MAX_BYTES), 'cli')
  if (request.inputPath === undefined) return request
  const input = resolve(dirname(path), localPath(request.inputPath))
  if (!['.md', '.markdown', '.txt'].includes(extname(input).toLowerCase()))
    throw new AgentCliError('INVALID_SOURCE_PATH', 'inputPath 仅接受 .md / .markdown / .txt 文件')
  const { inputPath: _inputPath, ...rest } = request
  return validateAgentRequest({ ...rest, markdown: readUtf8(input, SOURCE_MAX_BYTES) }, 'browser')
}

interface Artifact {
  path: string
  sha256: string
  bytes: number
}

function createJob(request: AgentRenderRequest, outputRoot: string) {
  // Render before writing: input/expansion errors leave no misleading partial job.
  const result = renderAgentArticle(request)
  const files: Record<string, string> = {
    'article.md': request.markdown!,
    'request.json': json(result.request),
    'article.fragment.html': result.rendered.html,
    'article.html': result.document,
    'render.json': json(result.rendered),
    'compatibility.json': json(result.compatibility),
  }
  if (result.imagegen) {
    files['imagegen-task.json'] = json(result.imagegen)
    files['imagegen-prompt.txt'] = result.imagegen.prompt
  }
  const root = resolve(localPath(outputRoot))
  mkdirSync(root, { recursive: true })
  if (lstatSync(root).isSymbolicLink())
    throw new AgentCliError('UNSAFE_PATH', 'output-root 不能是符号链接')
  const jobDir = join(realpathSync(root), request.taskId)
  try {
    mkdirSync(jobDir)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST')
      throw new AgentCliError('JOB_EXISTS', '任务目录已存在；请使用新 taskId，不会覆盖原任务', 3)
    throw error
  }
  const artifacts: Artifact[] = []
  try {
    for (const [path, content] of Object.entries(files)) {
      writeFileSync(join(jobDir, path), content, { flag: 'wx', encoding: 'utf8' })
      artifacts.push({ path, sha256: sha256(content), bytes: Buffer.byteLength(content) })
    }
    const manifest = {
      schemaVersion: 1,
      taskId: request.taskId,
      output: request.output,
      status: result.status,
      createdAt: new Date().toISOString(),
      artifacts,
      compatibility: result.compatibility,
      humanReview: 'required',
      publication: 'not_started',
      integrityScope:
        'sha256 detects changed files; this local manifest is not a signed attestation',
    }
    writeFileSync(join(jobDir, 'manifest.json'), json(manifest), { flag: 'wx' })
    return {
      ok: result.status !== 'compatibility_failed',
      schemaVersion: 1,
      command: 'render',
      jobDir,
      manifest,
      exitCode: result.status === 'compatibility_failed' ? 2 : 0,
    }
  } catch (error) {
    throw new AgentCliError(
      'JOB_WRITE_FAILED',
      `任务写入失败，保留目录供检查且不会覆盖：${jobDir}；${error instanceof Error ? error.message : '未知 IO 错误'}`,
    )
  }
}

export interface ImageHeader {
  format: 'png' | 'jpeg' | 'webp'
  width: number
  height: number
  extension: string
}

/** Header/container checks only. They do not prove complete decode, visual quality or OCR fidelity. */
export function inspectImageHeader(buffer: Buffer): ImageHeader {
  let image: ImageHeader | undefined
  if (
    buffer.length >= 45 &&
    buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  ) {
    let position = 8
    let sawData = false
    let finished = false
    while (position + 12 <= buffer.length) {
      const length = buffer.readUInt32BE(position)
      if (length > buffer.length - position - 12) break
      const type = buffer.toString('ascii', position + 4, position + 8)
      if (position === 8) {
        if (type !== 'IHDR' || length !== 13) break
        image = {
          format: 'png',
          extension: '.png',
          width: buffer.readUInt32BE(position + 8),
          height: buffer.readUInt32BE(position + 12),
        }
      }
      if (type === 'IDAT' && length > 0) sawData = true
      position += length + 12
      if (type === 'IEND') {
        finished = length === 0 && position === buffer.length
        break
      }
    }
    if (!sawData || !finished) image = undefined
  } else if (
    buffer.length >= 12 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer.at(-2) === 0xff &&
    buffer.at(-1) === 0xd9
  ) {
    let position = 2
    let sawScan = false
    while (position + 4 <= buffer.length) {
      if (buffer[position] !== 0xff) break
      while (buffer[position] === 0xff) position++
      const marker = buffer[position++]!
      if (marker === 0xda) {
        if (position + 2 > buffer.length) break
        const length = buffer.readUInt16BE(position)
        sawScan = length >= 6 && position + length < buffer.length - 2
        break
      }
      if (marker === 0xd9 || marker === 0x00) break
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue
      if (position + 2 > buffer.length) break
      const length = buffer.readUInt16BE(position)
      if (length < 2 || position + length > buffer.length) break
      if (
        [0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(
          marker,
        ) &&
        length >= 8
      ) {
        image = {
          format: 'jpeg',
          extension: '.jpg',
          height: buffer.readUInt16BE(position + 3),
          width: buffer.readUInt16BE(position + 5),
        }
      }
      position += length
    }
    if (!sawScan) image = undefined
  } else if (
    buffer.length >= 30 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP' &&
    buffer.readUInt32LE(4) + 8 === buffer.length
  ) {
    let position = 12
    while (position + 8 <= buffer.length) {
      const type = buffer.toString('ascii', position, position + 4)
      const length = buffer.readUInt32LE(position + 4)
      const data = position + 8
      if (length > buffer.length - data) break
      if (
        type === 'ANIM' ||
        type === 'ANMF' ||
        (type === 'VP8X' && length >= 1 && (buffer[data]! & 2) !== 0)
      ) {
        throw new AgentCliError('INVALID_IMAGE', '只接受静态 WebP 图片', 4)
      }
      if (
        type === 'VP8 ' &&
        length >= 10 &&
        buffer.subarray(data + 3, data + 6).equals(Buffer.from([0x9d, 0x01, 0x2a]))
      ) {
        image = {
          format: 'webp',
          extension: '.webp',
          width: buffer.readUInt16LE(data + 6) & 0x3fff,
          height: buffer.readUInt16LE(data + 8) & 0x3fff,
        }
      } else if (type === 'VP8L' && length >= 5 && buffer[data] === 0x2f) {
        const bits = buffer.readUInt32LE(data + 1)
        image = {
          format: 'webp',
          extension: '.webp',
          width: (bits & 0x3fff) + 1,
          height: ((bits >>> 14) & 0x3fff) + 1,
        }
      }
      position = data + length + (length % 2)
    }
    if (position !== buffer.length) image = undefined
  }
  if (
    !image ||
    image.width < 1 ||
    image.height < 1 ||
    image.width > 32_768 ||
    image.height > 32_768 ||
    image.width * image.height > 100_000_000
  ) {
    throw new AgentCliError(
      'INVALID_IMAGE',
      '图片必须是有有效尺寸与基本容器结构的 PNG/JPEG/静态 WebP，最多 1 亿像素及单边 32768',
      4,
    )
  }
  return image
}

function attachImage(jobValue: string, imageValue: string) {
  const jobDir = resolve(localPath(jobValue))
  if (!lstatSync(jobDir).isDirectory() || lstatSync(jobDir).isSymbolicLink())
    throw new AgentCliError('INVALID_JOB', '任务必须是普通目录', 3)
  const manifestBytes = readBounded(join(jobDir, 'manifest.json'), 1024 * 1024)
  const manifest = JSON.parse(
    new TextDecoder('utf-8', { fatal: true }).decode(manifestBytes),
  ) as Record<string, unknown>
  const manifestKeys = [
    'schemaVersion',
    'taskId',
    'output',
    'status',
    'createdAt',
    'artifacts',
    'compatibility',
    'humanReview',
    'publication',
    'integrityScope',
  ]
  if (
    !manifest ||
    typeof manifest !== 'object' ||
    Array.isArray(manifest) ||
    Object.keys(manifest).some((key) => !manifestKeys.includes(key))
  )
    throw new AgentCliError('INVALID_JOB', '任务清单包含未知字段或无效结构', 3)
  if (
    !manifest ||
    manifest.schemaVersion !== 1 ||
    !isAgentTaskId(manifest.taskId) ||
    manifest.taskId !== basename(jobDir) ||
    manifest.output !== 'imagegen-long' ||
    manifest.status !== 'waiting_for_imagegen' ||
    manifest.publication !== 'not_started' ||
    manifest.humanReview !== 'required'
  ) {
    throw new AgentCliError('INVALID_JOB_STATE', '只可将真实图片接回 waiting_for_imagegen 任务', 3)
  }
  const expected = [
    'article.md',
    'request.json',
    'article.fragment.html',
    'article.html',
    'render.json',
    'compatibility.json',
    'imagegen-task.json',
    'imagegen-prompt.txt',
  ]
  if (!Array.isArray(manifest.artifacts) || manifest.artifacts.length !== expected.length)
    throw new AgentCliError('INTEGRITY_FAILED', '任务制品清单不完整', 4)
  const seen = new Set<string>()
  for (const item of manifest.artifacts as Artifact[]) {
    if (
      !item ||
      typeof item !== 'object' ||
      Object.keys(item).some((key) => !['path', 'sha256', 'bytes'].includes(key)) ||
      !expected.includes(item.path) ||
      seen.has(item.path) ||
      !/^[a-f0-9]{64}$/.test(item.sha256) ||
      !Number.isSafeInteger(item.bytes) ||
      item.bytes < 0 ||
      item.bytes > ARTIFACT_MAX_BYTES
    ) {
      throw new AgentCliError('INTEGRITY_FAILED', '任务制品路径/哈希/字节数无效', 4)
    }
    seen.add(item.path)
    const buffer = readBounded(join(jobDir, item.path), ARTIFACT_MAX_BYTES)
    if (buffer.length !== item.bytes || sha256(buffer) !== item.sha256)
      throw new AgentCliError('INTEGRITY_FAILED', `任务制品已变化：${item.path}`, 4)
  }
  const request = parseAgentRequest(readUtf8(join(jobDir, 'request.json'), REQUEST_MAX_BYTES))
  if (request.taskId !== manifest.taskId || request.output !== 'imagegen-long')
    throw new AgentCliError('INVALID_JOB_STATE', '任务合同与清单不一致', 3)
  const buffer = readBounded(resolve(localPath(imageValue)), IMAGE_MAX_BYTES)
  const header = inspectImageHeader(buffer)
  const attachmentDir = join(jobDir, 'image-attachment')
  try {
    mkdirSync(attachmentDir)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST')
      throw new AgentCliError(
        'ATTACHMENT_EXISTS',
        '图片回执目录已存在；不会覆盖原图或已有/未完成的回执',
        3,
      )
    throw error
  }
  const filename = 'generated-image' + header.extension
  writeFileSync(join(attachmentDir, filename), buffer, { flag: 'wx' })
  const receipt = {
    schemaVersion: 1,
    taskId: request.taskId,
    status: 'needs_review',
    createdAt: new Date().toISOString(),
    manifestSha256: sha256(manifestBytes),
    image: { path: filename, sha256: sha256(buffer), bytes: buffer.length, ...header },
    validation: 'header_and_container_only; no complete image decode or OCR',
    providerProvenance: 'caller_supplied; file does not attest which generator produced it',
    humanReview: 'required',
    textFidelity: 'unverified',
    publication: 'not_started',
  }
  writeFileSync(join(attachmentDir, 'receipt.json'), json(receipt), { flag: 'wx' })
  return {
    ok: true,
    schemaVersion: 1,
    command: 'attach-image',
    jobDir,
    receiptPath: join(attachmentDir, 'receipt.json'),
    receipt,
    exitCode: 0,
  }
}

export function runAgentCli(args: string[]) {
  const parsed = parseArgs({
    args,
    allowPositionals: true,
    strict: true,
    tokens: true,
    options: {
      request: { type: 'string' },
      'output-root': { type: 'string' },
      'job-dir': { type: 'string' },
      image: { type: 'string' },
    },
  })
  const optionNames = parsed.tokens
    .filter((token) => token.kind === 'option')
    .map((token) => token.name)
  if (new Set(optionNames).size !== optionNames.length)
    throw new AgentCliError('INVALID_ARGUMENT', '同一参数不能重复提供')
  const command = parsed.positionals[0]
  if (parsed.positionals.length !== 1 || !command)
    throw new AgentCliError(
      'INVALID_COMMAND',
      '命令：discover | validate --request file.json | render --request file.json --output-root jobs | attach-image --job-dir job --image image.png',
    )
  const accepted: Record<string, string[]> = {
    discover: [],
    validate: ['request'],
    render: ['request', 'output-root'],
    'attach-image': ['job-dir', 'image'],
  }
  if (!Object.hasOwn(accepted, command)) throw new AgentCliError('INVALID_COMMAND', '未知命令')
  for (const name of Object.keys(parsed.values))
    if (!accepted[command]!.includes(name))
      throw new AgentCliError('INVALID_ARGUMENT', `此命令不接受 --${name}`)
  for (const name of accepted[command]!)
    if (!parsed.values[name as keyof typeof parsed.values])
      throw new AgentCliError('MISSING_ARGUMENT', `缺少 --${name}`)
  if (command === 'discover')
    return { ok: true, command, ...discoverAgentCapabilities(), exitCode: 0 }
  if (command === 'attach-image')
    return attachImage(parsed.values['job-dir']!, parsed.values.image!)
  const request = loadRequest(parsed.values.request!)
  if (command === 'validate')
    return {
      ok: true,
      schemaVersion: 1,
      command,
      taskId: request.taskId,
      status: 'validated',
      request,
      scope: 'schema and bounded input only; render and compatibility not checked',
      exitCode: 0,
    }
  return createJob(request, parsed.values['output-root']!)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = runAgentCli(process.argv.slice(2))
    process.stdout.write(json(result))
    process.exitCode = result.exitCode
  } catch (error) {
    const exitCode = error instanceof AgentCliError ? error.exitCode : 1
    const code =
      error instanceof AgentCliError || error instanceof AgentContractError
        ? error.code
        : 'COMMAND_FAILED'
    process.stdout.write(
      json({
        ok: false,
        schemaVersion: 1,
        error: { code, message: error instanceof Error ? error.message : '命令执行失败' },
        exitCode,
      }),
    )
    process.exitCode = exitCode
  }
}
