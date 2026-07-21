<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useUiStore } from '@/stores/ui'
import {
  feedbackDeliveryMode,
  submitFeedback,
  type FeedbackCategory,
  type FeedbackDiagnostics,
} from '@/services/feedback'
import AppIcon from '@/components/ui/AppIcon.vue'

const props = defineProps<{
  open: boolean
  diagnostics: FeedbackDiagnostics
}>()

const emit = defineEmits<{ close: [] }>()
const ui = useUiStore()
const category = ref<FeedbackCategory>('problem')
const message = ref('')
const contact = ref('')
const includeDiagnostics = ref(true)
const submitting = ref(false)
const errorMessage = ref('')
const deliveryMode = feedbackDeliveryMode()

const categories: Array<{ key: FeedbackCategory; label: string }> = [
  { key: 'problem', label: '问题' },
  { key: 'suggestion', label: '建议' },
  { key: 'experience', label: '体验' },
  { key: 'other', label: '其他' },
]

const canSubmit = computed(() => message.value.trim().length >= 5 && !submitting.value)

watch(
  () => props.open,
  (open) => {
    if (open) errorMessage.value = ''
  },
)

function close() {
  if (!submitting.value) emit('close')
}

async function submit() {
  if (!canSubmit.value) return
  submitting.value = true
  errorMessage.value = ''
  try {
    const delivery = await submitFeedback({
      category: category.value,
      message: message.value.trim(),
      contact: contact.value.trim() || undefined,
      diagnostics: includeDiagnostics.value ? props.diagnostics : undefined,
      createdAt: new Date().toISOString(),
    })
    ui.showToast(
      delivery === 'endpoint' ? '反馈已发送' : '已打开邮件客户端，请确认发送',
      delivery === 'endpoint' ? 'success' : 'info',
    )
    message.value = ''
    contact.value = ''
    emit('close')
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '反馈暂时无法发送'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="open" class="modal-backdrop" @click.self="close">
        <section
          class="modal feedback-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="feedback-title"
        >
          <header class="feedback-modal__header">
            <div>
              <p class="feedback-modal__eyebrow">Feedback</p>
              <h2 id="feedback-title" class="feedback-modal__title">提交反馈</h2>
            </div>
            <button type="button" class="feedback-modal__icon-button" aria-label="关闭" @click="close">
              <AppIcon name="x" :size="16" />
            </button>
          </header>

          <form class="feedback-modal__body" @submit.prevent="submit">
            <fieldset>
              <legend class="feedback-modal__label">反馈类型</legend>
              <div class="feedback-category-control">
                <button
                  v-for="item in categories"
                  :key="item.key"
                  type="button"
                  class="feedback-category-control__button"
                  :class="category === item.key ? 'feedback-category-control__button--active' : ''"
                  :aria-pressed="category === item.key"
                  @click="category = item.key"
                >
                  {{ item.label }}
                </button>
              </div>
            </fieldset>

            <label class="block">
              <span class="feedback-modal__label">具体说明</span>
              <textarea
                v-model="message"
                class="feedback-modal__textarea"
                rows="6"
                maxlength="1200"
                placeholder="请描述发生了什么、期待什么结果"
                autofocus
              ></textarea>
              <span class="feedback-modal__counter">{{ message.length }} / 1200</span>
            </label>

            <label class="block">
              <span class="feedback-modal__label">联系方式 <small>选填</small></span>
              <input
                v-model="contact"
                class="feedback-modal__input"
                type="text"
                maxlength="120"
                autocomplete="email"
                placeholder="邮箱或其他方便回复的方式"
              />
            </label>

            <label class="feedback-diagnostics-control">
              <input v-model="includeDiagnostics" type="checkbox" />
              <span>
                <strong>附带诊断信息</strong>
                <small>版本、运行环境、主题与稿件统计，不包含文章正文</small>
              </span>
            </label>

            <p v-if="errorMessage" class="feedback-modal__error" role="alert">
              {{ errorMessage }}
            </p>
          </form>

          <footer class="feedback-modal__footer">
            <p>
              {{
                deliveryMode === 'endpoint'
                  ? '反馈将发送到维护邮箱。'
                  : '提交后将在邮件客户端中确认发送。'
              }}
            </p>
            <div class="feedback-modal__actions">
              <button type="button" class="feedback-modal__secondary" @click="close">取消</button>
              <button
                type="button"
                class="feedback-modal__primary"
                :disabled="!canSubmit"
                @click="submit"
              >
                <AppIcon name="send" :size="14" />
                {{ submitting ? '提交中' : '提交反馈' }}
              </button>
            </div>
          </footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.feedback-modal {
  width: min(560px, calc(100vw - 32px));
}

.feedback-modal__header,
.feedback-modal__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
}

.feedback-modal__header {
  align-items: flex-start;
  border-bottom: 1px solid var(--color-border-subtle);
}

.feedback-modal__eyebrow {
  margin: 0 0 2px;
  color: var(--color-text-tertiary);
  font-size: 10px;
  line-height: 1.2;
  font-weight: 700;
  text-transform: uppercase;
}

.feedback-modal__title {
  margin: 0;
  color: var(--color-text);
  font-size: 18px;
  line-height: 1.3;
  font-weight: 700;
}

.feedback-modal__icon-button {
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  color: var(--color-text-secondary);
  background: var(--color-surface);
}

.feedback-modal__body {
  padding: 20px;
  display: grid;
  gap: 18px;
  overflow-y: auto;
}

.feedback-modal__label {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin: 0 0 8px;
  color: var(--color-text-secondary);
  font-size: 12px;
  line-height: 1.3;
  font-weight: 700;
}

.feedback-modal__label small {
  color: var(--color-text-tertiary);
  font-size: 10px;
  font-weight: 500;
}

.feedback-category-control {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 4px;
  padding: 4px;
  border: 1px solid var(--color-border-subtle);
  border-radius: 7px;
  background: var(--color-bg);
}

.feedback-category-control__button {
  min-width: 0;
  height: 34px;
  border: 1px solid transparent;
  border-radius: 5px;
  color: var(--color-text-tertiary);
  background: transparent;
  font-size: 12px;
  font-weight: 650;
}

.feedback-category-control__button--active {
  color: var(--color-text);
  border-color: var(--color-border);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
}

.feedback-modal__textarea,
.feedback-modal__input {
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  color: var(--color-text);
  background: var(--color-surface);
  font-size: 13px;
  line-height: 1.65;
  resize: vertical;
}

.feedback-modal__textarea {
  min-height: 132px;
  max-height: 260px;
  padding: 11px 12px;
}

.feedback-modal__input {
  height: 38px;
  padding: 0 12px;
}

.feedback-modal__textarea:focus,
.feedback-modal__input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px var(--color-focus-ring);
}

.feedback-modal__counter {
  display: block;
  margin-top: 5px;
  color: var(--color-text-tertiary);
  font-size: 10px;
  line-height: 1;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.feedback-diagnostics-control {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  border: 1px solid var(--color-border-subtle);
  border-radius: 6px;
  background: var(--color-bg);
  cursor: pointer;
}

.feedback-diagnostics-control input {
  width: 15px;
  height: 15px;
  margin-top: 2px;
  accent-color: var(--color-accent);
}

.feedback-diagnostics-control span {
  min-width: 0;
}

.feedback-diagnostics-control strong,
.feedback-diagnostics-control small {
  display: block;
}

.feedback-diagnostics-control strong {
  color: var(--color-text-secondary);
  font-size: 12px;
  line-height: 1.35;
  font-weight: 700;
}

.feedback-diagnostics-control small {
  margin-top: 3px;
  color: var(--color-text-tertiary);
  font-size: 10px;
  line-height: 1.5;
}

.feedback-modal__error {
  margin: -4px 0 0;
  color: var(--color-danger);
  font-size: 12px;
  line-height: 1.5;
}

.feedback-modal__footer {
  border-top: 1px solid var(--color-border-subtle);
}

.feedback-modal__footer > p {
  min-width: 0;
  margin: 0;
  color: var(--color-text-tertiary);
  font-size: 10px;
  line-height: 1.45;
}

.feedback-modal__actions {
  flex: 0 0 auto;
  display: flex;
  gap: 8px;
}

.feedback-modal__secondary,
.feedback-modal__primary {
  height: 36px;
  padding: 0 13px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 650;
}

.feedback-modal__secondary {
  border: 1px solid var(--color-border);
  color: var(--color-text);
  background: var(--color-surface);
}

.feedback-modal__primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 1px solid var(--color-accent);
  color: var(--color-accent-contrast);
  background: var(--color-accent);
}

.feedback-modal__primary:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}

@media (max-width: 520px) {
  .feedback-modal__header,
  .feedback-modal__body,
  .feedback-modal__footer {
    padding-left: 16px;
    padding-right: 16px;
  }

  .feedback-category-control {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .feedback-modal__footer {
    align-items: stretch;
    flex-direction: column;
  }

  .feedback-modal__actions {
    width: 100%;
  }

  .feedback-modal__secondary,
  .feedback-modal__primary {
    flex: 1;
  }
}
</style>
