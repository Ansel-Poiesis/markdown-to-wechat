#!/usr/bin/env node
/**
 * 浏览器端 UI 冒烟与关键视口截图回归。
 *
 * 用法：
 *   npm run build        # 先生成 dist/（脚本也会在缺失时自动构建）
 *   npm run smoke:browser
 *
 * 行为：
 *   - 启动本地静态服务（无第三方依赖），提供 dist/。
 *   - 用本机 Chrome/Edge 无头模式分别打开桌面 1280x900 与移动 390x844。
 *   - 断言应用挂载、工作台/移动导航与欢迎文本预览的关键 DOM 标记。
 *   - 把 DOM 快照与截图写入 browser-smoke/（已 gitignore，供人工复核）。
 *
 * 退出码：0 全部通过，1 任一视口失败或环境不满足。
 */

import { spawn, spawnSync } from 'node:child_process'
import { createServer } from 'node:http'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = join(ROOT, 'dist')
const OUT_DIR = join(ROOT, 'browser-smoke')
const WELCOME_MARKER = '把 Markdown 变成公众号文章'

const VIEWPORTS = [
  { name: 'desktop-1280x900', width: 1280, height: 900 },
  { name: 'mobile-390x844', width: 390, height: 844 },
]

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
}

function ensureBuild() {
  if (existsSync(join(DIST, 'index.html'))) return
  console.log('未找到 dist/index.html，先执行 npm run build-only ...')
  const result = spawnSync('npm', ['run', 'build-only'], { cwd: ROOT, stdio: 'inherit', shell: true })
  if (result.status !== 0) throw new Error('npm run build-only 失败')
}

function findBrowser() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  ].filter(Boolean)
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate
  }
  throw new Error('未找到 Chrome/Edge，可通过 CHROME_PATH 环境变量指定浏览器路径')
}

async function startServer() {
  const server = createServer((req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname)
    let filePath = join(DIST, urlPath === '/' ? 'index.html' : urlPath)
    if (!filePath.startsWith(DIST) || !existsSync(filePath)) {
      filePath = join(DIST, 'index.html')
    }
    res.setHeader('Content-Type', MIME[extname(filePath)] ?? 'application/octet-stream')
    res.end(readFileSync(filePath))
  })
  await new Promise((resolveListen) => server.listen(0, '127.0.0.1', resolveListen))
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('无法取得服务端口')
  return { server, port: address.port }
}

function runHeadless(browser, url, viewport, userDataDir) {
  const args = [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    `--window-size=${viewport.width},${viewport.height}`,
    `--virtual-time-budget=12000`,
    `--user-data-dir=${userDataDir}`,
    '--dump-dom',
    `--screenshot=${join(OUT_DIR, `${viewport.name}.png`)}`,
    url,
  ]
  return new Promise((resolveRun) => {
    const child = spawn(browser, args, { windowsHide: true })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (chunk) => (stdout += chunk))
    child.stderr.on('data', (chunk) => (stderr += chunk))
    child.on('close', (code) => resolveRun({ code, stdout, stderr }))
  })
}

function assertDom(name, dom) {
  const failures = []
  const check = (label, condition) => {
    if (!condition) failures.push(label)
  }
  check('应用已挂载（#app 非空）', dom.includes('id="app"') && dom.length > 2000)
  check(`标题存在（Markdown渲染器）`, dom.includes('Markdown渲染器'))
  check(`欢迎示例已渲染（${WELCOME_MARKER}）`, dom.includes(WELCOME_MARKER))
  if (name.startsWith('desktop')) {
    check('桌面三栏工作台存在', dom.includes('desktop-workspace'))
    check('输出预览面板存在', dom.includes('输出预览'))
  } else {
    check('移动端底部导航存在', dom.includes('mobile-nav'))
  }
  if (failures.length) {
    console.error(`✗ ${name}：${failures.join('；')}`)
  } else {
    console.log(`✓ ${name}：DOM 冒烟通过`)
  }
  return failures.length === 0
}

async function main() {
  ensureBuild()
  const browser = findBrowser()
  mkdirSync(OUT_DIR, { recursive: true })
  const { server, port } = await startServer()
  const url = `http://127.0.0.1:${port}/`
  const userDataDir = mkdtempSync(join(tmpdir(), 'wechat-md-smoke-'))
  let allPassed = true

  try {
    for (const viewport of VIEWPORTS) {
      const result = await runHeadless(browser, url, viewport, userDataDir)
      writeFileSync(join(OUT_DIR, `${viewport.name}.html`), result.stdout, 'utf8')
      if (result.code !== 0 && result.stderr.trim()) {
        console.warn(`  （浏览器提示：${result.stderr.trim().slice(0, 300)}）`)
      }
      allPassed = assertDom(viewport.name, result.stdout) && allPassed
    }
  } finally {
    server.close()
    rmSync(userDataDir, { recursive: true, force: true })
  }

  console.log(`\n截图与 DOM 快照已写入 ${OUT_DIR}`)
  if (!allPassed) process.exitCode = 1
}

main().catch((error) => {
  console.error(`冒烟失败：${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
})
