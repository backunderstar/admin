<!-- src/components/layouts/zhao-sidebar/index.vue -->
<template>
  <aside
    id="app-sidebar"
    class="relative shrink-0 h-full overflow-hidden z-20 select-none rounded-lg"
    :style="{ width: sidebarWidth }"
  >
    <!-- 双列模式 -->
    <template v-if="isDualMenu">
      <div class="flex h-full">
        <!-- 左栏：一级图标 -->
        <div
          class="w-16 flex flex-col items-center py-3 border-r border-(--color-border)"
          :style="{ background: menuTheme.background }"
        >
          <div
            class="w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer shrink-0"
            :style="{ background: 'var(--theme-color, #5d87ff)' }"
          >
            <ZhaoIcon icon="ri:admin-line" class="text-white text-lg" />
          </div>
          <div class="flex-1 w-full mt-3 space-y-1 overflow-y-auto scrollbar-none">
            <a-tooltip
              v-for="item in topLevelMenus"
              :key="item.path"
              :content="item.meta?.title ? $t(item.meta.title) : ''"
              placement="right"
            >
              <div
                class="flex flex-col items-center py-2.5 mx-1.5 rounded-lg cursor-pointer transition-colors"
                :class="
                  (activeFirstLevel ?? '') === (item.path ?? '')
                    ? 'text-(--color-primary-light-4) bg-(--color-fill-2)'
                    : 'text-(--color-text-3) hover:text-(--color-text-2) hover:bg-(--color-fill-1)'
                "
                @click="setActiveFirstLevel(item)"
              >
                <ZhaoIcon :icon="item.meta?.icon || 'ri:folder-line'" class="text-xl" />
              </div>
            </a-tooltip>
          </div>
        </div>
        <!-- 右栏：子菜单 -->
        <div
          v-show="dualMenuShowText"
          class="flex-1 overflow-y-auto scrollbar-none py-3"
          :style="{ background: menuTheme.background }"
        >
          <a-menu
            :selected-keys="[route.path]"
            mode="vertical"
            :collapsed="false"
            :accordion="uniqueOpened"
            @menu-item-click="onMenuItemClick"
          >
            <template v-for="item in currentChildren" :key="item.path">
              <RecursiveMenuItem :item="item" />
            </template>
          </a-menu>
        </div>
      </div>
    </template>

    <!-- 标准侧边栏 -->
    <template v-else>
      <div
        class="flex flex-col h-full border-r border-(--color-border)"
        :style="{ background: menuTheme.background }"
      >
        <!-- Logo -->
        <div
          class="flex items-center justify-center h-16 shrink-0 cursor-pointer"
          @click="$emit('home')"
        >
          <div
            class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            :style="{ background: 'var(--theme-color, #5d87ff)' }"
          >
            <ZhaoIcon icon="ri:admin-line" class="text-white text-base" />
          </div>
          <span
            class="text-base font-bold whitespace-nowrap overflow-hidden transition-all duration-250"
            :class="menuOpen ? 'max-w-50 opacity-100 ml-3' : 'max-w-0 opacity-0 ml-0'"
            :style="{ color: menuTheme.systemNameColor }"
          >
            {{ systemName }}
          </span>
        </div>
        <!-- 菜单 -->
        <div
          class="flex-1 overflow-y-auto scrollbar-none py-2"
          :class="{ 'flex justify-center': !menuOpen }"
        >
          <a-menu
            :selected-keys="[route.path]"
            :open-keys="openKeys"
            @update:open-keys="(v: string[]) => $emit('update:openKeys', v)"
            mode="vertical"
            :collapsed="!menuOpen"
            :accordion="uniqueOpened"
            @menu-item-click="onMenuItemClick"
          >
            <template v-for="item in menuList" :key="item.path">
              <RecursiveMenuItem :item="item" />
            </template>
          </a-menu>
        </div>
        <!-- 折叠按钮 -->
        <div
          class="shrink-0 h-10 flex items-center justify-center cursor-pointer border-t border-(--color-border) text-(--color-text-3) hover:text-(--color-text-1) transition-colors"
          :style="{ background: menuTheme.background }"
          @click="$emit('toggle-collapse')"
        >
          <ZhaoIcon
            :icon="menuOpen ? 'ri:menu-fold-line' : 'ri:menu-unfold-line'"
            class="text-lg"
          />
        </div>
      </div>
    </template>
  </aside>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import RecursiveMenuItem from '@/views/components/RecursiveMenuItem.vue'
import { findMenuItem, findParentPaths } from '@/utils/navigation/route'
import type { AppRouteRecord } from '@/types/router'
import ZhaoIcon from '@/components/icons/ZhaoIcon.vue'

defineOptions({ name: 'ZhaoSidebar' })

const props = defineProps<{
  isDualMenu: boolean
  menuOpen: boolean
  sidebarWidth: string
  menuTheme: { background: string; systemNameColor?: string }
  topLevelMenus: AppRouteRecord[]
  currentChildren: AppRouteRecord[]
  dualMenuShowText: boolean
  openKeys: string[]
  activeFirstLevel?: string
  menuList: AppRouteRecord[]
  uniqueOpened: boolean
  systemName: string
}>()

const emit = defineEmits<{
  'update:openKeys': [keys: string[]]
  'update:activeFirstLevel': [key: string]
  'menu-select': [key: string]
  'toggle-collapse': []
  home: []
}>()

const route = useRoute()

// ── 双列模式一级菜单激活 ──
const setActiveFirstLevel = (item: AppRouteRecord) => {
  emit('update:activeFirstLevel', item.path || '')
  if (item.children?.length) {
    const first = item.children[0]
    if (first) onMenuItemClick(first.path || '')
    else if (item.path) onMenuItemClick(item.path)
  } else if (item.path) {
    onMenuItemClick(item.path)
  }
}

// ── 菜单点击 ──
const onMenuItemClick = (key: string) => {
  emit('menu-select', key)
}

// ── 路由变化时自动展开父级（标准模式） ──
watch(
  () => route.path,
  (path) => {
    if (!props.isDualMenu) {
      const parentKeys = findParentPaths(props.menuList, path)
      const currentOpenKeys = [...props.openKeys]
      let changed = false
      for (const key of parentKeys) {
        if (!currentOpenKeys.includes(key)) {
          currentOpenKeys.push(key)
          changed = true
        }
      }
      if (changed) {
        emit('update:openKeys', currentOpenKeys)
      }
    }
  },
  { immediate: true },
)

// ── 双列模式：路由变化时激活对应一级菜单 ──
watch(
  () => route.path,
  (path) => {
    if (path && props.isDualMenu) {
      for (const item of props.topLevelMenus) {
        if (item.path && path.startsWith(item.path)) {
          emit('update:activeFirstLevel', item.path)
          return
        }
      }
    }
  },
  { immediate: true },
)
</script>

<style scoped>
#app-sidebar {
  transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.scrollbar-none {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.scrollbar-none::-webkit-scrollbar {
  display: none;
}
</style>
