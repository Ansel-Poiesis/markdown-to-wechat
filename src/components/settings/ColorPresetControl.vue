<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  DEFAULT_COLOR_PRESETS,
  type ColorPresetKind,
  useSettingsStore,
} from '@/stores/settings'

const props = withDefaults(
  defineProps<{
    kind: ColorPresetKind
    value: string
    fallback: string
    light?: boolean
  }>(),
  {
    light: false,
  },
)

const emit = defineEmits<{
  change: [color: string]
}>()

const settings = useSettingsStore()
const editingIndex = ref<number | null>(null)

const labels: Record<ColorPresetKind, string[]> = {
  text: ['墨色', '炭黑', '灰褐', '深蓝', '棕墨', '松绿', '雾紫', '夜蓝'],
  accent: ['陶土', '酒红', '墨绿', '藏蓝', '琥珀', '雾紫', '青石', '玫瑰'],
  background: ['纯白', '暖白', '米色', '浅灰', '淡绿', '雾蓝', '粉白', '淡紫'],
}

const presets = computed(() => settings.colorPresets[props.kind] || DEFAULT_COLOR_PRESETS[props.kind])
const editingColor = computed(() =>
  editingIndex.value === null ? '' : presets.value[editingIndex.value] || props.fallback,
)
const editingLabel = computed(() =>
  editingIndex.value === null ? '' : labels[props.kind][editingIndex.value] || `色彩 ${editingIndex.value + 1}`,
)

function presetAt(index: number) {
  return presets.value[index] || DEFAULT_COLOR_PRESETS[props.kind][index] || props.fallback
}

function selectPreset(index: number) {
  editingIndex.value = index
  emit('change', presetAt(index))
}

function updatePreset(event: Event) {
  if (editingIndex.value === null) return
  const previousColor = presets.value[editingIndex.value]
  const color = (event.target as HTMLInputElement).value
  settings.updateColorPreset(props.kind, editingIndex.value, color)
  if (props.value === previousColor) {
    emit('change', color)
  }
}
</script>

<template>
  <div class="color-control">
    <div v-if="editingIndex !== null" class="preset-editor">
      <span class="preset-editor__swatch" :style="{ background: editingColor }" />
      <span class="preset-editor__label">{{ editingLabel }}</span>
      <input
        type="color"
        class="preset-editor__input"
        :value="editingColor"
        aria-label="修改预设颜色"
        @input="updatePreset"
      />
    </div>

    <div class="color-line">
      <button
        v-for="(color, index) in presets"
        :key="`${kind}-${index}-${color}`"
        type="button"
        class="color-swatch"
        :class="[
          value === color ? 'color-swatch--active' : '',
          light ? 'color-swatch--light' : '',
        ]"
        :title="labels[kind][index]"
        :aria-label="labels[kind][index]"
        :style="{ background: color }"
        @click="selectPreset(index)"
      />
    </div>
  </div>
</template>

<style scoped>
.color-control {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preset-editor {
  min-width: 0;
  min-height: 32px;
  padding: 4px 6px;
  border-radius: 8px;
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr) 30px;
  align-items: center;
  gap: 7px;
  background: var(--color-surface);
  border: 1px solid var(--color-border-subtle);
}

.preset-editor__swatch {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.1);
}

.preset-editor__label {
  min-width: 0;
  color: var(--color-text-secondary);
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

.preset-editor__input {
  width: 30px;
  height: 26px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.color-line {
  min-width: 0;
  display: grid;
  grid-template-columns: repeat(8, minmax(0, 1fr));
  align-items: center;
  gap: 6px;
  overflow: visible;
}

.color-swatch {
  width: min(24px, 100%);
  aspect-ratio: 1;
  justify-self: center;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--color-text) 10%, transparent);
  box-shadow:
    inset 0 0 0 1px color-mix(in srgb, var(--color-control-thumb) 42%, transparent),
    0 1px 2px rgb(0 0 0 / 0.1);
  transition:
    transform 0.16s ease,
    box-shadow 0.16s ease,
    border-color 0.16s ease;
}

.color-swatch:hover {
  transform: translateY(-1px);
}

.color-swatch--light {
  border-color: var(--color-border-subtle);
}

.color-swatch--active {
  border-color: color-mix(in srgb, var(--color-text) 30%, transparent);
  box-shadow:
    inset 0 0 0 2px var(--color-surface),
    inset 0 0 0 3px currentColor,
    0 1px 2px rgb(0 0 0 / 0.1);
}
</style>
