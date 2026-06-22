<template>
  <div class="flex h-screen w-full overflow-hidden bg-(--color-fill-2)">
    <!-- 侧边栏 -->
    <ZhaoSidebar
      v-if="showSidebar"
      :is-dual-menu="isDualMenu"
      :menu-open="menuOpen"
      :sidebar-width="sidebarWidth"
      :menu-theme="getMenuTheme"
      :top-level-menus="menuStore.menuList"
      :current-children="currentChildren"
      :dual-menu-show-text="dualMenuShowText"
      v-model:open-keys="openKeys"
      v-model:active-first-level="activeFirstLevel"
      :menu-list="menuStore.menuList"
      :unique-opened="settingStore.uniqueOpened"
      :system-name="systemInfo.name"
      @menu-select="nav.navigateByKey($event, { closeMobile: closeMobileSidebar })"
      @toggle-collapse="settingStore.setMenuOpen(!menuOpen)"
      @home="goHome"
    />

    <!-- 主内容区 -->
    <main
      id="app-main"
      class="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-(--color-fill-2)"
    >
      <!-- 顶部栏 -->
      <div
        id="app-header"
        class="shrink-0 sticky top-0 z-10 bg-(--color-bg-1) border-b border-(--color-border)"
      >
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
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingStore } from '@/store/modules/setting'
import { useMenuStore } from '@/store/modules/menu'
import { MenuTypeEnum } from '@/enums/appEnum'
import AppConfig from '@/config'
import { useAutoLayoutHeight } from '@/hooks/core/useLayoutHeight'
import { useMenuNavigation } from '@/hooks/core/useMenuNavigation'
import { findMenuItem } from '@/utils/navigation/route'
import ZhaoSidebar from '@/components/layouts/zhao-sidebar/index.vue'
import ZhaoHeaderBar from '@/components/layouts/zhao-header-bar/index.vue'
import ZhaoPageContent from '@/components/layouts/zhao-page-content/index.vue'
import ZhaoGlobalComponent from '@/components/layouts/zhao-global-component/index.vue'
defineOptions({ name: 'AppLayout' })

const router = useRouter()
const settingStore = useSettingStore()
const menuStore = useMenuStore()

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

// ── 展开的菜单（由 ZhaoSidebar 通过 v-model:open-keys 维护） ──
const openKeys = ref<string[]>([])

// ── 一级菜单图标（双列模式） ──
const activeFirstLevel = ref('')

const currentChildren = computed(() => {
  if (!activeFirstLevel.value) return []
  const found = findMenuItem(menuStore.menuList, activeFirstLevel.value)
  return found?.children || []
})

// ── 首页跳转 ──
const goHome = () => {
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

// ── 导航 ──
const nav = useMenuNavigation()

// ── 自动布局高度 ──
useAutoLayoutHeight()
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
