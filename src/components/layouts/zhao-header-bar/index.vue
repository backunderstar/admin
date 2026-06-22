<template>
  <div class="flex items-center justify-between h-full">
    <!-- 左半部分 -->
    <div class="flex items-center gap-2 min-w-0">
      <!-- 菜单折叠/展开按钮 -->
      <ZhaoIconButton
        v-if="shouldShowMenuButton && !isTopMenu"
        :icon="settingStore.menuOpen ? 'ri:menu-fold-line' : 'ri:menu-unfold-line'"
        @click="$emit('toggle-menu')"
      />

      <!-- 刷新按钮 -->
      <ZhaoIconButton
        v-if="shouldShowRefreshButton"
        icon="ri:refresh-line"
        @click="common.refresh"
      />

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
        @select="nav.navigateByItem"
      />

      <!-- 混合菜单（TOP_LEFT 模式） -->
      <ZhaoMixedMenu
        v-if="isTopLeftMenu"
        :menu-list="menuStore.menuList"
        class="mr-4"
        @select="nav.navigateByItem"
      />

      <!-- 全局搜索 -->
      <ZhaoIconButton
        v-if="shouldShowGlobalSearch"
        icon="ri:search-line"
        @click="mittBus.emit('open-search')"
      />

      <!-- 全屏 -->
      <ZhaoIconButton
        v-if="shouldShowFullscreen"
        :icon="isFullscreen ? 'ri:fullscreen-exit-line' : 'ri:fullscreen-line'"
        @click="toggleFullscreen"
      />

      <!-- 语言切换 -->
      <a-dropdown v-if="shouldShowLanguage" trigger="click" @select="onLanguageChange">
        <div
          class="flex items-center justify-center w-8 h-8 rounded-md cursor-pointer text-(--color-text-3) hover:text-(--color-text-1) hover:bg-(--color-fill-2) transition-colors"
        >
          <ZhaoIcon icon="ri:global-line" class="text-lg" />
        </div>
        <template #content>
          <a-doption value="zh">中文</a-doption>
          <a-doption value="en">English</a-doption>
        </template>
      </a-dropdown>

      <!-- 设置面板 -->
      <ZhaoIconButton
        v-if="shouldShowSettings"
        icon="ri:settings-3-line"
        @click="mittBus.emit('open-settings')"
      />

      <!-- 主题切换 -->
      <ZhaoIconButton
        v-if="shouldShowThemeToggle"
        :icon="settingStore.isDark ? 'ri:sun-line' : 'ri:moon-line'"
        @click="toggleTheme"
      />

      <!-- 用户菜单 -->
      <ZhaoUserDropdown />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import ZhaoBreadcrumb from '@/components/layouts/zhao-breadcrumb/index.vue'
import ZhaoHorizontalMenu from '@/components/layouts/zhao-menus/zhao-horizontal-menu/index.vue'
import ZhaoMixedMenu from '@/components/layouts/zhao-menus/zhao-mixed-menu/index.vue'
import ZhaoIconButton from '@/components/layouts/zhao-icon-button/index.vue'
import ZhaoUserDropdown from '@/components/layouts/zhao-user-dropdown/index.vue'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '@/store/modules/user'
import { useSettingStore } from '@/store/modules/setting'
import { useMenuStore } from '@/store/modules/menu'
import { useHeaderBar } from '@/hooks/core/useHeaderBar'
import { useCommon } from '@/hooks/core/useCommon'
import { useTheme } from '@/hooks/core/useTheme'
import { useMenuNavigation } from '@/hooks/core/useMenuNavigation'
import { MenuTypeEnum, LanguageEnum, SystemThemeEnum } from '@/enums/appEnum'
import { Message } from '@arco-design/web-vue'
import mittBus from '@/utils/mitt'
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
const common = useCommon()
const headerBar = useHeaderBar()
const { switchThemeStyles } = useTheme()
const nav = useMenuNavigation()

// ── 功能开关 ──
const shouldShowMenuButton = headerBar.shouldShowMenuButton
const shouldShowRefreshButton = headerBar.shouldShowRefreshButton
const shouldShowBreadcrumb = headerBar.shouldShowBreadcrumb
const shouldShowGlobalSearch = headerBar.shouldShowGlobalSearch
const shouldShowFullscreen = headerBar.shouldShowFullscreen
// const shouldShowNotification = headerBar.shouldShowNotification
const shouldShowLanguage = headerBar.shouldShowLanguage
const shouldShowSettings = headerBar.shouldShowSettings
const shouldShowThemeToggle = headerBar.shouldShowThemeToggle

// ── 布局模式判断 ──
const isTopMenu = computed(() => settingStore.menuType === MenuTypeEnum.TOP)
const isTopLeftMenu = computed(() => settingStore.menuType === MenuTypeEnum.TOP_LEFT)

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

// ── 主题切换 ──
const toggleTheme = () => {
  switchThemeStyles(settingStore.isDark ? SystemThemeEnum.LIGHT : SystemThemeEnum.DARK)
}
</script>
