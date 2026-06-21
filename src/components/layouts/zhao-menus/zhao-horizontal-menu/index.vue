<template>
  <a-menu
    mode="horizontal"
    :selected-keys="selectedKeys"
    @menu-item-click="onClick"
    class="bg-transparent border-0"
  >
    <template v-for="item in menuList" :key="item.path">
      <a-sub-menu v-if="item.children?.length" :key="item.path" :title="t(item.meta?.title || '')">
        <template #icon>
          <ZhaoIcon v-if="item.meta?.icon" :icon="item.meta.icon" />
        </template>
        <a-menu-item v-for="child in item.children" :key="child.path">
          <template #icon>
            <ZhaoIcon v-if="child.meta?.icon" :icon="child.meta.icon" />
          </template>
          {{ t(child.meta?.title || '') }}
        </a-menu-item>
      </a-sub-menu>
      <a-menu-item v-else :key="item.path">
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
import ZhaoIcon from '@/components/icons/ZhaoIcon.vue'

defineOptions({ name: 'ZhaoHorizontalMenu' })

const props = defineProps<{
  menuList: AppRouteRecord[]
}>()

const emit = defineEmits<{
  select: [item: AppRouteRecord]
}>()

const route = useRoute()
const { t } = useI18n()

const selectedKeys = computed(() => [route.path])

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
