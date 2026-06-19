<template>
  <div class="fixed bottom-6 right-6 z-50 cursor-pointer" @click="showPanel = !showPanel">
    <div
      class="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105"
      :style="{ background: 'var(--theme-color, #5d87ff)' }"
    >
      <ZhaoIcon :icon="showPanel ? 'ri:close-line' : 'ri:chat-1-line'" class="text-white text-xl" />
    </div>

    <Transition name="slide-up">
      <div
        v-if="showPanel"
        class="absolute bottom-14 right-0 w-80 h-96 rounded-xl shadow-xl border border-[var(--color-border)] flex flex-col overflow-hidden"
        :style="{ background: 'var(--color-bg-2)' }"
      >
        <div
          class="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]"
        >
          <span class="text-sm font-medium text-[var(--color-text-1)]">聊天</span>
          <ZhaoIcon icon="ri:more-line" class="text-[var(--color-text-3)] cursor-pointer" />
        </div>
        <div class="flex-1 flex items-center justify-center text-sm text-[var(--color-text-3)]">
          暂无消息
        </div>
        <div class="px-3 py-2 border-t border-[var(--color-border)]">
          <a-input :placeholder="'输入消息...'" size="small">
            <template #suffix>
              <ZhaoIcon
                icon="ri:send-plane-line"
                class="text-[var(--color-text-3)] text-sm cursor-pointer"
              />
            </template>
          </a-input>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ZhaoIcon from '@/components/icons/ZhaoIcon.vue'

defineOptions({ name: 'ZhaoChatWindow' })

const showPanel = ref(false)
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
