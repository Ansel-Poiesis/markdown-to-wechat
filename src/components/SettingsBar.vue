<script setup lang="ts">
import { computed } from 'vue'
import { useThemeStore } from '@/stores/theme'
import { useSettingsStore } from '@/stores/settings'
import { codeThemes } from '@/config/themes'

const themeStore = useThemeStore()
const settingsStore = useSettingsStore()

const codeThemeOptions = computed(() =>
  Object.entries(codeThemes).map(([key, t]) => ({ key, label: t.name })),
)

const zoomOptions = [
  { label: '86%', value: '0.86' },
  { label: '100%', value: '1' },
  { label: '112%', value: '1.12' },
]
</script>

<template>
  <div
    class="flex items-center justify-center gap-3 px-4 h-10 bg-surface border-b border-border-subtle shrink-0 text-[12px]"
  >
    <!-- Theme badge -->
    <div class="flex items-center gap-1.5">
      <span class="w-2.5 h-2.5 rounded-full bg-[#b14f2a]" />
      <span class="text-text-secondary text-[11px] font-medium">暖色杂志</span>
    </div>

    <span class="w-px h-4 bg-border-subtle" />

    <!-- Code theme -->
    <div class="flex items-center gap-1.5">
      <span class="text-text-tertiary text-[11px] mr-1">代码</span>
      <div class="flex gap-0.5 bg-bg rounded-lg p-0.5">
        <button
          v-for="opt in codeThemeOptions"
          :key="opt.key"
          type="button"
          class="flex-1 h-7 px-2.5 rounded-md text-[11px] font-medium transition-all active:scale-95"
          :class="
            themeStore.currentCodeThemeKey === opt.key
              ? 'bg-surface text-text shadow-sm font-semibold'
              : 'text-text-tertiary hover:text-text'
          "
          @click="themeStore.currentCodeThemeKey = opt.key"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>

    <span class="w-px h-4 bg-border-subtle" />

    <!-- Zoom -->
    <div class="flex items-center gap-1.5">
      <span class="text-text-tertiary text-[11px] mr-1">缩放</span>
      <div class="flex gap-0.5 bg-bg rounded-lg p-0.5">
        <button
          v-for="opt in zoomOptions"
          :key="opt.value"
          type="button"
          class="flex-1 h-7 px-2 rounded-md text-[11px] font-medium transition-all active:scale-95"
          :class="
            String(settingsStore.previewZoom) === opt.value
              ? 'bg-surface text-text shadow-sm font-semibold'
              : 'text-text-tertiary hover:text-text'
          "
          @click="settingsStore.previewZoom = opt.value"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>
  </div>
</template>
