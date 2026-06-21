<template>
  <div
    v-if="worktabStore.hasOpenedTabs"
    class="flex items-center border-b border-[var(--color-border)] bg-[var(--color-bg-2)] overflow-hidden"
    style="height: 40px"
  >
    <!-- 左滚动按钮 -->
    <div
      v-show="canScrollLeft"
      class="flex-shrink-0 flex items-center justify-center w-6 h-full cursor-pointer text-[var(--color-text-3)] hover:text-[var(--color-text-1)] hover:bg-[var(--color-fill-1)] transition-colors"
      @click="scrollTabs(-200)"
    >
      <ZhaoIcon icon="ri:arrow-left-s-line" />
    </div>

    <div
      ref="tabContainer"
      class="flex-1 flex items-center overflow-x-auto overflow-y-hidden scrollbar-none px-1"
      @wheel.prevent="onWheel"
    >
      <div
        v-for="tab in worktabStore.opened"
        :key="tab.path"
        class="tab-item flex items-center gap-1.5 px-3 h-8 mx-0.5 rounded-md cursor-pointer text-sm whitespace-nowrap transition-colors flex-shrink-0"
        :class="
          worktabStore.current.path === tab.path
            ? 'tab-active bg-[var(--color-fill-2)] text-[var(--color-text-1)] font-medium'
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

    <!-- 右滚动按钮 -->
    <div
      v-show="canScrollRight"
      class="flex-shrink-0 flex items-center justify-center w-6 h-full cursor-pointer text-[var(--color-text-3)] hover:text-[var(--color-text-1)] hover:bg-[var(--color-fill-1)] transition-colors"
      @click="scrollTabs(200)"
    >
      <ZhaoIcon icon="ri:arrow-right-s-line" />
    </div>

    <!-- 右键菜单 -->
    <Teleport to="body">
      <div
        v-if="contextMenuVisible"
        class="context-menu"
        :style="{ left: `${contextMenuPos.x}px`, top: `${contextMenuPos.y}px` }"
      >
        <div class="context-menu-item" @click="onContextMenuAction('refresh')">
          <ZhaoIcon icon="ri:refresh-line" class="mr-2" />
          {{ t('worktab.btn.refresh') }}
        </div>
        <div class="context-menu-item" @click="onContextMenuAction('closeLeft')">
          <ZhaoIcon icon="ri:arrow-left-s-line" class="mr-2" />
          {{ t('worktab.btn.closeLeft') }}
        </div>
        <div class="context-menu-item" @click="onContextMenuAction('closeRight')">
          <ZhaoIcon icon="ri:arrow-right-s-line" class="mr-2" />
          {{ t('worktab.btn.closeRight') }}
        </div>
        <div class="context-menu-item" @click="onContextMenuAction('closeOther')">
          <ZhaoIcon icon="ri:subtract-line" class="mr-2" />
          {{ t('worktab.btn.closeOther') }}
        </div>
        <div class="context-menu-item" @click="onContextMenuAction('closeAll')">
          <ZhaoIcon icon="ri:close-circle-line" class="mr-2" />
          {{ t('worktab.btn.closeAll') }}
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useWorktabStore } from '@/store/modules/worktab'
import { useCommon } from '@/hooks/core/useCommon'
import type { WorkTab } from '@/types'
import ZhaoIcon from '@/components/icons/ZhaoIcon.vue'

defineOptions({ name: 'ZhaoWorkTab' })

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const worktabStore = useWorktabStore()
const common = useCommon()

const tabContainer = ref<HTMLElement>()

// ── 滚动状态 ──
const canScrollLeft = ref(false)
const canScrollRight = ref(false)

const updateScrollState = () => {
  const el = tabContainer.value
  if (!el) return
  canScrollLeft.value = el.scrollLeft > 0
  canScrollRight.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 1
}

const scrollTabs = (offset: number) => {
  tabContainer.value?.scrollBy({ left: offset, behavior: 'smooth' })
}

const onWheel = (e: WheelEvent) => {
  tabContainer.value?.scrollBy({ left: e.deltaY, behavior: 'auto' })
}

// 滚动到激活的标签
const scrollToActiveTab = () => {
  nextTick(() => {
    const container = tabContainer.value
    if (!container) return
    const active = container.querySelector('.tab-active') as HTMLElement | null
    if (!active) return
    const left = active.offsetLeft - container.offsetLeft
    const right = left + active.offsetWidth
    if (left < container.scrollLeft) {
      container.scrollTo({ left: left - 10, behavior: 'smooth' })
    } else if (right > container.scrollLeft + container.clientWidth) {
      container.scrollTo({ left: right - container.clientWidth + 10, behavior: 'smooth' })
    }
  })
}

// ── 切换标签 ──
const switchTab = (tab: WorkTab) => {
  const path = tab.path || '/'
  router.push({ path, query: tab.query as Record<string, string> })
}

// 路由变化时滚动到激活标签并更新滚动状态
watch(
  () => route.path,
  () => {
    nextTick(() => {
      updateScrollState()
      scrollToActiveTab()
    })
  },
)

// 标签数量变化时更新滚动状态
watch(
  () => worktabStore.opened.length,
  () => nextTick(updateScrollState),
)

// ── 标题（优先使用自定义标题） ──
const getTabTitle = (tab: WorkTab): string => {
  if (tab.customTitle) return tab.customTitle
  if (tab.title) return t(tab.title)
  return tab.title || ''
}

// ── 右键菜单 ──
const contextMenuVisible = ref(false)
const contextMenuTab = ref<WorkTab>()
const contextMenuPos = ref({ x: 0, y: 0 })

const onContextMenu = (event: MouseEvent, tab: WorkTab) => {
  event.preventDefault()
  event.stopPropagation()
  contextMenuTab.value = tab
  contextMenuPos.value = { x: event.clientX, y: event.clientY }
  contextMenuVisible.value = true
}

// 点击外部关闭
const closeContextMenu = () => {
  contextMenuVisible.value = false
}

onMounted(() => {
  // 右键菜单关闭
  document.addEventListener('click', closeContextMenu)
  document.addEventListener('contextmenu', closeContextMenu)
  // 滚动状态
  tabContainer.value?.addEventListener('scroll', updateScrollState, { passive: true })
  new ResizeObserver(updateScrollState).observe(tabContainer.value!)
  updateScrollState()
})

onBeforeUnmount(() => {
  document.removeEventListener('click', closeContextMenu)
  document.removeEventListener('contextmenu', closeContextMenu)
})

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

<style>
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
