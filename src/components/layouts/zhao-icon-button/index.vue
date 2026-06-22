<template>
  <div
    class="flex items-center justify-center w-8 h-8 rounded-md cursor-pointer text-(--color-text-3) hover:text-(--color-text-1) hover:bg-(--color-fill-2) transition-colors"
    @click="$emit('click')"
  >
    <ZhaoIcon :icon="icon" class="text-lg" />
  </div>
</template>

<script setup lang="ts">
import ZhaoIcon from '@/components/icons/ZhaoIcon.vue'

defineOptions({ name: 'ZhaoIconButton' })

defineProps<{
  icon: string
}>()

defineEmits<{
  click: []
}>()
</script>
