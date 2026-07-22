import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { createCandidateTask, createForwardDraft, type AgentMailMessage } from './feedback-inbox-core'

const DEFAULT_NOTIFY_TO = process.env.FEEDBACK_NOTIFY_EMAIL?.trim() || ''
const DEFAULT_OUTPUT = join(
  process.env.LOCALAPPDATA || process.cwd(),
  'TasteLab',
  'markdown-to-wechat',
  'feedback',
)

interface CliOptions {
  fixture?: string
  output: string
  notifyTo: string
  limit: number
}

interface AgentMailListEnvelope {
  ok: boolean
  data?: { data?: Array<{ message_id?: string; subject?: string }> }
  error?: { message?: string }
}

interface AgentMailReadEnvelope {
  ok: boolean
  data?: AgentMailMessage
  error?: { message?: string }
}

function main() {
  const options = parseArgs(process.argv.slice(2))
  if (!options.notifyTo) {
    throw new Error('缺少 FEEDBACK_NOTIFY_EMAIL 或 --notify-to，无法生成个人邮箱转发草稿')
  }

  const messages = options.fixture ? readFixture(options.fixture) : readAgentMail(options.limit)
  const taskDir = join(options.output, 'tasks')
  const outboxDir = join(options.output, 'outbox')
  mkdirSync(taskDir, { recursive: true })
  mkdirSync(outboxDir, { recursive: true })

  const created: string[] = []
  const skipped: string[] = []
  for (const message of messages) {
    const task = createCandidateTask(message)
    if (!task) {
      skipped.push(message.message_id)
      continue
    }

    const taskPath = join(taskDir, `${task.feedbackId}.json`)
    if (existsSync(taskPath)) {
      skipped.push(task.feedbackId)
      continue
    }

    const draft = createForwardDraft(task, options.notifyTo)
    writeJsonAtomic(taskPath, task)
    writeJsonAtomic(join(outboxDir, `${task.feedbackId}.json`), draft)
    created.push(task.feedbackId)
  }

  process.stdout.write(
    `${JSON.stringify({ ok: true, output: options.output, created, skipped, requiresConfirmation: created.length > 0 }, null, 2)}\n`,
  )
}

function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {
    output: DEFAULT_OUTPUT,
    notifyTo: DEFAULT_NOTIFY_TO,
    limit: 50,
  }
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    const value = args[index + 1]
    if (arg === '--fixture' && value) options.fixture = resolve(value)
    else if (arg === '--output' && value) options.output = resolve(value)
    else if (arg === '--notify-to' && value) options.notifyTo = value.trim()
    else if (arg === '--limit' && value) options.limit = Number.parseInt(value, 10)
    else continue
    index += 1
  }
  if (!Number.isInteger(options.limit) || options.limit < 1 || options.limit > 50) {
    throw new Error('--limit 必须是 1 到 50 之间的整数')
  }
  return options
}

function readFixture(path: string): AgentMailMessage[] {
  const parsed = JSON.parse(readFileSync(path, 'utf8')) as AgentMailMessage[] | { messages?: AgentMailMessage[] }
  const messages = Array.isArray(parsed) ? parsed : parsed.messages
  if (!messages) throw new Error('fixture 必须是邮件数组或包含 messages 数组的对象')
  return messages
}

function readAgentMail(limit: number): AgentMailMessage[] {
  const list = runAgently<AgentMailListEnvelope>([
    'message',
    '+search',
    '--q',
    '微信 Markdown 排版',
    '--search-in',
    'SEARCH_IN_SUBJECT',
    '--dir',
    'inbox',
    '--limit',
    String(limit),
  ])
  const summaries = list.data?.data || []
  const messages: AgentMailMessage[] = []
  for (const summary of summaries) {
    if (!summary.message_id || !summary.subject?.includes('[微信 Markdown 排版]')) continue
    const read = runAgently<AgentMailReadEnvelope>(['message', '+read', '--id', summary.message_id])
    if (read.data) messages.push(read.data)
  }
  return messages
}

function runAgently<T extends { ok: boolean; error?: { message?: string } }>(args: string[]): T {
  const windowsCli = join(process.env.APPDATA || '', 'npm', 'agently-cli.ps1')
  if (process.platform === 'win32' && !existsSync(windowsCli)) {
    throw new Error(`找不到 Agent Mail CLI：${windowsCli}`)
  }
  const executable = process.platform === 'win32' ? 'powershell.exe' : 'agently-cli'
  const commandArgs =
    process.platform === 'win32'
      ? ['-NoLogo', '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', windowsCli, ...args]
      : args
  const raw = execFileSync(executable, commandArgs, {
    encoding: 'utf8',
    env: { ...process.env, NO_COLOR: '1' },
    maxBuffer: 10 * 1024 * 1024,
    windowsHide: true,
  })
  const parsed = JSON.parse(raw) as T
  if (!parsed.ok) throw new Error(parsed.error?.message || 'Agent Mail CLI 调用失败')
  return parsed
}

function writeJsonAtomic(path: string, value: unknown) {
  const temporary = `${path}.tmp`
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
  renameSync(temporary, path)
}

main()
