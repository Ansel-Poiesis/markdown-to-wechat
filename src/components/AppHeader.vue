<script setup lang="ts">
import { computed } from 'vue'
import { useUiStore } from '@/stores/ui'
import { useClipboard } from '@/composables/useClipboard'
import AppIcon from '@/components/ui/AppIcon.vue'
import type { WarningItem, MarkdownStats } from '@/types'

const props = defineProps<{
  renderedHtml: string
  warnings: WarningItem[]
  stats: MarkdownStats
  renderError?: string
  agentControlOpen?: boolean
}>()

const emit = defineEmits<{ exportHtml: []; feedback: []; 'agent-control': [] }>()

const ui = useUiStore()
const { copyRenderedHtml } = useClipboard()

const hasBlockingWarnings = computed(() => props.warnings.some((w) => w.level === 'danger'))

async function handleCopy() {
  if (props.renderError) return
  if (hasBlockingWarnings.value) {
    ui.openModal('preflight')
    return
  }
  await copyRenderedHtml(props.renderedHtml)
}

function handleExport() {
  if (props.renderError) return
  emit('exportHtml')
}
</script>

<template>
  <header class="app-header">
    <div class="app-header__inner">
      <div class="app-header__brand">
        <span class="app-header__mark" aria-hidden="true"
          ><AppIcon name="fileText" :size="20"
        /></span>
        <div class="app-header__identity">
          <h1 class="app-header__title">
            Markdown<span class="app-header__full-name"> 渲染器</span>
          </h1>
          <span class="app-header__caption">排版工作台</span>
        </div>
      </div>

      <div class="app-header__stats">
        <span class="flex items-center gap-1.5 tabular-nums" title="全文字数">
          <strong class="text-text font-bold text-sm">{{ stats.wordCount }}</strong>
          <span>字</span>
        </span>
        <span class="w-px h-3 bg-border mx-2" />
        <span class="flex items-center gap-1.5 tabular-nums" title="预计阅读时长">
          <strong class="text-text font-bold text-sm">{{ stats.readingMinutes }}</strong>
          <span>分钟</span>
        </span>
        <span class="w-px h-3 bg-border mx-2" />
        <span class="flex items-center gap-1.5 tabular-nums" title="标题数量">
          <strong class="text-text font-bold text-sm">{{ stats.headings }}</strong>
          <span>标题</span>
        </span>
        <span class="w-px h-3 bg-border mx-2" />
        <span class="flex items-center gap-1.5 tabular-nums" title="图片数量">
          <strong class="text-text font-bold text-sm">{{ stats.images }}</strong>
          <span>图片</span>
        </span>
      </div>

      <div class="app-header__actions">
        <button
          type="button"
          class="header-agent-button"
          title="Agent 控制台"
          aria-label="Agent 控制台"
          aria-haspopup="dialog"
          :aria-expanded="Boolean(agentControlOpen)"
          @click="emit('agent-control')"
        >
          <AppIcon name="agent" :size="17" />
          <span class="header-agent-button__label">Agent</span>
        </button>
        <button
          type="button"
          class="header-icon-button"
          title="提交反馈"
          aria-label="提交反馈"
          @click="emit('feedback')"
        >
          <AppIcon name="messageSquare" :size="15" />
        </button>
        <button
          type="button"
          class="header-icon-button"
          :title="ui.colorMode === 'dark' ? '切换到日间模式' : '切换到夜间模式'"
          :aria-label="ui.colorMode === 'dark' ? '切换到日间模式' : '切换到夜间模式'"
          @click="ui.toggleColorMode()"
        >
          <AppIcon :name="ui.colorMode === 'dark' ? 'sun' : 'moon'" :size="15" />
        </button>
        <button
          type="button"
          class="header-secondary-button"
          title="导出 HTML"
          aria-label="导出 HTML"
          :disabled="Boolean(renderError)"
          @click="handleExport"
        >
          <AppIcon name="download" :size="14" />
          <span class="hidden sm:inline">导出</span>
        </button>
        <button
          type="button"
          class="header-primary-button"
          title="复制到公众号"
          aria-label="复制到公众号"
          :disabled="Boolean(renderError)"
          @click="handleCopy"
        >
          <AppIcon name="copy" :size="14" />
          <span class="hidden sm:inline">复制到公众号</span>
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 40;
  width: 100%;
  max-width: 100vw;
  height: 64px;
  background: var(--color-bg);
}

.app-header__inner {
  width: 100%;
  max-width: min(1760px, 100vw);
  height: 100%;
  margin: 0 auto;
  padding: 0 22px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 28px;
}

.app-header__brand {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.app-header__mark {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border-radius: 11px;
  color: var(--color-accent);
  box-shadow: var(--shadow-inset);
}

.app-header__identity {
  min-width: 0;
}

.app-header__caption {
  display: block;
  margin-top: 3px;
  color: var(--color-text-tertiary);
  font-size: 10px;
  letter-spacing: 0.13em;
  line-height: 1;
}

.app-header__title {
  margin: 0;
  color: var(--color-text);
  font-size: 17px;
  line-height: 1.15;
  font-weight: 650;
  letter-spacing: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-header__stats {
  display: flex;
  align-items: center;
  gap: 4px;
  justify-self: center;
  color: var(--color-text-secondary);
  padding: 8px 0;
  font-size: 11px;
}

.app-header__actions {
  min-width: 0;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 9px;
}

.header-icon-button,
.header-secondary-button,
.header-primary-button,
.header-agent-button {
  height: 36px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 13px;
  line-height: 1;
  flex-shrink: 0;
  white-space: nowrap;
  transition:
    background 0.16s ease,
    border-color 0.16s ease,
    color 0.16s ease,
    transform 0.16s ease;
}

.header-icon-button {
  width: 36px;
  color: var(--color-text-secondary);
  background: transparent;
  border: 1px solid transparent;
}

.header-secondary-button {
  min-width: 36px;
  padding: 0 12px;
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid transparent;
  box-shadow: var(--shadow-control);
  font-weight: 550;
}

.header-primary-button {
  min-width: 40px;
  padding: 0 15px;
  color: var(--color-accent-contrast);
  background: var(--color-accent);
  border: 1px solid transparent;
  box-shadow: 3px 3px 7px var(--neo-dark);
  font-weight: 600;
}

.header-agent-button {
  min-width: 36px;
  padding: 0 12px;
  color: var(--color-accent);
  background: var(--color-surface);
  border: 1px solid transparent;
  box-shadow: var(--shadow-control);
  font-weight: 600;
}

.header-agent-button:hover,
.header-agent-button[aria-expanded='true'] {
  background: var(--color-surface-pressed);
  box-shadow: var(--shadow-inset);
}

.header-icon-button:hover,
.header-secondary-button:hover {
  color: var(--color-text);
  background: var(--color-surface-hover);
}

.header-secondary-button:disabled,
.header-primary-button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  box-shadow: none;
}

.header-primary-button:hover:not(:disabled) {
  background: var(--color-accent-hover);
  border-color: var(--color-accent-hover);
}

.header-icon-button:active,
.header-secondary-button:active,
.header-primary-button:active:not(:disabled),
.header-agent-button:active {
  transform: translateY(1px);
}

.header-icon-button:focus,
.header-secondary-button:focus,
.header-primary-button:focus,
.header-agent-button:focus {
  outline: none;
}

.header-icon-button:focus-visible,
.header-secondary-button:focus-visible,
.header-primary-button:focus-visible,
.header-agent-button:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 3px;
}

@media (max-width: 1179px) {
  .app-header__stats {
    display: none;
  }

  .app-header__inner {
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 10px;
    padding: 0 12px;
  }

  .app-header__title {
    font-size: 16px;
  }

  .app-header__actions {
    gap: 6px;
  }

  .header-secondary-button,
  .header-primary-button {
    padding: 0 10px;
  }
}

@media (max-width: 639px) {
  .app-header__inner {
    padding: 0 12px;
    gap: 8px;
  }
  .app-header__brand {
    gap: 8px;
  }
  .app-header__full-name,
  .app-header__caption,
  .header-agent-button__label {
    display: none;
  }
  .app-header__title {
    font-size: 15px;
  }
  .app-header__actions {
    gap: 4px;
  }
  .header-agent-button,
  .header-secondary-button,
  .header-primary-button {
    width: 34px;
    min-width: 34px;
    padding: 0;
  }
  .header-icon-button {
    width: 30px;
  }
}

@media (max-width: 359px) {
  .app-header__mark {
    display: none;
  }
  .app-header__inner {
    padding: 0 10px;
  }
}
</style>
