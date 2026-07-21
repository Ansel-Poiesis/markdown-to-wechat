import { readdir, readFile } from 'node:fs/promises'
import { extname, join, relative } from 'node:path'
import process from 'node:process'

const root = process.cwd()
const roots = ['src', 'electron', 'docs', 'dist', '.github']
const rootFiles = ['index.html', 'vite.config.ts', 'package.json']
const textExtensions = new Set([
  '.cjs',
  '.css',
  '.html',
  '.js',
  '.json',
  '.mjs',
  '.ts',
  '.vue',
  '.yaml',
  '.yml',
])
const credentialPrefix = ['s', 'k'].join('')
const planPrefix = ['t', 'p'].join('')
const rules = [
  { name: 'project API credential', pattern: new RegExp(`${credentialPrefix}-[A-Za-z0-9_-]{24,}`) },
  { name: 'Token Plan credential', pattern: new RegExp(`${planPrefix}-[A-Za-z0-9_-]{24,}`) },
  { name: 'forbidden Vite secret variable', pattern: new RegExp(`VITE_${['MIMO', 'API', 'KEY'].join('_')}`) },
]

async function collect(path) {
  const entries = await readdir(path, { withFileTypes: true }).catch(() => [])
  const files = []
  for (const entry of entries) {
    const next = join(path, entry.name)
    if (entry.isDirectory()) files.push(...(await collect(next)))
    else if (textExtensions.has(extname(entry.name))) files.push(next)
  }
  return files
}

const files = rootFiles.map((file) => join(root, file))
for (const directory of roots) files.push(...(await collect(join(root, directory))))

const findings = []
for (const file of files) {
  const content = await readFile(file, 'utf8').catch(() => '')
  for (const rule of rules) {
    if (rule.pattern.test(content)) findings.push(`${relative(root, file)}: ${rule.name}`)
  }
}

if (findings.length) {
  console.error('Sensitive values or forbidden client credential variables were found:')
  for (const finding of findings) console.error(`- ${finding}`)
  process.exit(1)
}

console.log(`Secret scan passed (${files.length} text files).`)
