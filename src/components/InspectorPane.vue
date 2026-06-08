<script setup lang="ts">
import { computed, ref } from 'vue'
import { useUiStore } from '@/stores/ui'
import { useSettingsStore } from '@/stores/settings'
import { useEditorStore } from '@/stores/editor'
import { replaceLocalImages } from '@/composables/useImageReplace'
import type { MarkdownStats, WarningItem } from '@/types'
import AppIcon from '@/components/ui/AppIcon.vue'
import DraftPanel from '@/components/DraftPanel.vue'

const props = defineProps<{
  stats: MarkdownStats
  warnings: WarningItem[]
}>()

const ui = useUiStore()
const settingsStore = useSettingsStore()
const editorStore = useEditorStore()

const warningCounts = computed(() => ({
  danger: props.warnings.filter((w) => w.level === 'danger').length,
  warn: props.warnings.filter((w) => w.level === 'warn').length,
  info: props.warnings.filter((w) => w.level === 'info').length,
}))

const hasLocalImages = computed(() => props.warnings.some((w) => w.type === 'localImage'))
const imagePrefix = ref('')

function handleImageReplace() {
  if (!imagePrefix.value.trim() || !editorStore.editorView) return
  const doc =
    (
      editorStore.editorView as { state?: { doc: { toString: () => string } } }
    ).state?.doc.toString() || ''
  const { content, count } = replaceLocalImages(doc, imagePrefix.value.trim())
  if (count > 0) {
    editorStore.setContent(content)
    ui.showToast(`已替换 ${count} 张本地图片`)
    imagePrefix.value = ''
  }
}

function locateWarning(type?: string) {
  const view = editorStore.editorView as {
    state?: { doc: { toString: () => string } }
    dispatch?: (spec: unknown) => void
  } | null
  if (!view?.state?.doc || !view.dispatch) return
  const doc = view.state.doc.toString()
  const searches: Record<string, string[]> = {
    localImage: ['!['],
    emptyLink: ['[]()'],
    unclosedCode: ['```'],
    multiH1: ['# '],
    deepHeading: ['##### '],
    externalLink: ['](http'],
    manyTables: ['| '],
    longCode: ['```'],
    fewHeadings: ['# '],
    noHeading: [],
  }
  const candidates = type ? searches[type] : []
  if (!candidates?.length) return
  for (const s of candidates) {
    const idx = doc.indexOf(s)
    if (idx >= 0) {
      view.dispatch({ selection: { anchor: idx }, scrollIntoView: true })
      return
    }
  }
}
</script>

<template>
  <aside
    class="flex flex-col rounded-2xl bg-surface overflow-hidden border border-border-subtle shadow-lg"
    aria-label="创作助手"
  >
    <div class="flex-1 overflow-y-auto px-3 pb-3 space-y-3 pt-3">
      <!-- Warnings -->
      <section class="rounded-xl bg-bg/60 border border-border-subtle p-4">
        <div class="flex items-center gap-2.5 mb-3.5">
          <span class="w-7 h-7 rounded-lg bg-warning/10 flex items-center justify-center">
            <AppIcon name="alertCircle" :size="14" class="text-warning" />
          </span>
          <h2 class="text-[11px] font-semibold tracking-widest uppercase text-text-tertiary">
            质量检查
          </h2>
        </div>
        <div class="flex flex-col gap-2">
          <div
            v-for="(w, i) in warnings"
            :key="i"
            class="group flex items-start gap-2.5 p-3 rounded-xl cursor-pointer transition-all hover:brightness-[0.98]"
            :class="{
              'bg-danger-bg/70 border border-danger/15': w.level === 'danger',
              'bg-warning-bg/70 border border-warning/15': w.level === 'warn',
              'bg-info-bg/70 border border-info/15': w.level === 'info',
            }"
            @click="locateWarning(w.type)"
          >
            <span class="shrink-0 mt-0.5">
              <AppIcon v-if="w.level === 'danger'" name="warning" :size="15" class="text-danger" />
              <AppIcon
                v-else-if="w.level === 'warn'"
                name="alertCircle"
                :size="15"
                class="text-warning"
              />
              <AppIcon v-else-if="w.level === 'info'" name="info" :size="15" class="text-info" />
            </span>
            <span class="leading-relaxed flex-1 text-[13px] font-medium">{{ w.text }}</span>
            <AppIcon
              v-if="w.type"
              name="externalLink"
              :size="12"
              class="shrink-0 mt-0.5 opacity-0 group-hover:opacity-40 transition-opacity"
            />
          </div>
          <div v-if="!warnings.length" class="empty-state py-6">
            <span
              class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-success/10 mb-2.5"
            >
              <AppIcon name="checkCircle" :size="18" class="text-success" />
            </span>
            <p>当前内容没有明显的公众号兼容性风险</p>
          </div>
        </div>

        <div
          v-if="hasLocalImages"
          class="mt-3 p-3 rounded-lg border border-border-subtle dark:border-border bg-surface"
        >
          <p class="text-xs text-text-secondary mb-2.5 font-medium">批量替换本地图片路径</p>
          <div class="flex gap-2">
            <input
              v-model="imagePrefix"
              type="text"
              placeholder="https://cdn.example.com/"
              class="flex-1 min-w-0 h-9 px-3 text-[13px] rounded-lg border border-border bg-surface text-text placeholder:text-text-tertiary focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all"
              @keydown.enter="handleImageReplace"
            />
            <button
              type="button"
              class="h-9 px-4 rounded-lg text-[13px] font-medium bg-[#18181b] text-white border border-[#18181b] hover:bg-[#27272a] hover:border-[#27272a] active:scale-[0.96] transition-all inline-flex items-center justify-center gap-2 shrink-0"
              @click="handleImageReplace"
            >
              替换
            </button>
          </div>
        </div>

        <div v-if="warnings.length" class="flex items-center gap-2 mt-3">
          <span
            v-if="warningCounts.danger"
            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-danger-bg text-danger text-[11px] font-semibold"
          >
            <AppIcon name="warning" :size="10" />{{ warningCounts.danger }}
          </span>
          <span
            v-if="warningCounts.warn"
            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-warning-bg text-warning text-[11px] font-semibold"
          >
            <AppIcon name="alertCircle" :size="10" />{{ warningCounts.warn }}
          </span>
          <span
            v-if="warningCounts.info"
            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-info-bg text-info text-[11px] font-semibold"
          >
            <AppIcon name="info" :size="10" />{{ warningCounts.info }}
          </span>
        </div>
      </section>

      <!-- WeChat Elements -->
      <section class="rounded-xl bg-bg/60 border border-border-subtle p-4">
        <div class="flex items-center gap-2.5 mb-3.5">
          <span class="w-7 h-7 rounded-lg bg-success/10 flex items-center justify-center">
            <AppIcon name="externalLink" :size="14" class="text-success" />
          </span>
          <h2 class="text-[11px] font-semibold tracking-widest uppercase text-text-tertiary">
            公众号元素
          </h2>
        </div>
        <div class="space-y-3">
          <label class="flex items-center gap-2.5 text-[13px] text-text-secondary cursor-pointer">
            <input
              type="checkbox"
              :checked="settingsStore.wechatElements.followEnabled"
              @change="
                (e) =>
                  settingsStore.updateWechatElements({
                    followEnabled: (e.target as HTMLInputElement).checked,
                  })
              "
            />
            <span>关注引导</span>
          </label>
          <input
            v-if="settingsStore.wechatElements.followEnabled"
            :value="settingsStore.wechatElements.followName"
            type="text"
            placeholder="公众号名称"
            class="w-full h-9 px-3 text-[13px] rounded-lg border border-border bg-surface text-text placeholder:text-text-tertiary focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all"
            @input="
              (e) =>
                settingsStore.updateWechatElements({
                  followName: (e.target as HTMLInputElement).value,
                })
            "
          />
          <input
            v-if="settingsStore.wechatElements.followEnabled"
            :value="settingsStore.wechatElements.followSlogan"
            type="text"
            placeholder="引导语（如：感谢阅读，觉得有帮助可以分享给朋友）"
            class="w-full h-9 px-3 text-[13px] rounded-lg border border-border bg-surface text-text placeholder:text-text-tertiary focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all"
            @input="
              (e) =>
                settingsStore.updateWechatElements({
                  followSlogan: (e.target as HTMLInputElement).value,
                })
            "
          />
        </div>
      </section>

      <!-- Drafts -->
      <section class="rounded-xl bg-bg/60 border border-border-subtle p-4">
        <div class="flex items-center gap-2.5 mb-3.5">
          <span class="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center">
            <AppIcon name="fileText" :size="14" class="text-accent" />
          </span>
          <h2 class="text-[11px] font-semibold tracking-widest uppercase text-text-tertiary">
            草稿管理
          </h2>
        </div>
        <DraftPanel />
      </section>
    </div>
  </aside>
</template>

<style scoped>
input[type='checkbox'] {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease;
  flex-shrink: 0;
}

input[type='checkbox']:checked {
  background: var(--color-accent);
  border-color: var(--color-accent);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 6 9 17l-5-5'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: center;
}
</style>
