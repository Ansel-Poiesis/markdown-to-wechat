<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useEditorStore } from '@/stores/editor'
import { useThemeStore } from '@/stores/theme'
import { useSettingsStore } from '@/stores/settings'
import { useUiStore } from '@/stores/ui'
import { renderMarkdown } from '@/utils/markdownRenderer'
import { useMarkdownAnalyzer } from '@/composables/useMarkdownAnalyzer'
import { useMarkdownWarnings } from '@/composables/useMarkdownWarnings'
import AppHeader from '@/components/AppHeader.vue'
import EditorPane from '@/components/EditorPane.vue'
import PreviewPane from '@/components/PreviewPane.vue'
import InspectorPane from '@/components/InspectorPane.vue'
import DraftModal from '@/components/modals/DraftModal.vue'
import PreflightModal from '@/components/modals/PreflightModal.vue'
import ThemeEditorModal from '@/components/modals/ThemeEditorModal.vue'
import ShortcutModal from '@/components/modals/ShortcutModal.vue'

const editorStore = useEditorStore()
const themeStore = useThemeStore()
const settingsStore = useSettingsStore()
const ui = useUiStore()

const content = computed({
  get: () => editorStore.content,
  set: (v) => editorStore.setContent(v),
})

const { stats } = useMarkdownAnalyzer(content)
const { warnings, preflightCounts } = useMarkdownWarnings(content)

const renderedHtml = computed(() => {
  return renderMarkdown(
    content.value,
    themeStore.themeBase,
    themeStore.currentCodeTheme,
  )
})

onMounted(() => {
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (ui.activeModals.shortcut) { ui.closeModal('shortcut'); return }
      if (ui.activeModals.preflight) { ui.closeModal('preflight'); return }
      if (ui.activeModals.themeEditor) { ui.closeModal('themeEditor'); return }
      if (ui.activeModals.draft) { ui.closeModal('draft'); return }
      return
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
      event.preventDefault()
      editorStore.saveDraft()
      ui.showToast('已保存')
    }
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'c') {
      event.preventDefault()
      ui.openModal('preflight')
    }
    if ((event.ctrlKey || event.metaKey) && event.key === '/') {
      event.preventDefault()
      ui.openModal('shortcut')
    }
  })
})
</script>

<template>
  <AppHeader />
  <main
    class="grid gap-4 p-4 min-h-0"
    :class="[
      settingsStore.isFocusPreview
        ? 'grid-cols-[minmax(360px,1fr)_minmax(280px,320px)]'
        : 'grid-cols-[minmax(320px,1fr)_minmax(360px,520px)_minmax(240px,280px)]',
    ]"
    style="height: calc(100dvh - 64px)"
  >
    <EditorPane v-show="!settingsStore.isFocusPreview" v-model="content" />
    <PreviewPane :html="renderedHtml" />
    <InspectorPane v-show="!settingsStore.isFocusPreview" :stats="stats" :warnings="warnings" />
  </main>

  <Teleport to="body">
    <TransitionGroup name="toast" tag="div" class="fixed bottom-5 right-5 z-[1000] flex flex-col gap-2">
      <div
        v-for="toast in ui.toasts"
        :key="toast.id"
        class="px-5 py-3 rounded-md bg-surface shadow-xl text-sm font-medium max-w-[360px] leading-relaxed"
        :class="toast.type === 'success' ? 'text-success' : 'text-danger'"
      >
        {{ toast.message }}
      </div>
    </TransitionGroup>
  </Teleport>

  <DraftModal />
  <PreflightModal :warnings="warnings" :counts="preflightCounts" :html="renderedHtml" />
  <ThemeEditorModal />
  <ShortcutModal />
</template>
