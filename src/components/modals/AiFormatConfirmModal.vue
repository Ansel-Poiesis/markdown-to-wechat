<script setup lang="ts">
import { ref, watch } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'

const props = defineProps<{
  open: boolean
  requiresApiKey: boolean
}>()

const emit = defineEmits<{
  cancel: []
  confirm: [apiKey: string]
}>()

const apiKey = ref('')
const showKey = ref(false)

watch(
  () => props.open,
  (open) => {
    if (!open) {
      showKey.value = false
      apiKey.value = ''
    }
  },
)

function confirm() {
  emit('confirm', apiKey.value)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="open" class="modal-backdrop" @click.self="emit('cancel')">
        <section class="modal ai-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="ai-confirm-title">
          <div class="flex items-start justify-between gap-4 px-5 pt-5 pb-4">
            <div>
              <p class="text-[11px] font-semibold tracking-widest uppercase text-text-tertiary mb-0.5">MiMo</p>
              <h2 id="ai-confirm-title" class="text-lg font-semibold tracking-tight">确认辅助排版</h2>
            </div>
            <button type="button" class="modal-icon-button" aria-label="关闭" @click="emit('cancel')">
              <AppIcon name="x" :size="16" />
            </button>
          </div>

          <div class="px-5 pb-5 space-y-4">
            <p class="text-sm leading-6 text-text-secondary">
              当前全文将发送到 MiMo 进行格式整理。结果完整返回后才会替换正文，替换后可以撤销。
            </p>
            <label v-if="requiresApiKey" class="block">
              <span class="block mb-2 text-xs font-semibold text-text-secondary">MiMo API Key</span>
              <div class="flex gap-2">
                <input
                  v-model="apiKey"
                  :type="showKey ? 'text' : 'password'"
                  autocomplete="off"
                  spellcheck="false"
                  class="flex-1 min-w-0 h-9 px-3 rounded-md border border-border bg-surface text-sm text-text focus:outline-none focus:border-accent"
                  placeholder="仅保留在当前页面会话"
                  @keydown.enter="confirm"
                />
                <button type="button" class="modal-icon-button" :aria-label="showKey ? '隐藏密钥' : '显示密钥'" @click="showKey = !showKey">
                  <AppIcon :name="showKey ? 'eyeOff' : 'eye'" :size="15" />
                </button>
              </div>
            </label>
          </div>

          <div class="flex justify-end gap-2.5 px-5 py-4 border-t border-border-subtle">
            <button type="button" class="h-9 px-3.5 rounded-md text-sm border border-border bg-surface text-text" @click="emit('cancel')">取消</button>
            <button
              type="button"
              class="h-9 px-3.5 rounded-md text-sm font-semibold bg-accent text-accent-contrast disabled:opacity-40"
              :disabled="requiresApiKey && !apiKey.trim()"
              @click="confirm"
            >
              确认发送
            </button>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.ai-confirm-modal {
  width: min(460px, calc(100vw - 32px));
}

.modal-icon-button {
  width: 36px;
  height: 36px;
  flex: 0 0 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  color: var(--color-text-secondary);
  background: var(--color-surface);
}
</style>
