<script setup lang="ts">
import { computed } from 'vue'
import { useUiStore } from '@/stores/ui'
import { useClipboard } from '@/composables/useClipboard'
import AppIcon from '@/components/ui/AppIcon.vue'
import type { WarningItem, PreflightCounts } from '@/types'

const props = defineProps<{
  warnings: WarningItem[]
  counts: PreflightCounts
  html: string
}>()

const ui = useUiStore()
const { copyRenderedHtml } = useClipboard()

const isOpen = computed(() => ui.activeModals.preflight)

function close() {
  ui.closeModal('preflight')
}

async function confirmCopy() {
  close()
  await copyRenderedHtml(props.html)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="modal-backdrop" @click.self="close">
        <section class="modal" role="dialog" aria-modal="true">
          <div class="flex items-start justify-between gap-4 shrink-0 px-5 pt-5 pb-4">
            <div>
              <p class="text-[11px] font-semibold tracking-widest uppercase text-text-tertiary mb-0.5">Preflight</p>
              <h2 class="text-lg font-semibold tracking-tight leading-tight">复制前预检</h2>
            </div>
            <button
              type="button"
              class="w-8 h-8 flex items-center justify-center rounded-lg text-text-tertiary hover:text-text hover:bg-surface-hover text-xl border border-border bg-transparent transition-all"
              aria-label="关闭"
              @click="close"
            >
              <AppIcon name="x" :size="16" />
            </button>
          </div>
          <div class="grid grid-cols-3 gap-3 px-5 pb-4">
            <div class="p-3.5 rounded-md bg-bg text-center">
              <strong class="block text-2xl font-semibold tabular-nums tracking-tight leading-tight">{{ counts.danger }}</strong>
              <span class="block mt-1 text-[11px] font-semibold tracking-widest uppercase text-text-tertiary">严重</span>
            </div>
            <div class="p-3.5 rounded-md bg-bg text-center">
              <strong class="block text-2xl font-semibold tabular-nums tracking-tight leading-tight">{{ counts.warn }}</strong>
              <span class="block mt-1 text-[11px] font-semibold tracking-widest uppercase text-text-tertiary">提醒</span>
            </div>
            <div class="p-3.5 rounded-md bg-bg text-center">
              <strong class="block text-2xl font-semibold tabular-nums tracking-tight leading-tight">{{ counts.info }}</strong>
              <span class="block mt-1 text-[11px] font-semibold tracking-widest uppercase text-text-tertiary">信息</span>
            </div>
          </div>
          <div class="px-5 pb-4 overflow-y-auto">
            <div
              v-for="(w, i) in warnings"
              :key="i"
              class="warning"
              :class="w.level"
            >
              {{ w.text }}
            </div>
            <div v-if="!warnings.length" class="empty-state">
              <p>预检通过，当前内容没有明显的公众号兼容性风险</p>
            </div>
          </div>
          <div class="flex justify-end gap-2.5 shrink-0 px-5 pt-4 pb-5 border-t border-border-subtle dark:border-border">
            <button type="button" class="h-9 px-3.5 rounded-lg text-[13px] font-medium bg-surface text-text border border-border hover:bg-surface-hover transition-all" @click="close">取消</button>
            <button
              type="button"
              class="h-9 px-3.5 rounded-lg text-[13px] font-medium bg-accent text-accent-contrast border border-accent hover:bg-accent-hover hover:border-accent-hover transition-all inline-flex items-center justify-center gap-2"
              @click="confirmCopy"
            >
              {{ counts.danger ? '仍然复制' : '继续复制' }}
            </button>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>
