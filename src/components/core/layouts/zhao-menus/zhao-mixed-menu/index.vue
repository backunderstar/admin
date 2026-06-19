<template>
  <a-menu
    mode="horizontal"
    :selected-keys="selectedKeys"
    @menu-item-click="onClick"
    class="bg-transparent border-0"
  >
    <template v-for="item in firstLevelMenus" :key="item.path">
      <a-menu-item :key="item.path">
        <template #icon>
          <ZhaoIcon v-if="item.meta?.icon" :icon="item.meta.icon" />
        </template>
        {{ t(item.meta?.title || '') }}
      </a-menu-item>
    </template>
  </a-menu>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { AppRouteRecord } from '@/types/router'

defineOptions({ name: 'ZhaoMixedMenu' })

const props = defineProps<{
  menuList: AppRouteRecord[]
}>()

const emit = defineEmits<{
  select: [item: AppRouteRecord]
}>()

const route = useRoute()
const { t } = useI18n()

// 只显示一级菜单
const firstLevelMenus = computed(() => props.menuList)

const selectedKeys = computed(() => {
  // 找到当前路由对应的一级菜单
  for (const item of props.menuList) {
    if (item.path && route.path.startsWith(item.path)) {
      return [item.path]
    }
  }
  return []
})

const onClick = (key: string) => {
  const item = findItem(props.menuList, key)
  if (item) emit('select', item)
}

function findItem(list: AppRouteRecord[], path: string): AppRouteRecord | null {
  for (const item of list) {
    if (item.path === path) return item
    if (item.children) {
      const found = findItem(item.children, path)
      if (found) return found
    }
  }
  return null
}
</script>
