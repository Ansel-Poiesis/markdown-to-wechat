<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useEditorStore } from '@/stores/editor'
import { useThemeStore } from '@/stores/theme'
import { useSettingsStore } from '@/stores/settings'
import { useUiStore } from '@/stores/ui'
import { renderMarkdown } from '@/utils/markdownRenderer'
import { useMarkdownAnalyzer } from '@/composables/useMarkdownAnalyzer'
import { useMarkdownWarnings } from '@/composables/useMarkdownWarnings'
import { useClipboard } from '@/composables/useClipboard'
import { useSmartFormat } from '@/composables/useSmartFormat'
import { useExport } from '@/composables/useExport'
import { useBreakpoint } from '@/composables/useBreakpoint'
import { sampleMarkdown } from '@/config/templates'
import AppHeader from '@/components/AppHeader.vue'
import EditorPane from '@/components/EditorPane.vue'
import PreviewPane from '@/components/PreviewPane.vue'
import SettingsPanel from '@/components/SettingsPanel.vue'
import ChatPanel from '@/components/ChatPanel.vue'
import PreflightModal from '@/components/modals/PreflightModal.vue'

const editorStore = useEditorStore()
const themeStore = useThemeStore()
const settingsStore = useSettingsStore()
const ui = useUiStore()
const { isMobile } = useBreakpoint()
const { copyRenderedHtml } = useClipboard()
const { formatMarkdown } = useSmartFormat()
const { exportHtml } = useExport()

// Mobile tab state: 'editor' | 'preview' | 'inspector'
const mobileTab = ref<'editor' | 'preview' | 'inspector'>('editor')

const content = computed({
  get: () => editorStore.content,
  set: (v) => editorStore.setContent(v),
})

// No-op (layout fixed)

onMounted(() => {
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (ui.activeModals.preflight) {
        ui.closeModal('preflight')
        return
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
  })
})

// nothing to clean up

const { stats } = useMarkdownAnalyzer(content)
const { warnings, preflightCounts } = useMarkdownWarnings(content)
const scrollRatio = ref<number>()

const renderedHtml = computed(() => {
  return renderMarkdown(
    content.value,
    themeStore.themeBase,
    themeStore.currentCodeTheme,
    settingsStore.wechatElements,
  )
})

function loadSample() {
  editorStore.setContent(sampleMarkdown)
  ui.showToast('已加载示例内容')
}

function handleExport() {
  const html = renderMarkdown(
    editorStore.content,
    themeStore.themeBase,
    themeStore.currentCodeTheme,
    settingsStore.wechatElements,
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
      }
    }
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
      class="mx-auto max-w-[1440px] w-full grid gap-3 p-3 min-h-0"
      style="
        height: calc(100dvh - 64px);
        grid-template-columns:
          minmax(230px, 0.9fr) minmax(260px, 300px)
          minmax(360px, 1.2fr);
      "
    >
      <EditorPane
        v-model="content"
        class="min-h-0 min-w-0"
        @load-sample="loadSample"
        @scroll="(r: number) => (scrollRatio = r)"
      />
      <SettingsPanel class="min-h-0 min-w-0" />
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
        <SettingsPanel class="!w-full" />
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

  <!-- Chat panel slide-over -->
  <Transition name="chat-slide">
    <div
      v-if="ui.showChat"
      class="fixed top-0 right-0 z-[60] h-full w-[380px] max-w-[90vw] shadow-2xl border-l border-border-subtle"
    >
      <ChatPanel @close="ui.toggleChat()" />
    </div>
  </Transition>
</template>

<style scoped>
.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom, 0);
}
.chat-slide-enter-active,
.chat-slide-leave-active {
  transition: transform 0.25s ease;
}
.chat-slide-enter-from,
.chat-slide-leave-to {
  transform: translateX(100%);
}
</style>
