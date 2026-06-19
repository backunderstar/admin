<!-- ============================================================
  SlideVerify — 滑块拖拽验证组件

  用于登录等场景的人机验证，用户需要将滑块拖拽到最右侧完成验证。

  ## Props
  - modelValue: boolean (v-model) — 当前验证状态
  - width: string — 组件宽度 (默认 100%)

  ## Events
  - update:modelValue — v-model 同步
  - success — 验证成功时触发
  - reset-verify — 验证重置时触发

  ## 使用示例
  <SlideVerify v-model="isPassing" @success="onVerifySuccess" />
  ============================================================ -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    width?: string
  }>(),
  {
    modelValue: false,
    width: '100%',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  success: []
  'reset-verify': []
}>()

// ── 元素引用 ──────────────────────────────────────────────
const trackRef = ref<HTMLElement>()
const isDragging = ref(false)
const offsetX = ref(0)
const isSuccess = ref(false)
const startX = ref(0)
const startOffset = ref(0)

// ── 计算属性 ──────────────────────────────────────────────
const trackWidth = ref(0)
const sliderWidth = 40 // 滑块宽度（px）
const threshold = 0.95

const sliderStyle = computed(() => ({
  transform: `translateX(${offsetX.value}px)`,
  transition: isDragging.value ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
}))

const trackText = computed(() => {
  if (isSuccess.value) return t('login.sliderSuccessText')
  if (isDragging.value) return ''
  return t('login.sliderText')
})

// ── 拖拽事件 ──────────────────────────────────────────────
function onDragStart(e: MouseEvent | TouchEvent) {
  if (isSuccess.value) return
  isDragging.value = true

  const track = trackRef.value
  if (track) {
    trackWidth.value = track.offsetWidth - sliderWidth
  }

  if ('touches' in e) {
    startX.value = e.touches[0]!.clientX
  } else {
    startX.value = e.clientX
  }
  startOffset.value = offsetX.value

  document.addEventListener('mousemove', onDragMove)
  document.addEventListener('mouseup', onDragEnd)
  document.addEventListener('touchmove', onDragMove, { passive: false })
  document.addEventListener('touchend', onDragEnd)
}

function onDragMove(e: MouseEvent | TouchEvent) {
  if (!isDragging.value) return
  e.preventDefault()

  let clientX: number
  if ('touches' in e) {
    clientX = e.touches[0]!.clientX
  } else {
    clientX = e.clientX
  }

  const diff = clientX - startX.value + startOffset.value
  offsetX.value = Math.max(0, Math.min(trackWidth.value, diff))
}

function onDragEnd() {
  if (!isDragging.value) return
  isDragging.value = false

  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', onDragEnd)
  document.removeEventListener('touchmove', onDragMove)
  document.removeEventListener('touchend', onDragEnd)

  if (offsetX.value >= trackWidth.value * threshold) {
    // 验证成功
    isSuccess.value = true
    offsetX.value = trackWidth.value
    emit('update:modelValue', true)
    emit('success')
  } else {
    // 验证失败，回弹
    resetSlider()
  }
}

function resetSlider() {
  offsetX.value = 0
  isSuccess.value = false
  emit('reset-verify')
}

// ── 暴露重置方法 ──────────────────────────────────────────
function resetVerify() {
  isDragging.value = false
  isSuccess.value = false
  offsetX.value = 0
  emit('update:modelValue', false)
  emit('reset-verify')
}

defineExpose({ resetVerify })
</script>

<template>
  <div class="slide-verify-wrapper" :style="{ width: props.width }">
    <!-- 滑块轨道 -->
    <div
      ref="trackRef"
      :class="[
        'relative flex h-11 w-full select-none items-center overflow-hidden rounded-full transition-colors duration-300',
        isSuccess
          ? 'cursor-default bg-[rgb(var(--success-6))]'
          : 'cursor-pointer bg-[var(--color-fill-2)]',
      ]"
      @mousedown.prevent="onDragStart"
      @touchstart.prevent="onDragStart"
    >
      <!-- 背景进度条 -->
      <div
        v-if="isDragging && !isSuccess"
        class="absolute left-0 top-0 h-full rounded-full bg-[rgb(var(--primary-5))]/20 transition-all duration-300"
        :style="{ width: `${trackWidth > 0 ? (offsetX / trackWidth) * 100 : 0}%` }"
      />

      <!-- 轨道文字 -->
      <span
        :class="[
          'absolute left-0 right-0 text-center text-sm transition-colors duration-300',
          isSuccess ? 'font-medium text-white' : 'text-[var(--color-text-3)]',
        ]"
      >
        {{ trackText }}
      </span>

      <!-- 滑块按钮 -->
      <div
        :class="[
          'relative z-10 flex h-9 w-10 shrink-0 items-center justify-center rounded-full shadow-sm ring-1 transition-colors duration-300',
          isSuccess
            ? 'bg-white ring-transparent'
            : 'bg-white ring-[var(--color-fill-3)] hover:ring-[rgb(var(--primary-6))]',
        ]"
        :style="sliderStyle"
      >
        <!-- 箭头图标：验证成功 → 勾，否则 → 右箭头 -->
        <svg
          v-if="isSuccess"
          class="h-4 w-4 text-[rgb(var(--success-6))]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <svg
          v-else
          :class="[
            'h-4 w-4 transition-colors',
            isDragging ? 'text-[rgb(var(--primary-6))]' : 'text-[var(--color-text-2)]',
          ]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </div>
  </div>
</template>
