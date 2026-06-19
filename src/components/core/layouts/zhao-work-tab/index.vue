<template>
  <div
    v-if="worktabStore.hasOpenedTabs"
    class="flex items-center border-b border-[var(--color-border)] bg-[var(--color-bg-2)] overflow-hidden"
    style="height: 40px"
  >
    <div
      ref="tabContainer"
      class="flex-1 flex items-center overflow-x-auto overflow-y-hidden scrollbar-none px-1"
    >
      <div
        v-for="tab in worktabStore.opened"
        :key="tab.path"
        class="tab-item flex items-center gap-1.5 px-3 h-8 mx-0.5 rounded-md cursor-pointer text-sm whitespace-nowrap transition-colors flex-shrink-0"
        :class="
          worktabStore.current.path === tab.path
            ? 'bg-[var(--color-fill-2)] text-[var(--color-text-1)] font-medium'
            : 'text-[var(--color-text-3)] hover:text-[var(--color-text-2)] hover:bg-[var(--color-fill-1)]'
        "
        @click="switchTab(tab)"
        @contextmenu.prevent="onContextMenu($event, tab)"
      >
        <ZhaoIcon v-if="tab.icon" :icon="tab.icon" class="text-sm" />
        <span class="truncate max-w-[120px]">{{ getTabTitle(tab) }}</span>
        <!-- 固定标签显示锁定图标 -->
        <ZhaoIcon
          v-if="tab.fixedTab"
          icon="ri:pushpin-line"
          class="text-xs text-[var(--color-text-4)] flex-shrink-0"
        />
        <!-- 可关闭标签的 × 按钮 -->
        <div
          v-else
          class="flex items-center justify-center w-4 h-4 rounded-sm hover:bg-[var(--color-fill-3)] flex-shrink-0 opacity-0 group-hover:opacity-100"
          :class="{ '!opacity-100': worktabStore.current.path === tab.path }"
          @click.stop="worktabStore.removeTab(tab.path)"
        >
          <ZhaoIcon icon="ri:close-line" class="text-xs" />
        </div>
      </div>
    </div>

    <!-- 右键菜单 -->
    <a-dropdown
      :popup-visible="contextMenuVisible"
      trigger="manual"
      @select="onContextMenuAction"
      @popup-visible-change="
        (v: boolean) => {
          if (!v) contextMenuVisible = false
        }
      "
    >
      <template #content>
        <a-doption value="refresh">
          <ZhaoIcon icon="ri:refresh-line" class="mr-2" />
          {{ t('worktab.btn.refresh') }}
        </a-doption>
        <a-doption value="closeLeft">
          <ZhaoIcon icon="ri:arrow-left-s-line" class="mr-2" />
          {{ t('worktab.btn.closeLeft') }}
        </a-doption>
        <a-doption value="closeRight">
          <ZhaoIcon icon="ri:arrow-right-s-line" class="mr-2" />
          {{ t('worktab.btn.closeRight') }}
        </a-doption>
        <a-doption value="closeOther">
          <ZhaoIcon icon="ri:subtract-line" class="mr-2" />
          {{ t('worktab.btn.closeOther') }}
        </a-doption>
        <a-doption value="closeAll">
          <ZhaoIcon icon="ri:close-circle-line" class="mr-2" />
          {{ t('worktab.btn.closeAll') }}
        </a-doption>
      </template>
    </a-dropdown>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useWorktabStore } from '@/store/modules/worktab'
import { useCommon } from '@/hooks/core/useCommon'
import type { WorkTab } from '@/types'

defineOptions({ name: 'ZhaoWorkTab' })

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const worktabStore = useWorktabStore()
const common = useCommon()

const tabContainer = ref<HTMLElement>()

// ── 切换标签 ──
const switchTab = (tab: WorkTab) => {
  const path = tab.path || '/'
  router.push({ path, query: tab.query as Record<string, string> })
}

// ── 标题（优先使用自定义标题） ──
const getTabTitle = (tab: WorkTab): string => {
  if (tab.customTitle) return tab.customTitle
  if (tab.title) return t(tab.title)
  return tab.title || ''
}

// ── 右键菜单 ──
const contextMenuVisible = ref(false)
const contextMenuTab = ref<WorkTab>()

const onContextMenu = (event: MouseEvent, tab: WorkTab) => {
  contextMenuTab.value = tab
  contextMenuVisible.value = true
}

const onContextMenuAction = (value: string | number | Record<string, any> | undefined) => {
  const tab = contextMenuTab.value
  if (!tab || !tab.path) return
  contextMenuVisible.value = false

  const path = tab.path
  switch (value) {
    case 'refresh':
      common.refresh()
      break
    case 'closeLeft':
      worktabStore.removeLeft(path)
      break
    case 'closeRight':
      worktabStore.removeRight(path)
      break
    case 'closeOther':
      worktabStore.removeOthers(path)
      break
    case 'closeAll':
      worktabStore.removeAll()
      break
  }
}
</script>

<style scoped>
.tab-item {
  user-select: none;
}
.tab-item:hover .opacity-0 {
  opacity: 1;
}
.scrollbar-none {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.scrollbar-none::-webkit-scrollbar {
  display: none;
}
</style>
