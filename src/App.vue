<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, onUnmounted, ref, watch } from 'vue'
import { useEditorStore } from '@/stores/editor'
import { useThemeStore } from '@/stores/theme'
import { useUiStore } from '@/stores/ui'
import { useDraftStore } from '@/stores/drafts'
import { renderMarkdown } from '@/utils/markdownRenderer'
import { validateWechatHtml } from '@/utils/wechatHtml'
import { useMarkdownAnalyzer } from '@/composables/useMarkdownAnalyzer'
import { useMarkdownWarnings } from '@/composables/useMarkdownWarnings'
import { useClipboard } from '@/composables/useClipboard'
import { useExport } from '@/composables/useExport'
import { useBreakpoint } from '@/composables/useBreakpoint'
import { welcomeMarkdown } from '@/config/templates'
import packageInfo from '../package.json'
import AppHeader from '@/components/AppHeader.vue'
import PreviewPane from '@/components/PreviewPane.vue'
import SettingsPanel from '@/components/SettingsPanel.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import AsyncPaneState from '@/components/AsyncPaneState.vue'

const EditorPane = defineAsyncComponent({
  loader: () => import('@/components/EditorPane.vue'),
  loadingComponent: AsyncPaneState,
  errorComponent: AsyncPaneState,
  delay: 120,
  timeout: 20_000,
  onError: (_error, retry, fail, attempts) => {
    if (attempts <= 2) {
      window.setTimeout(retry, attempts * 500)
    } else {
      fail()
    }
  },
})
const PreflightModal = defineAsyncComponent(() => import('@/components/modals/PreflightModal.vue'))
const FeedbackModal = defineAsyncComponent(() => import('@/components/modals/FeedbackModal.vue'))

const editorStore = useEditorStore()
const themeStore = useThemeStore()
const ui = useUiStore()
const draftStore = useDraftStore()
const { isMobile } = useBreakpoint()
const { copyRenderedHtml } = useClipboard()
const { exportHtml } = useExport()

watch(
  () => ui.colorMode,
  (mode) => {
    document.documentElement.classList.toggle('dark', mode === 'dark')
    document.documentElement.style.colorScheme = mode
  },
  { immediate: true },
)

// Mobile tab state: 'editor' | 'preview' | 'inspector'
const mobileTab = ref<'editor' | 'preview' | 'inspector'>('editor')
const draftSaveRevision = ref(0)
const draftSaveFailed = ref(false)

const content = computed({
  get: () => editorStore.content,
  set: (v) => editorStore.setContent(v),
})

function recordDraftSave(saved: boolean) {
  draftSaveFailed.value = !saved || Boolean(editorStore.persistenceError)
  draftSaveRevision.value += 1
}

function warnBeforeUnsavedExit(event: BeforeUnloadEvent) {
  if (!draftStore.persistenceError && !editorStore.persistenceError) return
  event.preventDefault()
  event.returnValue = ''
}

function handleGlobalKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    if (ui.activeModals.feedback) {
      ui.closeModal('feedback')
      return
    }
    if (ui.activeModals.preflight) {
      ui.closeModal('preflight')
    }
    return
  }
  if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'c') {
    event.preventDefault()
    if (renderError.value) {
      ui.showToast(renderError.value, 'error')
      return
    }
    const hasBlocking = warnings.value.some((w) => w.level === 'danger')
    if (hasBlocking) {
      ui.openModal('preflight')
    } else {
      copyRenderedHtml(renderedHtml.value)
    }
  }
}

onMounted(() => {
  const initialContent = draftStore.initializeWorkspace(
    editorStore.content,
    welcomeMarkdown,
    editorStore.recovery,
  )
  if (initialContent !== editorStore.content) {
    editorStore.setContent(initialContent)
  }
  recordDraftSave(!draftStore.persistenceError)
  document.addEventListener('keydown', handleGlobalKeydown)
  window.addEventListener('beforeunload', warnBeforeUnsavedExit)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleGlobalKeydown)
  window.removeEventListener('beforeunload', warnBeforeUnsavedExit)
})

watch(
  () => draftStore.persistenceError || editorStore.persistenceError,
  (error, previousError) => {
    draftSaveFailed.value = Boolean(error)
    if (error && error !== previousError) ui.showToast(error, 'error')
  },
  { immediate: true },
)

const { stats } = useMarkdownAnalyzer(content)
const { warnings: markdownWarnings } = useMarkdownWarnings(content)
const scrollRatio = ref<number>()

const renderResult = computed(() => {
  try {
    const html = renderMarkdown(content.value, themeStore.themeBase, themeStore.currentCodeTheme)
    return { html, issues: validateWechatHtml(html).issues, error: '' }
  } catch (error) {
    const message = error instanceof Error ? error.message : '渲染未能完成，请缩短原稿后重试。'
    return { html: '', issues: [], error: `预览已暂停：${message} 原稿已保留。` }
  }
})
const renderedHtml = computed(() => renderResult.value.html)
const renderError = computed(() => renderResult.value.error)
const warnings = computed(() => [
  ...markdownWarnings.value,
  ...renderResult.value.issues,
  ...(renderError.value ? [{ level: 'danger' as const, text: renderError.value }] : []),
])
const preflightCounts = computed(() => ({
  danger: warnings.value.filter((warning) => warning.level === 'danger').length,
  warn: warnings.value.filter((warning) => warning.level === 'warn').length,
  info: warnings.value.filter((warning) => warning.level === 'info').length,
}))
const feedbackDiagnostics = computed(() => ({
  appVersion: packageInfo.version,
  runtime: window.electronAPI ? 'Electron' : 'Web',
  platform: window.electronAPI?.platform || navigator.platform || 'unknown',
  viewport: `${window.innerWidth}x${window.innerHeight}`,
  theme: themeStore.themeBase.designKey || 'qiuhe',
  articleStats: `${stats.value.wordCount} 字，${stats.value.headings} 个标题，${stats.value.images} 张图片`,
  warnings: `${preflightCounts.value.danger} 严重，${preflightCounts.value.warn} 提醒，${preflightCounts.value.info} 信息`,
  pageUrl: window.location.href,
}))

function loadSample() {
  editorStore.setContent(welcomeMarkdown)
  ui.showToast('已加载欢迎文本')
}

function handleExport() {
  if (renderError.value) {
    ui.showToast(renderError.value, 'error')
    return
  }
  try {
    exportHtml(renderedHtml.value)
    ui.showToast('已发起 HTML 下载')
  } catch {
    ui.showToast('HTML 导出失败，请重试或检查浏览器下载权限。', 'error')
  }
}

watch(
  () => content.value,
  (v) => {
    recordDraftSave(draftStore.updateActiveDraft(v))
  },
)
</script>

<template>
  <AppHeader
    :rendered-html="renderedHtml"
    :warnings="warnings"
    :stats="stats"
    :render-error="renderError"
    @export-html="handleExport"
    @feedback="ui.openModal('feedback')"
  />

  <!-- Desktop layout: Editor | Settings | Preview -->
  <template v-if="!isMobile">
    <main
      class="desktop-workspace mx-auto w-full gap-3 px-4 py-3 min-h-0"
      style="height: calc(100dvh - 64px)"
    >
      <EditorPane
        v-model="content"
        :save-revision="draftSaveRevision"
        :save-failed="draftSaveFailed"
        class="min-h-0 min-w-0"
        @load-sample="loadSample"
        @scroll="(r: number) => (scrollRatio = r)"
      />
      <SettingsPanel :stats="stats" :warnings="warnings" class="min-h-0 min-w-0" />
      <PreviewPane
        :html="renderedHtml"
        :error="renderError"
        :scroll-ratio="scrollRatio"
        class="min-h-0 min-w-0"
      />
    </main>
  </template>

  <!-- Mobile layout -->
  <template v-else>
    <main
      class="flex flex-col min-h-0 w-full max-w-[100vw] overflow-hidden"
      style="height: calc(100dvh - 64px - 48px - env(safe-area-inset-bottom, 0px))"
    >
      <div v-show="mobileTab === 'editor'" class="flex-1 min-h-0 w-full min-w-0">
        <EditorPane
          v-model="content"
          :save-revision="draftSaveRevision"
          :save-failed="draftSaveFailed"
          class="h-full min-h-0 w-full min-w-0"
          @load-sample="loadSample"
        />
      </div>
      <PreviewPane
        v-show="mobileTab === 'preview'"
        :html="renderedHtml"
        :error="renderError"
        :scroll-ratio="1"
        class="flex-1 min-h-0 w-full min-w-0"
      />
      <div
        v-show="mobileTab === 'inspector'"
        class="flex-1 min-h-0 w-full min-w-0 overflow-y-auto p-3"
      >
        <SettingsPanel :stats="stats" :warnings="warnings" class="!w-full" />
      </div>
    </main>

    <!-- Mobile tab bar -->
    <nav class="mobile-nav safe-area-bottom" aria-label="工作区切换">
      <button
        v-for="tab in ['editor', 'preview', 'inspector'] as const"
        :key="tab"
        type="button"
        class="mobile-nav__button"
        :class="mobileTab === tab ? 'mobile-nav__button--active' : ''"
        :aria-current="mobileTab === tab ? 'page' : undefined"
        @click="mobileTab = tab"
      >
        <AppIcon
          :name="tab === 'editor' ? 'pencil' : tab === 'preview' ? 'eye' : 'settings'"
          :size="18"
        />
        <span class="text-[10px] font-medium">{{
          tab === 'editor' ? '编辑' : tab === 'preview' ? '预览' : '设置'
        }}</span>
      </button>
    </nav>
  </template>

  <Teleport to="body">
    <TransitionGroup
      name="toast"
      tag="div"
      class="fixed bottom-5 right-5 z-[1000] flex flex-col gap-2"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div
        v-for="toast in ui.toasts"
        :key="toast.id"
        class="px-5 py-3 rounded-md bg-surface shadow-xl text-sm font-medium max-w-[360px] leading-relaxed"
        :class="{
          'text-success': toast.type === 'success',
          'text-danger': toast.type === 'error',
          'text-accent': toast.type === 'info',
          'text-warning': toast.type === 'warning',
        }"
      >
        {{ toast.message }}
      </div>
    </TransitionGroup>
  </Teleport>

  <PreflightModal
    :warnings="warnings"
    :counts="preflightCounts"
    :html="renderedHtml"
    :render-error="renderError"
  />
  <FeedbackModal
    :open="Boolean(ui.activeModals.feedback)"
    :diagnostics="feedbackDiagnostics"
    @close="ui.closeModal('feedback')"
  />
</template>

<style scoped>
.desktop-workspace {
  max-width: min(1760px, 100vw);
  display: grid;
  grid-template-columns: minmax(520px, 1fr) minmax(340px, 0.62fr) 679px;
  align-items: stretch;
}

@media (max-width: 1599px) {
  .desktop-workspace {
    grid-template-columns: minmax(320px, 1.15fr) minmax(292px, 0.85fr) minmax(440px, 1fr);
  }
}

@media (max-width: 1060px) {
  .desktop-workspace {
    grid-template-columns: minmax(280px, 1.05fr) minmax(272px, 0.95fr) minmax(340px, 0.9fr);
  }
}

.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom, 0);
}

.mobile-nav {
  position: fixed;
  inset: auto 0 0;
  z-index: 50;
  width: 100%;
  max-width: 100vw;
  height: calc(48px + env(safe-area-inset-bottom, 0px));
  display: flex;
  align-items: stretch;
  overflow: hidden;
  border-top: 1px solid var(--color-border-subtle);
  background: color-mix(in srgb, var(--color-surface) 94%, transparent);
  box-shadow: 0 -4px 14px rgb(0 0 0 / 0.04);
  backdrop-filter: blur(14px);
}

.mobile-nav__button {
  position: relative;
  flex: 1;
  min-width: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  color: var(--color-text-tertiary);
  transition:
    color 0.16s ease,
    background 0.16s ease;
}

.mobile-nav__button::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  width: 30px;
  height: 2px;
  background: transparent;
  transform: translateX(-50%);
}

.mobile-nav__button--active {
  color: var(--color-accent);
  background: color-mix(in srgb, var(--color-accent) 5%, transparent);
}

.mobile-nav__button--active::before {
  background: var(--color-accent);
}

.mobile-nav__button:focus {
  outline: none;
}

.mobile-nav__button:focus-visible {
  box-shadow: inset 0 0 0 2px var(--color-focus-ring);
}
</style>
