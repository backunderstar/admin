<template>
  <component :is="c.component" v-for="c in enabledComponents" :key="c.key" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getEnabledGlobalComponents } from '@/config/modules/component'

defineOptions({ name: 'ZhaoGlobalComponent' })

const enabledComponents = computed(() => getEnabledGlobalComponents())
</script>
