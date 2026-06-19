<template>
  <a-modal
    :visible="visible"
    :footer="false"
    :closable="true"
    width="540px"
    @cancel="close"
    @close="close"
  >
    <div class="py-4">
      <a-input
        ref="inputRef"
        v-model="searchText"
        :placeholder="t('search.placeholder')"
        size="large"
        allow-clear
        @input="onSearch"
        @keydown="onKeydown"
      >
        <template #prefix>
          <ZhaoIcon icon="ri:search-line" class="text-[var(--color-text-3)]" />
        </template>
      </a-input>

      <!-- 搜索结果 -->
      <div v-if="results.length > 0" class="mt-4 space-y-1">
        <div
          v-for="(item, index) in results"
          :key="item.path"
          class="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors"
          :class="
            selectedIndex === index
              ? 'bg-[var(--color-fill-2)] text-[var(--color-text-1)]'
              : 'text-[var(--color-text-2)] hover:bg-[var(--color-fill-1)]'
          "
          @click="navigate(item)"
          @mouseenter="selectedIndex = index"
        >
          <ZhaoIcon v-if="item.meta?.icon" :icon="item.meta.icon" class="text-base" />
          <span>{{ t(item.meta?.title || '') }}</span>
          <span class="ml-auto text-xs text-[var(--color-text-4)]">{{ item.path }}</span>
        </div>
      </div>

      <!-- 空状态 -->
      <div
        v-else-if="searchText && results.length === 0"
        class="mt-8 text-center text-sm text-[var(--color-text-3)]"
      >
        无搜索结果
      </div>

      <!-- 快捷键提示 -->
      <div class="mt-4 flex items-center gap-4 text-xs text-[var(--color-text-4)]">
        <span
          >{{ t('search.switchKeydown') }}:
          <kbd class="px-1 py-0.5 rounded bg-[var(--color-fill-2)]">↑↓</kbd></span
        >
        <span
          >{{ t('search.selectKeydown') }}:
          <kbd class="px-1 py-0.5 rounded bg-[var(--color-fill-2)]">↵</kbd></span
        >
        <span
          >{{ t('search.exitKeydown') }}:
          <kbd class="px-1 py-0.5 rounded bg-[var(--color-fill-2)]">Esc</kbd></span
        >
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useMenuStore } from '@/store/modules/menu'
import mittBus from '@/utils/mitt'
import type { AppRouteRecord } from '@/types/router'

defineOptions({ name: 'ZhaoGlobalSearch' })

const router = useRouter()
const { t } = useI18n()
const menuStore = useMenuStore()

const visible = ref(false)
const searchText = ref('')
const results = ref<AppRouteRecord[]>([])
const selectedIndex = ref(0)
const inputRef = ref()

// 展平菜单列表
function flattenMenu(list: AppRouteRecord[]): AppRouteRecord[] {
  const result: AppRouteRecord[] = []
  for (const item of list) {
    if (!item.meta?.isHide) {
      result.push(item)
      if (item.children) result.push(...flattenMenu(item.children))
    }
  }
  return result
}

const allItems = ref<AppRouteRecord[]>([])

onMounted(() => {
  allItems.value = flattenMenu(menuStore.menuList)

  mittBus.on('open-search', () => {
    visible.value = true
    searchText.value = ''
    results.value = []
    selectedIndex.value = 0
    nextTick(() => inputRef.value?.focus?.())
  })

  // 键盘快捷键
  const onKeydown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault()
      mittBus.emit('open-search')
    }
  }
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  mittBus.off('open-search')
})

const onSearch = () => {
  if (!searchText.value) {
    results.value = []
    return
  }
  const q = searchText.value.toLowerCase()
  results.value = allItems.value.filter((item) => {
    const title = t(item.meta?.title || '').toLowerCase()
    return title.includes(q) || item.path?.includes(q)
  })
  selectedIndex.value = 0
}

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    selectedIndex.value = Math.min(selectedIndex.value + 1, results.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    selectedIndex.value = Math.max(selectedIndex.value - 1, 0)
  } else if (e.key === 'Enter') {
    e.preventDefault()
    if (results.value[selectedIndex.value]) {
      navigate(results.value[selectedIndex.value])
    }
  }
}

const navigate = (item: AppRouteRecord) => {
  const path = item.meta?.link || item.path
  if (path) router.push(path)
  close()
}

const close = () => {
  visible.value = false
}
</script>
