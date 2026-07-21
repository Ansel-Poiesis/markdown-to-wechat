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
import { useSmartFormat } from '@/composables/useSmartFormat'
import { useExport } from '@/composables/useExport'
import { useBreakpoint } from '@/composables/useBreakpoint'
import { sampleMarkdown } from '@/config/templates'
import AppHeader from '@/components/AppHeader.vue'
import PreviewPane from '@/components/PreviewPane.vue'
import AppIcon from '@/components/ui/AppIcon.vue'

const EditorPane = defineAsyncComponent(() => import('@/components/EditorPane.vue'))
const SettingsPanel = defineAsyncComponent(() => import('@/components/SettingsPanel.vue'))
const PreflightModal = defineAsyncComponent(() => import('@/components/modals/PreflightModal.vue'))

const editorStore = useEditorStore()
const themeStore = useThemeStore()
const ui = useUiStore()
const draftStore = useDraftStore()
const { isMobile } = useBreakpoint()
const { copyRenderedHtml } = useClipboard()
const { formatMarkdown } = useSmartFormat()
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

const content = computed({
  get: () => editorStore.content,
  set: (v) => editorStore.setContent(v),
})

function handleGlobalKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    if (ui.activeModals.preflight) {
      ui.closeModal('preflight')
    }
    return
  }
  if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'c') {
    event.preventDefault()
    const hasBlocking = warnings.value.some((w) => w.level === 'danger')
    if (hasBlocking) {
      ui.openModal('preflight')
    } else {
      copyRenderedHtml(renderedHtml.value)
    }
  }
}

onMounted(() => {
  draftStore.loadDrafts()
  if (draftStore.activeDraft) {
    editorStore.setContent(draftStore.activeDraft.content)
  } else if (editorStore.content.trim()) {
    draftStore.updateActiveDraft(editorStore.content)
  }
  document.addEventListener('keydown', handleGlobalKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleGlobalKeydown)
})

const { stats } = useMarkdownAnalyzer(content)
const { warnings: markdownWarnings } = useMarkdownWarnings(content)
const scrollRatio = ref<number>()

const renderedHtml = computed(() => {
  return renderMarkdown(content.value, themeStore.themeBase, themeStore.currentCodeTheme)
})

const htmlValidation = computed(() => validateWechatHtml(renderedHtml.value))
const warnings = computed(() => [...markdownWarnings.value, ...htmlValidation.value.issues])
const preflightCounts = computed(() => ({
  danger: warnings.value.filter((warning) => warning.level === 'danger').length,
  warn: warnings.value.filter((warning) => warning.level === 'warn').length,
  info: warnings.value.filter((warning) => warning.level === 'info').length,
}))

function loadSample() {
  editorStore.setContent(sampleMarkdown)
  ui.showToast('已加载示例内容')
}

function handleExport() {
  const html = renderMarkdown(
    editorStore.content,
    themeStore.themeBase,
    themeStore.currentCodeTheme,
  )
  exportHtml(html)
  ui.showToast('HTML 已导出')
}

watch(
  () => content.value,
  (v, oldV) => {
    if (oldV === '' && v.length > 0) {
      const formatted = formatMarkdown(v)
      if (formatted !== v) {
        editorStore.setContent(formatted)
        draftStore.updateActiveDraft(formatted)
        return
      }
    }
    draftStore.updateActiveDraft(v)
  },
)
</script>

<template>
  <AppHeader
    :rendered-html="renderedHtml"
    :warnings="warnings"
    :stats="stats"
    @export-html="handleExport"
  />

  <!-- Desktop layout: Editor | Settings | Preview -->
  <template v-if="!isMobile">
    <main
      class="desktop-workspace mx-auto w-full gap-3 px-4 py-3 min-h-0"
      style="height: calc(100dvh - 64px)"
    >
      <EditorPane
        v-model="content"
        class="min-h-0 min-w-0"
        @load-sample="loadSample"
        @scroll="(r: number) => (scrollRatio = r)"
      />
      <SettingsPanel :stats="stats" :warnings="warnings" class="min-h-0 min-w-0" />
      <PreviewPane :html="renderedHtml" :scroll-ratio="scrollRatio" class="min-h-0 min-w-0" />
    </main>
  </template>

  <!-- Mobile layout -->
  <template v-else>
    <main
      class="flex flex-col min-h-0 w-full max-w-[100vw] overflow-hidden"
      style="height: calc(100dvh - 64px - 48px)"
    >
      <EditorPane
        v-show="mobileTab === 'editor'"
        v-model="content"
        class="flex-1 min-h-0 w-full min-w-0"
        @load-sample="loadSample"
      />
      <PreviewPane
        v-show="mobileTab === 'preview'"
        :html="renderedHtml"
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
    <nav
      class="fixed bottom-0 left-0 right-0 z-50 h-12 w-full max-w-[100vw] overflow-hidden bg-surface border-t border-border-subtle flex items-center justify-around safe-area-bottom"
    >
      <button
        v-for="tab in ['editor', 'preview', 'inspector'] as const"
        :key="tab"
        type="button"
        class="flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors"
        :class="mobileTab === tab ? 'text-accent' : 'text-text-tertiary'"
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

  <PreflightModal :warnings="warnings" :counts="preflightCounts" :html="renderedHtml" />
</template>

<style scoped>
.desktop-workspace {
  max-width: min(1760px, 100vw);
  display: grid;
  grid-template-columns: minmax(520px, 1fr) minmax(340px, 0.62fr) 679px;
  align-items: stretch;
}

@media (max-width: 1480px) {
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
</style>
