<template>
  <div class="flex h-screen w-full overflow-hidden bg-[var(--color-bg-1)]">
    <!-- ═══════════════════════════════════════════
       侧边栏
     ═══════════════════════════════════════════ -->
    <aside
      v-if="showSidebar"
      id="app-sidebar"
      class="relative flex-shrink-0 h-screen overflow-hidden z-20 select-none"
      :style="{ width: sidebarWidth }"
    >
      <!-- 双列模式 -->
      <template v-if="isDualMenu">
        <div class="flex h-full">
          <!-- 左栏：一级图标 -->
          <div
            class="w-16 flex flex-col items-center py-3 border-r border-[var(--color-border)]"
            :style="{ background: getMenuTheme.background }"
          >
            <div
              class="w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer flex-shrink-0"
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
                    activeFirstLevel === item.path
                      ? 'text-[var(--color-primary-light-4)] bg-[var(--color-fill-2)]'
                      : 'text-[var(--color-text-3)] hover:text-[var(--color-text-2)] hover:bg-[var(--color-fill-1)]'
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
            :style="{ background: getMenuTheme.background }"
          >
            <a-menu
              :selected-keys="[route.path]"
              mode="vertical"
              :collapsed="false"
              :accordion="settingStore.uniqueOpened"
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
          class="flex flex-col h-full border-r border-[var(--color-border)]"
          :style="{ background: getMenuTheme.background }"
        >
          <!-- Logo -->
          <div
            class="flex items-center h-16 px-5 flex-shrink-0 cursor-pointer gap-3"
            @click="goHome"
          >
            <div
              class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              :style="{ background: 'var(--theme-color, #5d87ff)' }"
            >
              <ZhaoIcon icon="ri:admin-line" class="text-white text-base" />
            </div>
            <Transition name="fade">
              <span
                v-show="menuOpen"
                class="text-base font-bold whitespace-nowrap truncate"
                :style="{ color: getMenuTheme.systemNameColor }"
              >
                {{ systemInfo.name }}
              </span>
            </Transition>
          </div>
          <!-- 菜单 -->
          <div class="flex-1 overflow-y-auto scrollbar-none py-2">
            <a-menu
              :selected-keys="[route.path]"
              v-model:open-keys="openKeys"
              mode="vertical"
              :collapsed="!menuOpen"
              :accordion="settingStore.uniqueOpened"
              @menu-item-click="onMenuItemClick"
            >
              <template v-for="item in menuStore.menuList" :key="item.path">
                <RecursiveMenuItem :item="item" />
              </template>
            </a-menu>
          </div>
          <!-- 折叠按钮 -->
          <div
            class="flex-shrink-0 h-10 flex items-center justify-center cursor-pointer border-t border-[var(--color-border)] text-[var(--color-text-3)] hover:text-[var(--color-text-1)] transition-colors"
            :style="{ background: getMenuTheme.background }"
            @click="settingStore.setMenuOpen(!menuOpen)"
          >
            <ZhaoIcon
              :icon="menuOpen ? 'ri:menu-fold-line' : 'ri:menu-unfold-line'"
              class="text-lg"
            />
          </div>
        </div>
      </template>
    </aside>

    <!-- ═══════════════════════════════════════════
       主内容区
     ═══════════════════════════════════════════ -->
    <main id="app-main" class="flex-1 flex flex-col h-screen min-w-0 overflow-hidden">
      <!-- 顶部栏 -->
      <div id="app-header" class="flex-shrink-0 sticky top-0 z-10">
        <ZhaoHeaderBar @toggle-menu="toggleMenu" />
      </div>
      <!-- 页面内容 -->
      <div id="app-content" class="flex-1 overflow-auto min-h-0">
        <ZhaoPageContent />
      </div>
    </main>

    <!-- 全局组件层 -->
    <div id="app-global">
      <ZhaoGlobalComponent />
    </div>

    <!-- 移动端遮罩 -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="isMobileOpen"
          class="fixed inset-0 bg-black/50 z-10"
          @click="closeMobileSidebar"
        />
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useSettingStore } from '@/store/modules/setting'
import { useMenuStore } from '@/store/modules/menu'
import { useWorktabStore } from '@/store/modules/worktab'
import { useI18n } from 'vue-i18n'
import { MenuTypeEnum } from '@/enums/appEnum'
import AppConfig from '@/config'
import { useAutoLayoutHeight } from '@/hooks/core/useLayoutHeight'
import RecursiveMenuItem from '@/views/components/RecursiveMenuItem.vue'
import ZhaoHeaderBar from '@/components/core/layouts/zhao-header-bar/index.vue'
import ZhaoPageContent from '@/components/core/layouts/zhao-page-content/index.vue'
import ZhaoGlobalComponent from '@/components/core/layouts/zhao-global-component/index.vue'
import type { AppRouteRecord } from '@/types/router'
import ZhaoIcon from '@/components/icons/ZhaoIcon.vue'

defineOptions({ name: 'AppLayout' })

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const settingStore = useSettingStore()
const menuStore = useMenuStore()
const worktabStore = useWorktabStore()

const systemInfo = AppConfig.systemInfo

// ── 布局类型 ──
const isLeftMenu = computed(() => settingStore.menuType === MenuTypeEnum.LEFT)
const isTopMenu = computed(() => settingStore.menuType === MenuTypeEnum.TOP)
const isTopLeftMenu = computed(() => settingStore.menuType === MenuTypeEnum.TOP_LEFT)
const isDualMenu = computed(() => settingStore.menuType === MenuTypeEnum.DUAL_MENU)

const showSidebar = computed(() => isLeftMenu.value || isTopLeftMenu.value || isDualMenu.value)
const menuOpen = computed(() => settingStore.menuOpen)

const getMenuTheme = computed(() => settingStore.getMenuTheme)

const dualMenuShowText = computed(() => settingStore.dualMenuShowText)

const sidebarWidth = computed(() => {
  if (isDualMenu.value && !dualMenuShowText.value) return '64px'
  if (!menuOpen.value) return '64px'
  return `${settingStore.menuOpenWidth}px`
})

// ── 展开的菜单（路由变化时自动展开对应父级） ──
const openKeys = ref<string[]>([])

const findParentPaths = (list: AppRouteRecord[], target: string): string[] => {
  for (const item of list) {
    if (item.children?.length) {
      if (item.children.some((c) => target.startsWith(c.path || '') || target === c.path)) {
        return [item.path || '']
      }
      const found = findParentPaths(item.children, target)
      if (found.length) return [item.path || '', ...found]
    }
  }
  return []
}

// 路由变化时，确保当前路由的父级始终展开
watch(
  () => route.path,
  (path) => {
    const parentKeys = findParentPaths(menuStore.menuList, path)
    // 只补充缺失的父级，不关闭用户手动展开的菜单
    for (const key of parentKeys) {
      if (!openKeys.value.includes(key)) {
        openKeys.value.push(key)
      }
    }
  },
  { immediate: true },
)

// ── 一级菜单图标（双列模式） ──
const topLevelMenus = computed(() => menuStore.menuList)
const activeFirstLevel = ref('')

const currentChildren = computed(() => {
  if (!activeFirstLevel.value) return []
  const found = findMenuItem(topLevelMenus.value, activeFirstLevel.value)
  return found?.children || []
})

const setActiveFirstLevel = (item: AppRouteRecord) => {
  activeFirstLevel.value = item.path || ''
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
  const item = findMenuItem(menuStore.menuList, key)
  if (!item) {
    router.push(key)
    return
  }
  const path = item.meta?.link || item.path || key
  router.push(path)
  worktabStore.openTab({
    path,
    name: item.name as string,
    title: item.meta?.title || '',
    icon: item.meta?.icon,
    keepAlive: item.meta?.keepAlive ?? true,
    fixedTab: item.meta?.fixedTab ?? false,
  })
  closeMobileSidebar()
}

// ── 递归查找 ──
function findMenuItem(list: AppRouteRecord[], path: string): AppRouteRecord | null {
  for (const item of list) {
    if (item.path === path) return item
    if (item.children) {
      const found = findMenuItem(item.children, path)
      if (found) return found
    }
  }
  return null
}

// ── 首页跳转 ──
const goHome = () => {
  // menuStore.homePath may not be declared in the store typing
  const home = (menuStore as any).homePath ?? '/'
  if (home) router.push(home)
}

// ── 移动端 ──
const isMobileOpen = ref(false)
const isMobile = ref(false)

const toggleMenu = () => {
  if (isMobile.value) {
    isMobileOpen.value = !isMobileOpen.value
  } else {
    settingStore.setMenuOpen(!menuOpen.value)
  }
}

const closeMobileSidebar = () => {
  isMobileOpen.value = false
}

let resizeHandler: (() => void) | null = null

onMounted(() => {
  const check = () => {
    isMobile.value = window.innerWidth < 800
    if (isMobile.value) isMobileOpen.value = false
  }
  check()
  window.addEventListener('resize', check)
  resizeHandler = check
})

onBeforeUnmount(() => {
  if (resizeHandler) window.removeEventListener('resize', resizeHandler)
})

// ── 双列模式激活 ──
watch(
  () => route.path,
  (path) => {
    if (path && isDualMenu.value) {
      for (const item of topLevelMenus.value) {
        if (item.path && path.startsWith(item.path)) {
          activeFirstLevel.value = item.path
          return
        }
      }
    }
  },
  { immediate: true },
)

// ── 自动布局高度 ──
useAutoLayoutHeight()
</script>

<style scoped>
/* 侧边栏宽度过渡 */
#app-sidebar {
  transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 修正：Arco Design 折叠菜单默认 48px，与侧边栏 64px 不一致导致图标不居中 */
#app-sidebar :deep(.arco-menu-collapsed) {
  width: 100%;
}

#app-sidebar :deep(.arco-menu-collapsed .arco-menu-inner) {
  padding: 4px 8px;
}

/* Logo 文字渐隐 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 隐藏滚动条 */
.scrollbar-none {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.scrollbar-none::-webkit-scrollbar {
  display: none;
}
</style>
