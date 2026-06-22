<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="context-menu"
      :style="{ left: `${position.x}px`, top: `${position.y}px` }"
    >
      <div class="context-menu-item" @click="$emit('action', 'refresh')">
        <ZhaoIcon icon="ri:refresh-line" class="mr-2" />
        {{ t('worktab.btn.refresh') }}
      </div>
      <div class="context-menu-item" @click="$emit('action', 'closeLeft')">
        <ZhaoIcon icon="ri:arrow-left-s-line" class="mr-2" />
        {{ t('worktab.btn.closeLeft') }}
      </div>
      <div class="context-menu-item" @click="$emit('action', 'closeRight')">
        <ZhaoIcon icon="ri:arrow-right-s-line" class="mr-2" />
        {{ t('worktab.btn.closeRight') }}
      </div>
      <div class="context-menu-item" @click="$emit('action', 'closeOther')">
        <ZhaoIcon icon="ri:subtract-line" class="mr-2" />
        {{ t('worktab.btn.closeOther') }}
      </div>
      <div class="context-menu-item" @click="$emit('action', 'closeAll')">
        <ZhaoIcon icon="ri:close-circle-line" class="mr-2" />
        {{ t('worktab.btn.closeAll') }}
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import ZhaoIcon from '@/components/icons/ZhaoIcon.vue'

defineOptions({ name: 'WorkTabContextMenu' })

defineProps<{
  visible: boolean
  position: { x: number; y: number }
}>()

defineEmits<{
  action: [value: string]
}>()

const { t } = useI18n()
</script>

<style scoped>
.context-menu {
  position: fixed;
  z-index: 1000;
  min-width: 140px;
  padding: 4px 0;
  background: var(--color-bg-popup);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.context-menu-item {
  display: flex;
  align-items: center;
  padding: 7px 12px;
  font-size: 13px;
  color: var(--color-text-2);
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s;
}

.context-menu-item:hover {
  background: var(--color-fill-2);
  color: var(--color-text-1);
}
</style>
