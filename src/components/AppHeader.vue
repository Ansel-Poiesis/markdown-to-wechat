<script setup lang="ts">
import { computed } from 'vue'
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from 'radix-vue'
import { useEditorStore } from '@/stores/editor'
import { useThemeStore } from '@/stores/theme'
import { useUiStore } from '@/stores/ui'
import { useSmartFormat } from '@/composables/useSmartFormat'
import { useShare } from '@/composables/useShare'
import { useExport } from '@/composables/useExport'
import { renderMarkdown } from '@/utils/markdownRenderer'
import { sampleMarkdown } from '@/config/templates'
import { codeThemes } from '@/config/themes'

const editorStore = useEditorStore()
const themeStore = useThemeStore()
const ui = useUiStore()
const { formatMarkdown } = useSmartFormat()
const { createShareLink } = useShare()
const { exportHtml } = useExport()

const isDark = computed(() => themeStore.isDark)
const codeThemeList = computed(() => Object.entries(codeThemes))

function toggleDark() {
  themeStore.toggleDarkMode()
}

function handleSmartFormat() {
  const original = editorStore.content
  const formatted = formatMarkdown(original)
  if (formatted === original) return
  editorStore.setContent(formatted)
  ui.showToast('智能排版完成')
}

function loadSample() {
  editorStore.setContent(sampleMarkdown)
  ui.showToast('已加载示例内容')
}

async function handleShare() {
  const link = await createShareLink(editorStore.content)
  if (!link) return
  try {
    await navigator.clipboard.writeText(link)
    ui.showToast('分享链接已复制')
  } catch {
    window.prompt('分享链接已生成，请复制：', link)
  }
}

function handleCopy() {
  ui.openModal('preflight')
}

function handleExport() {
  const html = renderMarkdown(editorStore.content, themeStore.themeBase, themeStore.currentCodeTheme)
  exportHtml(html)
  ui.showToast('HTML 已导出')
}

function selectCodeTheme(key: string) {
  themeStore.currentCodeThemeKey = key
}
</script>

<template>
  <header
    class="flex items-center justify-between gap-4 h-16 px-5 sticky top-0 z-50 backdrop-blur-xl bg-white/72 dark:bg-[#09090b]/72 border-b border-border-subtle"
  >
    <div>
      <p class="text-[11px] font-semibold tracking-widest uppercase text-text-tertiary mb-0.5">
        Markdown to WeChat
      </p>
      <h1 class="text-lg font-semibold tracking-tight leading-tight">
        微信公众号排版渲染工具
      </h1>
    </div>
    <div class="flex items-center gap-2">
      <!-- Settings Dropdown -->
      <DropdownMenuRoot>
        <DropdownMenuTrigger as-child>
          <button
            type="button"
            class="w-9 h-9 flex items-center justify-center rounded-md text-text-secondary hover:bg-surface-hover hover:text-text text-base border border-border-subtle hover:border-border transition-all bg-transparent"
            aria-label="设置"
          >
            ⚙️
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuPortal>
          <DropdownMenuContent
            align="end"
            side-offset="6"
            class="min-w-[240px] p-2 rounded-xl bg-surface shadow-lg border border-border-subtle dark:border-border z-[200] outline-none transition-all duration-150 ease-out data-[state=open]:opacity-100 data-[state=open]:scale-100 data-[state=closed]:opacity-0 data-[state=closed]:scale-[0.98]"
          >
            <DropdownMenuLabel class="px-2 py-1.5 text-[11px] font-semibold tracking-widest uppercase text-text-tertiary select-none">
              代码主题
            </DropdownMenuLabel>
            <DropdownMenuRadioGroup
              :value="themeStore.currentCodeThemeKey"
              @update:value="selectCodeTheme"
            >
              <DropdownMenuRadioItem
                v-for="[key, theme] in codeThemeList"
                :key="key"
                :value="key"
                class="flex items-center gap-2 px-2 py-2 rounded-md text-[13px] font-medium text-text outline-none hover:bg-surface-hover focus:bg-surface-hover select-none data-[state=checked]:text-accent"
              >
                <span class="w-2 h-2 rounded-full shrink-0" :style="{ background: theme.accent || theme.keyword }" />
                {{ theme.name }}
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>

            <DropdownMenuSeparator class="h-px bg-border-subtle dark:bg-border my-2 mx-2" />

            <DropdownMenuItem
              class="flex items-center gap-2 px-2 py-2 rounded-md text-[13px] font-medium text-text outline-none hover:bg-surface-hover focus:bg-surface-hover select-none"
              @click="ui.openModal('themeEditor')"
            >
              🎨 编辑我的主题
            </DropdownMenuItem>
            <DropdownMenuItem
              class="flex items-center gap-2 px-2 py-2 rounded-md text-[13px] font-medium text-text outline-none hover:bg-surface-hover focus:bg-surface-hover select-none"
              @click="ui.openModal('shortcut')"
            >
              ⌨️ 快捷键
            </DropdownMenuItem>

            <DropdownMenuSeparator class="h-px bg-border-subtle dark:bg-border my-2 mx-2" />

            <DropdownMenuItem
              class="flex items-center gap-2 px-2 py-2 rounded-md text-[13px] font-medium text-text outline-none hover:bg-surface-hover focus:bg-surface-hover select-none"
              @click="handleExport"
            >
              📤 导出 HTML
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenuPortal>
      </DropdownMenuRoot>

      <button
        type="button"
        class="w-9 h-9 flex items-center justify-center rounded-md text-text-secondary hover:bg-surface-hover hover:text-text text-base border border-border-subtle hover:border-border transition-all bg-transparent"
        aria-label="草稿管理"
        @click="ui.openModal('draft')"
      >
        📝
      </button>
      <button
        type="button"
        class="w-9 h-9 flex items-center justify-center rounded-md text-text-secondary hover:bg-surface-hover hover:text-text text-base border border-border-subtle hover:border-border transition-all bg-transparent"
        aria-label="分享"
        @click="handleShare"
      >
        🔗
      </button>
      <button
        type="button"
        class="w-9 h-9 flex items-center justify-center rounded-md text-text-secondary hover:bg-surface-hover hover:text-text text-base border border-border-subtle hover:border-border transition-all bg-transparent"
        aria-label="深色模式"
        @click="toggleDark"
      >
        {{ isDark ? '☀️' : '🌙' }}
      </button>
      <button
        type="button"
        class="h-9 px-3.5 rounded-md text-[13px] font-medium border border-border-subtle hover:bg-surface-hover hover:border-border bg-transparent transition-all"
        @click="handleSmartFormat"
      >
        智能排版
      </button>
      <button
        type="button"
        class="h-9 px-3.5 rounded-md text-[13px] font-medium border border-border-subtle hover:bg-surface-hover hover:border-border bg-transparent transition-all"
        @click="loadSample"
      >
        示例
      </button>
      <button
        type="button"
        class="h-9 px-3.5 rounded-md text-[13px] font-medium bg-accent text-accent-contrast hover:bg-accent-hover border border-accent hover:border-accent-hover transition-all"
        @click="handleCopy"
      >
        复制到公众号
      </button>
    </div>
  </header>
</template>
