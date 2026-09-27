const { app, BrowserWindow, ipcMain, shell } = require('electron')
const { join } = require('path')
const { pathToFileURL } = require('url')

let mainWindow = null
const activeMimoRequests = new Map()
const allowedMimoHosts = new Set(['api.xiaomimimo.com', 'token-plan-cn.xiaomimimo.com'])
const rendererUrl = new URL(
  process.env.VITE_DEV_SERVER_URL || pathToFileURL(join(__dirname, '../dist/index.html')).href,
)

function isRendererUrl(value) {
  try {
    const parsed = new URL(value)
    parsed.hash = ''
    return parsed.href === rendererUrl.href
  } catch {
    return false
  }
}

function assertTrustedSender(event) {
  if (
    !mainWindow ||
    event.sender !== mainWindow.webContents ||
    event.sender.isDestroyed() ||
    !event.senderFrame ||
    event.senderFrame !== mainWindow.webContents.mainFrame ||
    !isRendererUrl(event.senderFrame.url)
  ) {
    throw new Error('IPC 来源无效')
  }
}

function resolveMimoEndpoint(requestedEndpoint) {
  const endpoint =
    process.env.MIMO_API_URL ||
    requestedEndpoint ||
    'https://api.xiaomimimo.com/v1/chat/completions'
  const parsed = new URL(endpoint)
  if (
    parsed.protocol !== 'https:' ||
    !allowedMimoHosts.has(parsed.hostname) ||
    parsed.username ||
    parsed.password ||
    parsed.port ||
    parsed.search ||
    parsed.hash ||
    parsed.pathname !== '/v1/chat/completions'
  ) {
    throw new Error('MiMo endpoint 不在允许列表中')
  }
  return parsed.toString()
}

function parseMimoEvent(line) {
  const trimmed = line.trim()
  if (!trimmed.startsWith('data:')) return { token: '', done: false }
  const payload = trimmed.slice(5).trim()
  if (payload === '[DONE]') return { token: '', done: true }
  let chunk
  try {
    chunk = JSON.parse(payload)
  } catch {
    throw new Error('辅助排版流数据损坏')
  }
  if (!chunk || typeof chunk !== 'object' || chunk.error || !Array.isArray(chunk.choices)) {
    throw new Error('辅助排版响应格式无效')
  }
  const choice = chunk.choices[0]
  const token = choice?.delta?.content
  const reason = choice?.finish_reason
  if (
    (token != null && typeof token !== 'string') ||
    (reason != null && typeof reason !== 'string')
  ) {
    throw new Error('辅助排版响应格式无效')
  }
  return {
    token: typeof token === 'string' ? token : '',
    done: reason === 'stop',
    finishReason: typeof reason === 'string' ? reason : undefined,
  }
}

ipcMain.handle('mimo:status', (event) => {
  assertTrustedSender(event)
  return { configured: Boolean(process.env.MIMO_API_KEY || process.env.XIAOMI_API_KEY) }
})

ipcMain.handle('mimo:format', async (event, request) => {
  assertTrustedSender(event)
  const apiKey = process.env.MIMO_API_KEY || process.env.XIAOMI_API_KEY
  if (!apiKey) throw new Error('当前系统未配置 MIMO_API_KEY')
  if (
    !request ||
    typeof request.requestId !== 'string' ||
    !/^[a-zA-Z0-9-]{1,100}$/.test(request.requestId) ||
    typeof request.content !== 'string' ||
    !request.content.trim() ||
    !['mimo-v2.5', 'mimo-v2.5-pro'].includes(request.model) ||
    typeof request.systemPrompt !== 'string' ||
    request.systemPrompt.length > 16_000 ||
    !Number.isInteger(request.maxCompletionTokens) ||
    request.maxCompletionTokens < 1 ||
    request.maxCompletionTokens > 8000 ||
    !Number.isFinite(request.temperature) ||
    request.temperature < 0 ||
    request.temperature > 2 ||
    !['low', 'medium', 'high'].includes(request.reasoningEffort)
  ) {
    throw new Error('辅助排版请求格式无效')
  }
  if (request.content.length > 500_000) throw new Error('正文过长，暂不发送')
  if (activeMimoRequests.size > 0) throw new Error('辅助排版请求仍在进行中')
  const endpoint = resolveMimoEndpoint(request.endpoint)

  const controller = new AbortController()
  activeMimoRequests.set(request.requestId, controller)
  let timedOut = false
  const timeout = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, 120_000)
  let reader
  try {
    const response = await abortable(
      fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey,
        },
        body: JSON.stringify({
          model: request.model,
          messages: [
            { role: 'system', content: request.systemPrompt },
            { role: 'user', content: request.content },
          ],
          max_completion_tokens: request.maxCompletionTokens,
          temperature: request.temperature,
          stream: true,
          reasoning_effort: request.reasoningEffort,
        }),
        signal: controller.signal,
        redirect: 'error',
        credentials: 'omit',
      }),
      controller.signal,
    )

    if (!response.ok) {
      void response.body?.cancel().catch(() => undefined)
      throw new Error(`MiMo API 错误 (${response.status})`)
    }

    reader = response.body?.getReader()
    if (!reader) throw new Error('无法读取流式响应')
    const decoder = new TextDecoder()
    let buffer = ''
    let full = ''
    let completed = false
    let streamBytes = 0

    const consume = (line) => {
      if (line.length > 256_000) throw new Error('辅助排版响应单条数据过长')
      const parsed = parseMimoEvent(line)
      if (parsed.finishReason && parsed.finishReason !== 'stop') {
        throw new Error(
          parsed.finishReason === 'length' ? '辅助排版输出被模型截断' : '辅助排版响应被服务中止',
        )
      }
      if (parsed.token) {
        full += parsed.token
        if (full.length > 1_000_000) throw new Error('辅助排版输出过长')
        if (!event.sender.isDestroyed())
          event.sender.send('mimo:chunk', { requestId: request.requestId, text: full })
      }
      if (parsed.done) completed = true
    }

    while (!completed) {
      const { done, value } = await abortable(reader.read(), controller.signal)
      if (done) {
        buffer += decoder.decode()
        break
      }
      streamBytes += value.byteLength
      if (streamBytes > 8_000_000) throw new Error('辅助排版响应过大')
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      for (const line of lines) {
        consume(line)
        if (completed) break
      }
      if (!completed && buffer.length > 256_000) throw new Error('辅助排版响应单条数据过长')
    }

    if (!completed && buffer.trim()) consume(buffer)
    if (!completed) throw new Error('辅助排版响应未完整结束')
    if (!full.trim()) throw new Error('辅助排版没有返回有效内容')
    if (controller.signal.aborted) throw new DOMException('Aborted', 'AbortError')
    return full.trim()
  } catch (error) {
    if (timedOut) throw new Error('辅助排版服务超时')
    throw error
  } finally {
    clearTimeout(timeout)
    void reader?.cancel().catch(() => undefined)
    controller.abort()
    activeMimoRequests.delete(request.requestId)
  }
})

ipcMain.on('mimo:cancel', (event, requestId) => {
  try {
    assertTrustedSender(event)
  } catch {
    return
  }
  activeMimoRequests.get(requestId)?.abort()
})

ipcMain.handle('feedback:open-email', async (event, mailto) => {
  assertTrustedSender(event)
  if (typeof mailto !== 'string' || mailto.length > 20_000) {
    throw new Error('反馈邮件内容无效')
  }
  const url = new URL(mailto)
  if (
    url.protocol !== 'mailto:' ||
    url.pathname.toLowerCase() !== 'callansel@agent.qq.com' ||
    url.hash ||
    [...url.searchParams.keys()].some((key) => !['subject', 'body'].includes(key)) ||
    url.searchParams.getAll('subject').length > 1 ||
    url.searchParams.getAll('body').length > 1 ||
    /[\r\n]/.test(url.searchParams.get('subject') || '')
  ) {
    throw new Error('反馈收件地址无效')
  }
  await shell.openExternal(url.toString())
})

function abortable(task, signal) {
  return new Promise((resolve, reject) => {
    const abort = () => reject(new DOMException('Aborted', 'AbortError'))
    task.then(resolve, reject).finally(() => signal.removeEventListener('abort', abort))
    if (signal.aborted) {
      abort()
      return
    }
    signal.addEventListener('abort', abort, { once: true })
  })
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    title: '微信 Markdown 排版工具',
    webPreferences: {
      preload: join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
    autoHideMenuBar: true,
  })

  // 开发模式加载 Vite dev server，生产模式加载打包后的文件
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'))
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) void shell.openExternal(url)
    return { action: 'deny' }
  })
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!isRendererUrl(url)) event.preventDefault()
  })
  mainWindow.webContents.on('will-redirect', (event, url) => {
    if (!isRendererUrl(url)) event.preventDefault()
  })
  mainWindow.webContents.on('will-attach-webview', (event) => event.preventDefault())
  mainWindow.webContents.session?.setPermissionRequestHandler((_contents, _permission, callback) =>
    callback(false),
  )
  mainWindow.webContents.on('render-process-gone', () => {
    for (const controller of activeMimoRequests.values()) controller.abort()
  })

  mainWindow.on('closed', () => {
    for (const controller of activeMimoRequests.values()) controller.abort()
    mainWindow = null
  })
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
