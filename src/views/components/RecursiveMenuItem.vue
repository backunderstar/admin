<template>
  <!-- 有子菜单：渲染 a-sub-menu -->
  <a-sub-menu v-if="item.children?.length" :key="item.path" :title="t(item.meta?.title || '')">
    <template #icon>
      <ZhaoIcon v-if="item.meta?.icon" :icon="item.meta.icon" />
    </template>
    <template v-for="child in item.children" :key="child.path">
      <RecursiveMenuItem :item="child" />
    </template>
  </a-sub-menu>
  <!-- 叶子节点 -->
  <a-menu-item v-else :key="item.path">
    <template #icon>
      <ZhaoIcon v-if="item.meta?.icon" :icon="item.meta.icon" />
    </template>
    {{ t(item.meta?.title || '') }}
  </a-menu-item>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { AppRouteRecord } from '@/types/router'

defineProps<{
  item: AppRouteRecord
}>()

const { t } = useI18n()
</script>
