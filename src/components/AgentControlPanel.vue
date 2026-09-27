<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { useModalFocus } from '@/composables/useModalFocus'
import { STYLE_PRESETS } from '@/stores/settings'
import { parseAgentRequest, type AgentRenderRequest } from '@/agent/contract'
import { renderAgentArticle } from '@/agent/render'
import { createImagegenBrief, imagegenStyles, type ImagegenStyle } from '@/agent/imagegen'
import type { DesignThemeKey } from '@/types'

const props = defineProps<{ open: boolean; markdown: string; initialTheme: DesignThemeKey }>()
const emit = defineEmits<{ close: []; apply: [request: AgentRenderRequest] }>()
const dialog = ref<HTMLElement>()
const tab = ref<'prepare' | 'request' | 'image'>('prepare')
const output = ref<'wechat' | 'html' | 'imagegen-long'>('wechat')
const theme = ref<DesignThemeKey>('qiuhe')
const imageStyle = ref<ImagegenStyle>('editorial')
const taskId = ref('')
const requestText = ref('')
const error = ref('')
const notice = ref('')
const result = ref<ReturnType<typeof renderAgentArticle>>()
const resultRequest = ref<AgentRenderRequest>()
const imageUrl = ref('')
const imageName = ref('')
const imageDetails = ref('')
const imageBusy = ref(false)
let imageRevision = 0
function invalidatePreview() {
  result.value = undefined
  resultRequest.value = undefined
  notice.value = ''
}
watch([output, theme, imageStyle, taskId, tab, () => props.markdown], invalidatePreview)
useModalFocus(
  () => props.open,
  dialog,
  () => emit('close'),
)

watch(
  () => props.open,
  (open) => {
    if (!open) return
    theme.value = props.initialTheme
    taskId.value = `article-${Date.now()}`
    output.value = 'wechat'
    result.value = undefined
    resultRequest.value = undefined
    requestText.value = ''
    error.value = ''
    notice.value = ''
    tab.value = 'prepare'
  },
  { immediate: true },
)

const outputChoices = [
  {
    id: 'wechat' as const,
    icon: 'fileText' as const,
    title: '公众号文章',
    description: '内联样式 · 外链脚注',
  },
  {
    id: 'html' as const,
    icon: 'monitor' as const,
    title: '独立网页',
    description: '完整 HTML · 保留链接',
  },
  {
    id: 'imagegen-long' as const,
    icon: 'image' as const,
    title: 'imagegen 长图',
    description: '编辑式构图 · 图片交接',
  },
]
const brief = computed(() => {
  if (resultRequest.value?.output !== 'imagegen-long') return undefined
  return createImagegenBrief(resultRequest.value.markdown ?? '', {
    style: resultRequest.value.imagegen?.style,
    title: resultRequest.value.title,
  })
})

function prepareRequest() {
  const request = {
    schemaVersion: 1,
    taskId: taskId.value.trim(),
    markdown: props.markdown,
    output: output.value,
    theme: theme.value,
    ...(output.value === 'imagegen-long' ? { imagegen: { style: imageStyle.value } } : {}),
  }
  return parseAgentRequest(JSON.stringify(request), 'browser')
}

function perform(action: () => void) {
  error.value = ''
  notice.value = ''
  try {
    action()
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : '任务未能完成，请检查输入。'
  }
}

function downloadText(name: string, text: string, mime = 'application/json') {
  const url = URL.createObjectURL(new Blob([text], { type: `${mime};charset=utf-8` }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = name
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000)
  notice.value = `已发起下载：${name}`
}

function buildPreview() {
  result.value = undefined
  resultRequest.value = undefined
  perform(() => {
    const request =
      tab.value === 'request' ? parseAgentRequest(requestText.value, 'browser') : prepareRequest()
    const next = renderAgentArticle(request)
    result.value = next
    resultRequest.value = request
    requestText.value = JSON.stringify(request, null, 2)
    notice.value =
      request.output === 'imagegen-long'
        ? '长图任务已准备。将提示词交给 Agent 的 imagegen，再回填生成图片。'
        : '任务预览已生成。可下载 HTML，或将任务交给 Agent 批量处理。'
  })
}

function downloadRequest() {
  perform(() => {
    const request =
      tab.value === 'request' ? parseAgentRequest(requestText.value, 'browser') : prepareRequest()
    downloadText(`${request.taskId}.request.json`, JSON.stringify(request, null, 2))
  })
}

async function importRequest(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  error.value = ''
  try {
    if (file.size > 12 * 1024 * 1024) throw new Error('任务文件过大，请使用 CLI 从原稿路径读取。')
    const text = await file.text()
    parseAgentRequest(text, 'browser')
    requestText.value = text
    result.value = undefined
    resultRequest.value = undefined
    tab.value = 'request'
    notice.value = '已载入任务。原稿保持不变，可先生成预览。'
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : '任务读取失败。'
  }
}

async function importImage(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  const revision = ++imageRevision
  imageBusy.value = true
  error.value = ''
  let candidate = ''
  try {
    if (file.size > 20 * 1024 * 1024) throw new Error('图片超过 20 MB，请先导出适合交付的版本。')
    const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer())
    const isPng = [137, 80, 78, 71, 13, 10, 26, 10].every((n, i) => bytes[i] === n)
    const isJpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
    const isWebp =
      String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
      String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
    if (!isPng && !isJpeg && !isWebp) throw new Error('请选择真实的 PNG、JPEG 或 WebP 图片。')
    // data: images are already permitted by the app CSP. Object URLs are not;
    // using a bounded data URL keeps local previews compatible with that policy.
    candidate = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () =>
        typeof reader.result === 'string'
          ? resolve(reader.result)
          : reject(new Error('图片读取失败。'))
      reader.onerror = () => reject(new Error('图片读取失败。'))
      reader.readAsDataURL(file)
    })
    const image = new Image()
    image.src = candidate
    await image.decode()
    if (image.naturalWidth * image.naturalHeight > 40_000_000)
      throw new Error('图片超过 4000 万像素，请使用较小的交付图。')
    if (revision !== imageRevision) return
    imageUrl.value = candidate
    imageName.value = file.name
    imageDetails.value = `${image.naturalWidth} × ${image.naturalHeight} · ${(file.size / 1024 / 1024).toFixed(1)} MB`
    notice.value = '图片仅在本页预览。请核对原文，再由 Agent 回填对应任务。'
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : '图片无法解码。'
  } finally {
    if (revision === imageRevision) imageBusy.value = false
  }
}

onBeforeUnmount(() => {
  imageRevision += 1
  imageUrl.value = ''
})
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="agent-backdrop" @click.self="emit('close')">
      <aside
        ref="dialog"
        class="agent-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="agent-title"
        tabindex="-1"
      >
        <header class="agent-heading">
          <div>
            <p class="agent-eyebrow">从原稿到交付</p>
            <h2 id="agent-title">Agent 工作台</h2>
          </div>
          <button
            type="button"
            class="neu-icon-button"
            aria-label="关闭 Agent 工作台"
            @click="emit('close')"
          >
            <AppIcon name="x" :size="20" />
          </button>
        </header>
        <p class="agent-intro">
          选好形态，把原稿和排版意图交给 Agent。生成产物后，再进入发布流程。
        </p>
        <nav class="agent-tabs" aria-label="Agent 工作区">
          <button :aria-pressed="tab === 'prepare'" @click="tab = 'prepare'">准备交接</button>
          <button :aria-pressed="tab === 'request'" @click="tab = 'request'">任务 JSON</button>
          <button :aria-pressed="tab === 'image'" @click="tab = 'image'">长图回看</button>
        </nav>
        <div class="agent-body">
          <template v-if="tab === 'prepare'">
            <label class="agent-label" for="agent-task-id">任务标识</label>
            <input
              id="agent-task-id"
              v-model="taskId"
              class="neu-field"
              maxlength="64"
              autocomplete="off"
              spellcheck="false"
            />
            <fieldset class="agent-output">
              <legend>渲染形态</legend>
              <label
                v-for="choice in outputChoices"
                :key="choice.id"
                class="agent-output-option"
                :class="{ 'is-selected': output === choice.id }"
              >
                <input v-model="output" type="radio" name="agent-output" :value="choice.id" />
                <AppIcon :name="choice.icon" :size="22" /><span
                  ><strong>{{ choice.title }}</strong
                  ><small>{{ choice.description }}</small></span
                >
              </label>
            </fieldset>
            <div class="agent-fields">
              <label class="agent-label"
                >文章主题<select v-model="theme" class="neu-field" aria-label="Agent 文章主题">
                  <option v-for="preset in STYLE_PRESETS" :key="preset.key" :value="preset.key">
                    {{ preset.label }}
                  </option>
                </select></label
              >
              <label v-if="output === 'imagegen-long'" class="agent-label"
                >长图风格<select v-model="imageStyle" class="neu-field" aria-label="长图风格">
                  <option v-for="style in imagegenStyles" :key="style.id" :value="style.id">
                    {{ style.name }}
                  </option>
                </select></label
              >
            </div>
            <p class="agent-hint">
              以当前原稿与所选完整主题创建任务。手动微调的样式不会自动带入；需要时在任务 JSON 中设置
              options。
            </p>
            <p v-if="output === 'imagegen-long'" class="agent-hint">
              imagegen 由 Agent 调用，单张原稿最多 4000 字符。生成图需逐字核对；HTML
              仍可作为文字对照。
            </p>
          </template>
          <template v-else-if="tab === 'request'">
            <div class="agent-row">
              <label class="agent-label" for="agent-request">可复用的渲染任务</label
              ><label class="agent-file-button neu-button"
                >导入 JSON<input
                  type="file"
                  accept=".json,application/json"
                  @change="importRequest"
              /></label>
            </div>
            <textarea
              id="agent-request"
              v-model="requestText"
              @input="invalidatePreview"
              class="neu-field agent-json"
              spellcheck="false"
              placeholder="粘贴 Agent 任务 JSON，或在准备交接中生成预览。"
            />
            <p class="agent-hint">
              网页任务使用 markdown 正文；inputPath 由本地 CLI 处理。验证和预览不会覆盖当前草稿。
            </p>
          </template>
          <template v-else>
            <div class="agent-image-intro">
              <AppIcon name="image" :size="28" />
              <h3>让版式多一种可能</h3>
              <p>在 Agent 中用 imagegen 生成长图后，带回这里检查文字、比例和裁切。</p>
            </div>
            <label class="agent-file-button neu-button agent-image-upload"
              >{{ imageBusy ? '正在读取图片…' : '选择生成的长图'
              }}<input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                :disabled="imageBusy"
                @change="importImage"
            /></label>
            <figure v-if="imageUrl" class="agent-image">
              <img :src="imageUrl" :alt="imageName" />
              <figcaption>{{ imageName }}<br />{{ imageDetails }} · 待核对文字</figcaption>
            </figure>
            <div class="agent-note">
              <strong>保留两份产物</strong>
              <p>
                HTML 保留可复制的文字；生成图片承载更自由的版式。正式交接时由 Agent
                将图片与原稿绑定。
              </p>
            </div>
          </template>

          <p v-if="error" role="alert" class="agent-message is-error">{{ error }}</p>
          <p v-if="notice" role="status" class="agent-message">{{ notice }}</p>
          <div v-if="tab !== 'image'" class="agent-actions">
            <button type="button" class="neu-button neu-button--primary" @click="buildPreview">
              <AppIcon name="eye" :size="16" />生成预览</button
            ><button type="button" class="neu-button" @click="downloadRequest">
              <AppIcon name="download" :size="16" />下载任务 JSON
            </button>
          </div>

          <section v-if="result && resultRequest && tab !== 'image'" class="agent-result">
            <div class="agent-row">
              <h3>任务预览</h3>
              <span class="agent-state">{{
                brief ? '等待 imagegen' : result.rendered.valid ? '已生成' : '需检查兼容性'
              }}</span>
            </div>
            <iframe
              title="Agent 任务渲染预览"
              :srcdoc="result.document"
              sandbox=""
              referrerpolicy="no-referrer"
            />
            <div class="agent-actions">
              <button
                class="neu-button"
                @click="downloadText(`${resultRequest.taskId}.html`, result.document, 'text/html')"
              >
                下载 HTML
              </button>
              <button class="neu-button" @click="emit('apply', resultRequest)">
                作为新草稿打开
              </button>
              <button
                v-if="brief"
                class="neu-button"
                @click="
                  downloadText(`${resultRequest.taskId}.imagegen.txt`, brief.prompt, 'text/plain')
                "
              >
                下载 imagegen 提示词
              </button>
            </div>
            <p class="agent-hint">
              新草稿在主编辑区使用公众号预览；本次交接结果以此处的渲染形态为准。
            </p>
          </section>
          <details class="agent-note">
            <summary>Agent 如何接入</summary>
            <p>使用 <code>markdown-renderer-agent</code> skill，或在源码目录运行：</p>
            <pre>
npm run agent -- discover
npm run agent -- render --request task.json --output-root jobs</pre
            >
            <p>
              每个任务保留原稿、产物与 manifest。图片任务等待生成图回填；后续交给蚁小二 validate →
              dry-run → 发布。
            </p>
          </details>
        </div>
      </aside>
    </div>
  </Teleport>
</template>

<style scoped>
.agent-backdrop {
  position: fixed;
  inset: 0;
  z-index: 150;
  display: flex;
  justify-content: flex-end;
  background: var(--color-overlay);
  backdrop-filter: blur(4px);
}
.agent-panel {
  width: min(620px, 100vw);
  height: 100dvh;
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
  color: var(--color-text);
  box-shadow: -12px 0 42px rgb(0 0 0 / 0.12);
  padding: 28px;
  overflow: hidden;
}
.agent-heading,
.agent-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.agent-eyebrow {
  font-size: 11px;
  letter-spacing: 0.12em;
  color: var(--color-text-tertiary);
  margin-bottom: 7px;
}
.agent-heading h2 {
  font-size: 26px;
  font-weight: 650;
  letter-spacing: -0.03em;
}
.agent-intro {
  font-size: 13px;
  line-height: 1.85;
  color: var(--color-text-secondary);
  margin: 16px 0 22px;
  max-width: 42em;
}
.agent-tabs {
  display: flex;
  gap: 6px;
  padding: 5px;
  border-radius: 13px;
  box-shadow: var(--shadow-inset-soft);
  margin-bottom: 20px;
}
.agent-tabs button {
  flex: 1;
  border-radius: 9px;
  padding: 10px 4px;
  font-size: 13px;
  color: var(--color-text-secondary);
}
.agent-tabs button[aria-pressed='true'] {
  background: var(--color-surface);
  box-shadow: var(--shadow-control);
  color: var(--color-text);
  font-weight: 600;
}
.agent-body {
  min-height: 0;
  overflow: auto;
  padding: 3px 5px 24px;
  scrollbar-gutter: stable;
}
.agent-label,
.agent-output legend {
  display: block;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 9px;
  color: var(--color-text-secondary);
}
.neu-field {
  width: 100%;
  min-height: 42px;
  font-size: 13px;
}
.agent-output {
  border: 0;
  margin-top: 24px;
  display: grid;
  gap: 9px;
}
.agent-output-option {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  border-radius: 13px;
  cursor: pointer;
  box-shadow: var(--shadow-control);
  margin-top: 4px;
}
.agent-output-option.is-selected {
  box-shadow: var(--shadow-inset);
  color: var(--color-accent);
}
.agent-output-option input {
  accent-color: var(--color-accent);
}
.agent-output-option strong {
  display: block;
  font-size: 14px;
  font-weight: 600;
}
.agent-output-option small {
  display: block;
  font-size: 11px;
  font-weight: 400;
  color: var(--color-text-tertiary);
  margin-top: 5px;
}
.agent-fields {
  display: flex;
  gap: 16px;
  margin-top: 24px;
}
.agent-fields label {
  flex: 1;
  min-width: 0;
}
.agent-fields select {
  margin-top: 9px;
}
.agent-hint {
  font-size: 12px;
  line-height: 1.8;
  color: var(--color-text-tertiary);
  margin: 14px 0;
}
.agent-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin: 20px 0;
}
.agent-actions .neu-button {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 40px;
  font-size: 12px;
}
.agent-json {
  min-height: 300px;
  resize: vertical;
  font:
    12px/1.7 Consolas,
    monospace;
  white-space: pre;
  overflow: auto;
  margin-top: 12px;
}
.agent-file-button {
  position: relative;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  min-height: 38px;
  font-size: 12px;
  cursor: pointer;
}
.agent-file-button input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
  width: 100%;
}
.agent-file-button:focus-within {
  outline: 2px solid var(--color-accent);
  outline-offset: 3px;
}
.agent-message {
  padding: 12px 14px;
  background: var(--color-surface-hover);
  border-radius: 10px;
  font-size: 12px;
  line-height: 1.8;
  overflow-wrap: anywhere;
}
.agent-message.is-error {
  color: var(--color-danger);
  border: 1px solid var(--color-danger);
}
.agent-result {
  margin-top: 28px;
  padding-top: 22px;
  border-top: 1px solid var(--color-border);
}
.agent-result h3 {
  font-size: 15px;
  font-weight: 600;
}
.agent-state {
  font-size: 11px;
  color: var(--color-text-tertiary);
}
.agent-result iframe {
  display: block;
  width: 100%;
  height: 440px;
  margin-top: 16px;
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: 12px;
}
.agent-note {
  margin-top: 24px;
  font-size: 12px;
  line-height: 1.85;
  color: var(--color-text-secondary);
}
.agent-note summary {
  cursor: pointer;
  font-weight: 600;
}
.agent-note p {
  margin: 10px 0;
}
.agent-note pre {
  font:
    11px/1.8 Consolas,
    monospace;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  padding: 14px;
  border-radius: 10px;
  box-shadow: var(--shadow-inset-soft);
}
.agent-image-intro {
  padding: 20px 0;
  color: var(--color-text-secondary);
}
.agent-image-intro h3 {
  font-size: 21px;
  color: var(--color-text);
  margin: 14px 0 10px;
}
.agent-image-intro p {
  font-size: 13px;
  line-height: 1.9;
  max-width: 34em;
}
.agent-image-upload {
  width: 100%;
  min-height: 46px;
}
.agent-image {
  margin-top: 20px;
}
.agent-image img {
  width: 100%;
  height: auto;
  border-radius: 10px;
}
.agent-image figcaption {
  font-size: 11px;
  line-height: 1.8;
  color: var(--color-text-tertiary);
  margin-top: 10px;
  overflow-wrap: anywhere;
}
@media (max-width: 600px) {
  .agent-panel {
    padding: 22px 16px;
  }
  .agent-heading h2 {
    font-size: 23px;
  }
  .agent-result iframe {
    height: 360px;
  }
  .agent-fields {
    gap: 12px;
  }
  .agent-intro {
    margin: 14px 0 16px;
  }
}
</style>
