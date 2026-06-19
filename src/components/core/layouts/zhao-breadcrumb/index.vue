<template>
  <a-breadcrumb class="flex-shrink-0">
    <a-breadcrumb-item v-for="(segment, index) in breadcrumbItems" :key="segment.path">
      <router-link
        v-if="index < breadcrumbItems.length - 1"
        :to="segment.path"
        class="text-[var(--color-text-3)] hover:text-[var(--color-text-1)] text-sm no-underline transition-colors"
      >
        {{ segment.title }}
      </router-link>
      <span v-else class="text-[var(--color-text-1)] text-sm font-medium">
        {{ segment.title }}
      </span>
    </a-breadcrumb-item>
  </a-breadcrumb>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'ZhaoBreadcrumb' })

const route = useRoute()
const { t } = useI18n()

const breadcrumbItems = computed(() => {
  const items: { path: string; title: string }[] = []

  for (const matched of route.matched) {
    const meta = matched.meta as Record<string, any> | undefined
    const titleKey = meta?.title as string | undefined
    if (titleKey) {
      items.push({
        path: matched.path || '/',
        title: t(titleKey),
      })
    }
  }

  // 如果 route.matched 没有数据，从当前路由获取
  if (items.length === 0) {
    const titleKey = route.meta?.title as string | undefined
    if (titleKey) {
      items.push({
        path: route.path,
        title: t(titleKey),
      })
    }
  }

  return items
})
</script>
