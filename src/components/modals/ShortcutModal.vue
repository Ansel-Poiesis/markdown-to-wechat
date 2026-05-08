<script setup lang="ts">
import { computed } from 'vue'
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()
const isOpen = computed(() => ui.activeModals.shortcut)

function close() {
  ui.closeModal('shortcut')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="modal-backdrop" @click.self="close">
        <section class="modal" role="dialog" aria-modal="true" style="min-width: 520px;">
          <div class="flex items-start justify-between gap-4 shrink-0 px-5 pt-5 pb-4">
            <div>
              <p class="text-[11px] font-semibold tracking-widest uppercase text-text-tertiary mb-0.5">Shortcuts</p>
              <h2 class="text-lg font-semibold tracking-tight leading-tight">快捷键</h2>
            </div>
            <button
              type="button"
              class="w-8 h-8 flex items-center justify-center rounded-md text-text-tertiary hover:text-text hover:bg-surface-hover text-xl border border-border-subtle hover:border-border bg-transparent transition-all"
              aria-label="关闭"
              @click="close"
            >
              ×
            </button>
          </div>
          <div class="px-5 pb-4">
            <div class="grid grid-cols-2 gap-0">
              <div class="flex items-center justify-between gap-3 py-2.5 text-[13px] border-b border-border-subtle dark:border-border">
                <span>保存</span>
                <span class="inline-flex items-center gap-1 font-mono text-xs text-text-tertiary shrink-0">
                  <kbd class="inline-block px-1.5 py-0.5 border border-border rounded-md bg-bg text-[11px] leading-snug shadow-[0_1px_0_var(--color-border-subtle)]">Ctrl</kbd> /
                  <kbd class="inline-block px-1.5 py-0.5 border border-border rounded-md bg-bg text-[11px] leading-snug shadow-[0_1px_0_var(--color-border-subtle)]">Cmd</kbd> +
                  <kbd class="inline-block px-1.5 py-0.5 border border-border rounded-md bg-bg text-[11px] leading-snug shadow-[0_1px_0_var(--color-border-subtle)]">S</kbd>
                </span>
              </div>
              <div class="flex items-center justify-between gap-3 py-2.5 text-[13px] border-b border-border-subtle dark:border-border">
                <span>复制到公众号</span>
                <span class="inline-flex items-center gap-1 font-mono text-xs text-text-tertiary shrink-0">
                  <kbd class="inline-block px-1.5 py-0.5 border border-border rounded-md bg-bg text-[11px] leading-snug shadow-[0_1px_0_var(--color-border-subtle)]">Ctrl</kbd> /
                  <kbd class="inline-block px-1.5 py-0.5 border border-border rounded-md bg-bg text-[11px] leading-snug shadow-[0_1px_0_var(--color-border-subtle)]">Cmd</kbd> +
                  <kbd class="inline-block px-1.5 py-0.5 border border-border rounded-md bg-bg text-[11px] leading-snug shadow-[0_1px_0_var(--color-border-subtle)]">Shift</kbd> +
                  <kbd class="inline-block px-1.5 py-0.5 border border-border rounded-md bg-bg text-[11px] leading-snug shadow-[0_1px_0_var(--color-border-subtle)]">C</kbd>
                </span>
              </div>
              <div class="flex items-center justify-between gap-3 py-2.5 text-[13px] border-b border-border-subtle dark:border-border">
                <span>加粗</span>
                <span class="inline-flex items-center gap-1 font-mono text-xs text-text-tertiary shrink-0">
                  <kbd class="inline-block px-1.5 py-0.5 border border-border rounded-md bg-bg text-[11px] leading-snug shadow-[0_1px_0_var(--color-border-subtle)]">Ctrl</kbd> /
                  <kbd class="inline-block px-1.5 py-0.5 border border-border rounded-md bg-bg text-[11px] leading-snug shadow-[0_1px_0_var(--color-border-subtle)]">Cmd</kbd> +
                  <kbd class="inline-block px-1.5 py-0.5 border border-border rounded-md bg-bg text-[11px] leading-snug shadow-[0_1px_0_var(--color-border-subtle)]">B</kbd>
                </span>
              </div>
              <div class="flex items-center justify-between gap-3 py-2.5 text-[13px] border-b border-border-subtle dark:border-border">
                <span>斜体</span>
                <span class="inline-flex items-center gap-1 font-mono text-xs text-text-tertiary shrink-0">
                  <kbd class="inline-block px-1.5 py-0.5 border border-border rounded-md bg-bg text-[11px] leading-snug shadow-[0_1px_0_var(--color-border-subtle)]">Ctrl</kbd> /
                  <kbd class="inline-block px-1.5 py-0.5 border border-border rounded-md bg-bg text-[11px] leading-snug shadow-[0_1px_0_var(--color-border-subtle)]">Cmd</kbd> +
                  <kbd class="inline-block px-1.5 py-0.5 border border-border rounded-md bg-bg text-[11px] leading-snug shadow-[0_1px_0_var(--color-border-subtle)]">I</kbd>
                </span>
              </div>
              <div class="flex items-center justify-between gap-3 py-2.5 text-[13px] border-b border-border-subtle dark:border-border">
                <span>插入链接</span>
                <span class="inline-flex items-center gap-1 font-mono text-xs text-text-tertiary shrink-0">
                  <kbd class="inline-block px-1.5 py-0.5 border border-border rounded-md bg-bg text-[11px] leading-snug shadow-[0_1px_0_var(--color-border-subtle)]">Ctrl</kbd> /
                  <kbd class="inline-block px-1.5 py-0.5 border border-border rounded-md bg-bg text-[11px] leading-snug shadow-[0_1px_0_var(--color-border-subtle)]">Cmd</kbd> +
                  <kbd class="inline-block px-1.5 py-0.5 border border-border rounded-md bg-bg text-[11px] leading-snug shadow-[0_1px_0_var(--color-border-subtle)]">K</kbd>
                </span>
              </div>
              <div class="flex items-center justify-between gap-3 py-2.5 text-[13px] border-b border-border-subtle dark:border-border">
                <span>插入图片</span>
                <span class="inline-flex items-center gap-1 font-mono text-xs text-text-tertiary shrink-0">
                  <kbd class="inline-block px-1.5 py-0.5 border border-border rounded-md bg-bg text-[11px] leading-snug shadow-[0_1px_0_var(--color-border-subtle)]">Ctrl</kbd> /
                  <kbd class="inline-block px-1.5 py-0.5 border border-border rounded-md bg-bg text-[11px] leading-snug shadow-[0_1px_0_var(--color-border-subtle)]">Cmd</kbd> +
                  <kbd class="inline-block px-1.5 py-0.5 border border-border rounded-md bg-bg text-[11px] leading-snug shadow-[0_1px_0_var(--color-border-subtle)]">Shift</kbd> +
                  <kbd class="inline-block px-1.5 py-0.5 border border-border rounded-md bg-bg text-[11px] leading-snug shadow-[0_1px_0_var(--color-border-subtle)]">M</kbd>
                </span>
              </div>
              <div class="flex items-center justify-between gap-3 py-2.5 text-[13px] border-b border-border-subtle dark:border-border">
                <span>导出</span>
                <span class="inline-flex items-center gap-1 font-mono text-xs text-text-tertiary shrink-0">
                  <kbd class="inline-block px-1.5 py-0.5 border border-border rounded-md bg-bg text-[11px] leading-snug shadow-[0_1px_0_var(--color-border-subtle)]">Ctrl</kbd> /
                  <kbd class="inline-block px-1.5 py-0.5 border border-border rounded-md bg-bg text-[11px] leading-snug shadow-[0_1px_0_var(--color-border-subtle)]">Cmd</kbd> +
                  <kbd class="inline-block px-1.5 py-0.5 border border-border rounded-md bg-bg text-[11px] leading-snug shadow-[0_1px_0_var(--color-border-subtle)]">E</kbd>
                </span>
              </div>
              <div class="flex items-center justify-between gap-3 py-2.5 text-[13px] border-b border-border-subtle dark:border-border">
                <span>显示快捷键</span>
                <span class="inline-flex items-center gap-1 font-mono text-xs text-text-tertiary shrink-0">
                  <kbd class="inline-block px-1.5 py-0.5 border border-border rounded-md bg-bg text-[11px] leading-snug shadow-[0_1px_0_var(--color-border-subtle)]">Ctrl</kbd> /
                  <kbd class="inline-block px-1.5 py-0.5 border border-border rounded-md bg-bg text-[11px] leading-snug shadow-[0_1px_0_var(--color-border-subtle)]">Cmd</kbd> +
                  <kbd class="inline-block px-1.5 py-0.5 border border-border rounded-md bg-bg text-[11px] leading-snug shadow-[0_1px_0_var(--color-border-subtle)]">/</kbd>
                </span>
              </div>
            </div>
          </div>
          <div class="flex justify-end gap-2.5 shrink-0 px-5 pt-4 pb-5 border-t border-border-subtle dark:border-border">
            <button type="button" class="h-9 px-3.5 rounded-md text-[13px] font-medium bg-[#18181b] text-white border border-[#18181b] hover:bg-[#27272a] hover:border-[#27272a] transition-all" @click="close">知道了</button>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>
