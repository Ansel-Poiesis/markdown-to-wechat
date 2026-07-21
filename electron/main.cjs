const { app, BrowserWindow, ipcMain, shell } = require('electron')
const { join } = require('path')

let mainWindow = null
const activeMimoRequests = new Map()
const allowedMimoHosts = new Set(['api.xiaomimimo.com', 'token-plan-cn.xiaomimimo.com'])

function resolveMimoEndpoint(requestedEndpoint) {
  const endpoint = process.env.MIMO_API_URL || requestedEndpoint || 'https://api.xiaomimimo.com/v1/chat/completions'
  const parsed = new URL(endpoint)
  if (parsed.protocol !== 'https:' || !allowedMimoHosts.has(parsed.hostname)) {
    throw new Error('MiMo endpoint 不在允许列表中')
  }
  return parsed.toString()
}

function parseMimoEvent(line) {
  const trimmed = line.trim()
  if (!trimmed.startsWith('data:')) return { token: '', done: false }
  const payload = trimmed.slice(5).trim()
  if (payload === '[DONE]') return { token: '', done: true }
  try {
    const choice = JSON.parse(payload)?.choices?.[0]
    return {
      token: choice?.delta?.content || '',
      done: choice?.finish_reason === 'stop',
      finishReason: choice?.finish_reason || undefined,
    }
  } catch {
    return { token: '', done: false }
  }
}

ipcMain.handle('mimo:status', () => ({
  configured: Boolean(process.env.MIMO_API_KEY || process.env.XIAOMI_API_KEY),
}))

ipcMain.handle('mimo:format', async (event, request) => {
  const apiKey = process.env.MIMO_API_KEY || process.env.XIAOMI_API_KEY
  if (!apiKey) throw new Error('当前系统未配置 MIMO_API_KEY')
  if (!request?.requestId || typeof request.content !== 'string') {
    throw new Error('辅助排版请求格式无效')
  }
  if (request.content.length > 500_000) throw new Error('正文过长，暂不发送')

  const controller = new AbortController()
  activeMimoRequests.set(request.requestId, controller)
  try {
    const response = await fetch(resolveMimoEndpoint(request.endpoint), {
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
    })

    if (!response.ok) {
      const body = await response.text().catch(() => '')
      throw new Error(`MiMo API 错误 (${response.status}): ${body.slice(0, 200)}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('无法读取流式响应')
    const decoder = new TextDecoder()
    let buffer = ''
    let full = ''
    let completed = false

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      for (const line of lines) {
        const parsed = parseMimoEvent(line)
        if (parsed.done) completed = true
        if (parsed.finishReason === 'length') throw new Error('辅助排版输出被模型截断')
        if (!parsed.token) continue
        full += parsed.token
        if (!event.sender.isDestroyed()) {
          event.sender.send('mimo:chunk', { requestId: request.requestId, text: full })
        }
      }
    }

    if (buffer.trim()) {
      const parsed = parseMimoEvent(buffer)
      if (parsed.done) completed = true
      if (parsed.finishReason === 'length') throw new Error('辅助排版输出被模型截断')
      if (parsed.token) full += parsed.token
    }
    if (!completed) throw new Error('辅助排版响应未完整结束')
    if (!full.trim()) throw new Error('辅助排版没有返回有效内容')
    return full.trim()
  } finally {
    activeMimoRequests.delete(request.requestId)
  }
})

ipcMain.on('mimo:cancel', (_event, requestId) => {
  activeMimoRequests.get(requestId)?.abort()
})

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
    if (url !== mainWindow.webContents.getURL()) event.preventDefault()
  })

  mainWindow.on('closed', () => {
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
