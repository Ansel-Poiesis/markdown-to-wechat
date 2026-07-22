<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue'

defineOptions({ inheritAttrs: false })
defineProps<{ error?: Error }>()

function reload() {
  window.location.reload()
}
</script>

<template>
  <section v-bind="$attrs" class="workspace-panel flex min-h-0 items-center justify-center">
    <div class="flex flex-col items-center gap-3 px-6 text-center text-text-tertiary">
      <template v-if="error">
        <AppIcon name="alertCircle" :size="24" class="text-danger" />
        <p class="text-xs text-text-secondary">编辑器加载失败</p>
        <button
          type="button"
          class="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface px-3 text-xs font-medium text-text hover:bg-surface-hover"
          @click="reload"
        >
          <AppIcon name="undo" :size="13" />
          重新加载
        </button>
      </template>
      <template v-else>
        <span class="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-accent"></span>
        <span class="text-xs">正在加载编辑器</span>
      </template>
    </div>
  </section>
</template>
