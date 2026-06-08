<script setup lang="ts">
import { ref, nextTick, watch, computed } from 'vue'
import { useMimoChat } from '@/composables/useMimoChat'
import { MIMO_MODELS, type ModelCapability } from '@/config/models'
import AppIcon from '@/components/ui/AppIcon.vue'

const emit = defineEmits<{ close: [] }>()

const {
  messages,
  selectedModelId,
  selectedModel,
  selectedCapability,
  isLoading,
  error,
  sendMessage,
  transcribeAudio,
  cancel,
  clearMessages,
} = useMimoChat()

const inputText = ref('')
const scrollEl = ref<HTMLDivElement>()

// ── 按能力分组的模型列表 ────────────────────────────────────
const modelGroups = computed(() => {
  const groups: Record<string, { id: string; name: string; desc: string }[]> = {
    '文本对话': [],
    '语音识别': [],
    '语音合成': [],
  }
  for (const m of MIMO_MODELS) {
    const entry = { id: m.id, name: m.name, desc: m.description }
    if (m.capability === 'chat') groups['文本对话']!.push(entry)
    else if (m.capability === 'asr') groups['语音识别']!.push(entry)
    else groups['语音合成']!.push(entry)
  }
  return groups
})

// ── 输入 placeholder ────────────────────────────────────────
const placeholder = computed(() => {
  const cap = selectedCapability.value
  if (cap === 'asr') return '请上传音频文件进行识别...'
  if (['tts', 'voiceclone', 'voicedesign'].includes(cap)) return '输入要合成语音的文字...'
  return '输入消息...'
})

// ── 发送 ────────────────────────────────────────────────────
async function handleSend() {
  const text = inputText.value.trim()
  if (!text) return
  inputText.value = ''
  await sendMessage(text)
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

// ── ASR 文件上传 ────────────────────────────────────────────
const fileInput = ref<HTMLInputElement>()
function handleFileUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  void transcribeAudio(file)
  ;(e.target as HTMLInputElement).value = ''
}

// ── 播放音频 ────────────────────────────────────────────────
function playAudio(url: string) {
  const audio = new Audio(url)
  audio.play().catch(() => {})
}

// ── 自动滚动 ────────────────────────────────────────────────
watch(
  () => messages.value.length,
  () => {
    nextTick(() => {
      if (scrollEl.value) {
        scrollEl.value.scrollTop = scrollEl.value.scrollHeight
      }
    })
  },
)

// 监听流式内容变化也滚动
watch(
  () => messages.value.map(m => m.content).join(''),
  () => {
    nextTick(() => {
      if (scrollEl.value) {
        scrollEl.value.scrollTop = scrollEl.value.scrollHeight
      }
    })
  },
)
</script>

<template>
  <div class="flex flex-col h-full bg-surface">
    <!-- Header -->
    <div class="flex items-center justify-between h-12 px-4 border-b border-border-subtle shrink-0">
      <div class="flex items-center gap-2">
        <span class="text-sm font-semibold text-text">MiMo 聊天</span>
      </div>
      <div class="flex items-center gap-1">
        <button
          type="button"
          class="p-1.5 rounded-lg text-text-tertiary hover:text-text hover:bg-bg transition-colors"
          title="清空对话"
          @click="clearMessages"
        >
          <AppIcon name="trash" :size="14" />
        </button>
        <button
          type="button"
          class="p-1.5 rounded-lg text-text-tertiary hover:text-text hover:bg-bg transition-colors"
          title="关闭"
          @click="emit('close')"
        >
          <AppIcon name="x" :size="14" />
        </button>
      </div>
    </div>

    <!-- Model selector -->
    <div class="px-4 py-2 border-b border-border-subtle shrink-0">
      <select
        v-model="selectedModelId"
        class="w-full h-8 px-2 rounded-lg text-xs bg-bg border border-border-subtle text-text outline-none focus:border-accent transition-colors"
      >
        <optgroup v-for="(models, group) in modelGroups" :key="group" :label="group">
          <option v-for="m in models" :key="m.id" :value="m.id">
            {{ m.name }} — {{ m.desc }}
          </option>
        </optgroup>
      </select>
    </div>

    <!-- Messages -->
    <div ref="scrollEl" class="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
      <!-- Empty state -->
      <div v-if="messages.length === 0" class="flex flex-col items-center justify-center h-full text-text-tertiary gap-2">
        <AppIcon name="sparkles" :size="32" class="opacity-30" />
        <p class="text-xs text-center leading-relaxed">
          选择模型，开始对话<br>
          <span class="opacity-60">文本模型支持流式对话<br>TTS 模型将文字转为语音<br>ASR 模型识别音频内容</span>
        </p>
      </div>

      <!-- Message bubbles -->
      <div
        v-for="msg in messages"
        :key="msg.id"
        class="flex"
        :class="msg.role === 'user' ? 'justify-end' : 'justify-start'"
      >
        <div
          class="max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed"
          :class="{
            'bg-[#18181b] text-white': msg.role === 'user',
            'bg-bg text-text': msg.role === 'assistant',
            'bg-bg text-text border border-border-subtle': msg.role === 'audio',
          }"
        >
          <!-- 文本内容 -->
          <div v-if="msg.role !== 'audio'" class="whitespace-pre-wrap break-words">{{ msg.content }}</div>

          <!-- 音频消息 -->
          <div v-else class="flex flex-col gap-2">
            <p class="text-xs text-text-tertiary">语音合成结果：</p>
            <button
              type="button"
              class="flex items-center gap-2 h-8 px-3 rounded-lg bg-accent/10 text-accent text-xs font-medium hover:bg-accent/20 transition-colors"
              @click="playAudio(msg.audioUrl!)"
            >
              ▶ 播放音频
            </button>
            <p class="text-[11px] text-text-tertiary opacity-60 line-clamp-2">{{ msg.content }}</p>
          </div>

          <!-- 模型标签 -->
          <div class="mt-1.5 text-[10px] opacity-40 text-right">
            {{ msg.modelId }}
          </div>
        </div>
      </div>

      <!-- Loading indicator -->
      <div v-if="isLoading" class="flex justify-start">
        <div class="bg-bg rounded-2xl px-3.5 py-2.5 text-[13px] text-text-tertiary">
          <span class="inline-flex gap-1">
            <span class="animate-bounce" style="animation-delay: 0ms">·</span>
            <span class="animate-bounce" style="animation-delay: 150ms">·</span>
            <span class="animate-bounce" style="animation-delay: 300ms">·</span>
          </span>
        </div>
      </div>

      <!-- Error -->
      <div v-if="error" class="flex justify-center">
        <div class="text-xs text-danger bg-danger/10 rounded-lg px-3 py-2">
          {{ error }}
        </div>
      </div>
    </div>

    <!-- Input area -->
    <div class="border-t border-border-subtle p-3 shrink-0">
      <!-- ASR 模式：文件上传 -->
      <div v-if="selectedCapability === 'asr'" class="flex items-center gap-2">
        <input
          ref="fileInput"
          type="file"
          accept="audio/*"
          class="hidden"
          @change="handleFileUpload"
        >
        <button
          type="button"
          class="flex-1 h-10 rounded-xl text-sm font-medium bg-accent text-white hover:opacity-90 transition-opacity inline-flex items-center justify-center gap-2"
          :disabled="isLoading"
          @click="fileInput?.click()"
        >
          🎤 上传音频识别
        </button>
      </div>

      <!-- 文本输入模式 -->
      <div v-else class="flex items-end gap-2">
        <textarea
          v-model="inputText"
          rows="1"
          class="flex-1 resize-none rounded-xl bg-bg border border-border-subtle px-3 py-2.5 text-sm text-text outline-none focus:border-accent transition-colors max-h-32"
          :placeholder="placeholder"
          @keydown="handleKeydown"
        />
        <button
          v-if="isLoading"
          type="button"
          class="shrink-0 h-10 w-10 rounded-xl bg-danger/10 text-danger hover:bg-danger/20 transition-colors flex items-center justify-center"
          title="取消"
          @click="cancel"
        >
          ■
        </button>
        <button
          v-else
          type="button"
          class="shrink-0 h-10 w-10 rounded-xl bg-[#18181b] text-white hover:bg-[#27272a] transition-colors flex items-center justify-center"
          :disabled="!inputText.trim()"
          title="发送"
          @click="handleSend"
        >
          ↑
        </button>
      </div>
    </div>
  </div>
</template>
