<template>
  <div
    class="flex items-center justify-between h-full px-4 border-b border-[var(--color-border)]"
    :style="{ background: 'var(--color-bg-2)' }"
  >
    <!-- 左半部分 -->
    <div class="flex items-center gap-2 min-w-0">
      <!-- 菜单折叠/展开按钮 -->
      <div
        v-if="shouldShowMenuButton && !isTopMenu"
        class="flex items-center justify-center w-8 h-8 rounded-md cursor-pointer text-[var(--color-text-3)] hover:text-[var(--color-text-1)] hover:bg-[var(--color-fill-2)] transition-colors"
        @click="$emit('toggle-menu')"
      >
        <ZhaoIcon
          :icon="settingStore.menuOpen ? 'ri:menu-fold-line' : 'ri:menu-unfold-line'"
          class="text-lg"
        />
      </div>

      <!-- 刷新按钮 -->
      <div
        v-if="shouldShowRefreshButton"
        class="flex items-center justify-center w-8 h-8 rounded-md cursor-pointer text-[var(--color-text-3)] hover:text-[var(--color-text-1)] hover:bg-[var(--color-fill-2)] transition-colors"
        @click="common.refresh"
      >
        <ZhaoIcon icon="ri:refresh-line" class="text-lg" />
      </div>

      <!-- 面包屑 -->
      <ZhaoBreadcrumb v-if="shouldShowBreadcrumb" />
    </div>

    <!-- 右半部分 -->
    <div class="flex items-center gap-1">
      <!-- 水平菜单（TOP 模式） -->
      <ZhaoHorizontalMenu
        v-if="isTopMenu"
        :menu-list="menuStore.menuList"
        class="mr-4"
        @select="onMenuSelect"
      />

      <!-- 混合菜单（TOP_LEFT 模式） -->
      <ZhaoMixedMenu
        v-if="isTopLeftMenu"
        :menu-list="menuStore.menuList"
        class="mr-4"
        @select="onMenuSelect"
      />

      <!-- 全局搜索 -->
      <div
        v-if="shouldShowGlobalSearch"
        class="flex items-center justify-center w-8 h-8 rounded-md cursor-pointer text-[var(--color-text-3)] hover:text-[var(--color-text-1)] hover:bg-[var(--color-fill-2)] transition-colors"
        @click="mittBus.emit('open-search')"
      >
        <ZhaoIcon icon="ri:search-line" class="text-lg" />
      </div>

      <!-- 全屏 -->
      <div
        v-if="shouldShowFullscreen"
        class="flex items-center justify-center w-8 h-8 rounded-md cursor-pointer text-[var(--color-text-3)] hover:text-[var(--color-text-1)] hover:bg-[var(--color-fill-2)] transition-colors"
        @click="toggleFullscreen"
      >
        <ZhaoIcon
          :icon="isFullscreen ? 'ri:fullscreen-exit-line' : 'ri:fullscreen-line'"
          class="text-lg"
        />
      </div>

      <!-- 语言切换 -->
      <a-dropdown v-if="shouldShowLanguage" trigger="click" @select="onLanguageChange">
        <div
          class="flex items-center justify-center w-8 h-8 rounded-md cursor-pointer text-[var(--color-text-3)] hover:text-[var(--color-text-1)] hover:bg-[var(--color-fill-2)] transition-colors"
        >
          <ZhaoIcon icon="ri:global-line" class="text-lg" />
        </div>
        <template #content>
          <a-doption value="zh">中文</a-doption>
          <a-doption value="en">English</a-doption>
        </template>
      </a-dropdown>

      <!-- 通知 -->
      <div
        v-if="shouldShowNotification"
        class="flex items-center justify-center w-8 h-8 rounded-md cursor-pointer text-[var(--color-text-3)] hover:text-[var(--color-text-1)] hover:bg-[var(--color-fill-2)] transition-colors"
      >
        <a-badge :count="3" :dot="true">
          <ZhaoIcon icon="ri:notification-line" class="text-lg" />
        </a-badge>
      </div>

      <!-- 设置面板 -->
      <div
        v-if="shouldShowSettings"
        class="flex items-center justify-center w-8 h-8 rounded-md cursor-pointer text-[var(--color-text-3)] hover:text-[var(--color-text-1)] hover:bg-[var(--color-fill-2)] transition-colors"
        @click="mittBus.emit('open-settings')"
      >
        <ZhaoIcon icon="ri:settings-3-line" class="text-lg" />
      </div>

      <!-- 主题切换 -->
      <div
        v-if="shouldShowThemeToggle"
        class="flex items-center justify-center w-8 h-8 rounded-md cursor-pointer text-[var(--color-text-3)] hover:text-[var(--color-text-1)] hover:bg-[var(--color-fill-2)] transition-colors"
        @click="toggleTheme"
      >
        <ZhaoIcon :icon="settingStore.isDark ? 'ri:sun-line' : 'ri:moon-line'" class="text-lg" />
      </div>

      <!-- 用户菜单 -->
      <a-dropdown trigger="click" @select="onUserMenuSelect">
        <div
          class="flex items-center gap-2 ml-2 px-2 py-1 rounded-md cursor-pointer hover:bg-[var(--color-fill-2)] transition-colors"
        >
          <div
            class="w-7 h-7 rounded-full bg-[var(--theme-color,#5d87ff)] flex items-center justify-center text-white text-xs font-medium"
          >
            {{ userAvatarText }}
          </div>
          <span class="text-sm text-[var(--color-text-1)] hidden sm:inline">{{ userName }}</span>
          <ZhaoIcon icon="ri:arrow-down-s-line" class="text-sm text-[var(--color-text-3)]" />
        </div>
        <template #content>
          <a-doption value="center">
            <ZhaoIcon icon="ri:user-line" class="mr-2" />
            {{ t('topBar.user.userCenter') }}
          </a-doption>
          <a-doption value="docs">
            <ZhaoIcon icon="ri:file-text-line" class="mr-2" />
            {{ t('topBar.user.docs') }}
          </a-doption>
          <a-doption value="github">
            <ZhaoIcon icon="ri:github-line" class="mr-2" />
            GitHub
          </a-doption>
          <a-doption divided value="lock">
            <ZhaoIcon icon="ri:lock-line" class="mr-2" />
            {{ t('topBar.user.lockScreen') }}
          </a-doption>
          <a-doption value="logout">
            <ZhaoIcon icon="ri:logout-box-r-line" class="mr-2" />
            {{ t('topBar.user.logout') }}
          </a-doption>
        </template>
      </a-dropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import ZhaoBreadcrumb from '@/components/core/layouts/zhao-breadcrumb/index.vue'
import ZhaoHorizontalMenu from '@/components/core/layouts/zhao-menus/zhao-horizontal-menu/index.vue'
import ZhaoMixedMenu from '@/components/core/layouts/zhao-menus/zhao-mixed-menu/index.vue'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '@/store/modules/user'
import { useSettingStore } from '@/store/modules/setting'
import { useMenuStore } from '@/store/modules/menu'
import { useWorktabStore } from '@/store/modules/worktab'
import { useHeaderBar } from '@/hooks/core/useHeaderBar'
import { useCommon } from '@/hooks/core/useCommon'
import { useTheme } from '@/hooks/core/useTheme'
import { MenuTypeEnum, LanguageEnum, SystemThemeEnum } from '@/enums/appEnum'
import { Message, Modal } from '@arco-design/web-vue'
import mittBus from '@/utils/mitt'
import type { AppRouteRecord } from '@/types/router'
import ZhaoIcon from '@/components/icons/ZhaoIcon.vue'

defineOptions({ name: 'ZhaoHeaderBar' })

defineEmits<{
  'toggle-menu': []
}>()

const router = useRouter()
const { t, locale } = useI18n()
const userStore = useUserStore()
const settingStore = useSettingStore()
const menuStore = useMenuStore()
const worktabStore = useWorktabStore()
const common = useCommon()
const headerBar = useHeaderBar()
const { switchThemeStyles } = useTheme()

// ── 功能开关 ──
const shouldShowMenuButton = headerBar.shouldShowMenuButton
const shouldShowRefreshButton = headerBar.shouldShowRefreshButton
const shouldShowBreadcrumb = headerBar.shouldShowBreadcrumb
const shouldShowGlobalSearch = headerBar.shouldShowGlobalSearch
const shouldShowFullscreen = headerBar.shouldShowFullscreen
const shouldShowNotification = headerBar.shouldShowNotification
const shouldShowLanguage = headerBar.shouldShowLanguage
const shouldShowSettings = headerBar.shouldShowSettings
const shouldShowThemeToggle = headerBar.shouldShowThemeToggle

// ── 布局模式判断 ──
const isTopMenu = computed(() => settingStore.menuType === MenuTypeEnum.TOP)
const isTopLeftMenu = computed(() => settingStore.menuType === MenuTypeEnum.TOP_LEFT)

// ── 用户信息 ──
const userAvatarText = computed(() => {
  return (userStore.info.userName || 'U').charAt(0).toUpperCase()
})
const userName = computed(() => userStore.info.userName || 'User')

// ── 全屏 ──
const isFullscreen = computed(() => !!document.fullscreenElement)
const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
  } else {
    document.exitFullscreen()
  }
}

// ── 语言切换 ──
const onLanguageChange = (value: string | number | Record<string, any> | undefined) => {
  if (value === 'zh' || value === 'en') {
    locale.value = value
    userStore.setLanguage(value === 'zh' ? LanguageEnum.ZH : LanguageEnum.EN)
    Message.success(t('common.tips'))
  }
}

// ── 用户菜单 ──
const onUserMenuSelect = (value: string | number | Record<string, any> | undefined) => {
  if (value === 'logout') {
    Modal.confirm({
      title: t('common.tips'),
      content: t('common.logOutTips'),
      onOk: () => userStore.logOut(),
    })
  } else if (value === 'lock') {
    userStore.setLockStatus(true)
  }
}

// ── 菜单选中（来自 ArtHorizontalMenu / ArtMixedMenu） ──
const onMenuSelect = (item: AppRouteRecord) => {
  const path = item.meta?.link || item.path
  if (!path) return
  router.push(path)
  worktabStore.openTab({
    path,
    name: item.name as string,
    title: item.meta?.title || '',
    icon: item.meta?.icon,
    keepAlive: item.meta?.keepAlive ?? true,
    fixedTab: item.meta?.fixedTab ?? false,
  })
}

// ── 主题切换 ──
const toggleTheme = () => {
  switchThemeStyles(settingStore.isDark ? SystemThemeEnum.LIGHT : SystemThemeEnum.DARK)
}
</script>
