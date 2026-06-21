<template>
  <a-drawer
    :visible="visible"
    :width="360"
    :footer="false"
    :title="t('setting.menuType.title')"
    @cancel="visible = false"
    @close="visible = false"
  >
    <!-- 菜单布局选择 -->
    <div class="mb-6">
      <div class="text-sm font-medium text-[var(--color-text-1)] mb-3">
        {{ t('setting.menuType.title') }}
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div
          v-for="layout in layoutList"
          :key="layout.value"
          class="relative rounded-lg border-2 cursor-pointer overflow-hidden transition-all hover:border-[var(--theme-color)] p-2"
          :class="
            settingStore.menuType === layout.value
              ? 'border-[var(--theme-color,#5d87ff)]'
              : 'border-[var(--color-border)]'
          "
          @click="settingStore.switchMenuLayouts(layout.value as any)"
        >
          <div
            class="aspect-video bg-[var(--color-fill-2)] rounded flex items-center justify-center text-xs text-[var(--color-text-3)]"
          >
            {{ layout.name }}
          </div>
          <div class="text-xs text-center mt-1 text-[var(--color-text-2)]">
            {{ layout.name }}
          </div>
        </div>
      </div>
    </div>

    <!-- 主题切换 -->
    <div class="mb-6">
      <div class="text-sm font-medium text-[var(--color-text-1)] mb-3">
        {{ t('setting.theme.title') }}
      </div>
      <div class="flex gap-3">
        <div
          v-for="theme in themeList"
          :key="theme.theme"
          class="flex-1 rounded-lg border-2 cursor-pointer p-2 text-center transition-all"
          :class="
            settingStore.systemThemeType === theme.theme
              ? 'border-[var(--theme-color,#5d87ff)]'
              : 'border-[var(--color-border)]'
          "
          @click="onThemeChange(theme.theme as any)"
        >
          <div
            class="h-8 rounded flex items-center justify-center text-xs"
            :style="{ background: theme.color?.[0] || '#fff' }"
          >
            {{ t(`setting.theme.list[${themeList.indexOf(theme)}]`) }}
          </div>
          <div class="text-xs mt-1 text-[var(--color-text-2)]">
            {{ theme.name }}
          </div>
        </div>
      </div>
    </div>

    <!-- 主题色 -->
    <div class="mb-6">
      <div class="text-sm font-medium text-[var(--color-text-1)] mb-3">
        {{ t('setting.color.title') }}
      </div>
      <div class="flex gap-2 flex-wrap">
        <div
          v-for="color in mainColors"
          :key="color"
          class="w-7 h-7 rounded-full cursor-pointer transition-all hover:scale-110"
          :class="settingStore.systemThemeColor === color ? 'ring-2 ring-offset-2' : ''"
          :style="{
            background: color,
            '--tw-ring-color': color,
            '--tw-ring-offset-color': 'var(--color-bg-1)',
          }"
          @click="settingStore.setThemeColor(color)"
        />
      </div>
    </div>

    <!-- 圆角 -->
    <div class="mb-6">
      <div class="flex items-center justify-between mb-3">
        <span class="text-sm font-medium text-[var(--color-text-1)]">
          {{ t('setting.basics.list.borderRadius') }}
        </span>
        <span class="text-xs text-[var(--color-text-3)]">{{ settingStore.customRadius }}rem</span>
      </div>
      <a-slider
        :model-value="Number(settingStore.customRadius)"
        :min="0"
        :max="2"
        :step="0.25"
        @change="(v: number) => settingStore.setCustomRadius(String(v))"
      />
    </div>

    <!-- 页面动画 -->
    <div class="mb-6">
      <div class="text-sm font-medium text-[var(--color-text-1)] mb-3">
        {{ t('setting.basics.list.pageTransition') }}
      </div>
      <a-radio-group
        :model-value="settingStore.pageTransition"
        @change="(v: string) => settingStore.setPageTransition(v)"
        type="button"
        size="small"
      >
        <a-radio value="none">{{ t('setting.transition.list.none') }}</a-radio>
        <a-radio value="fade">{{ t('setting.transition.list.fade') }}</a-radio>
        <a-radio value="slide-left">{{ t('setting.transition.list.slideLeft') }}</a-radio>
        <a-radio value="slide-bottom">{{ t('setting.transition.list.slideBottom') }}</a-radio>
        <a-radio value="slide-top">{{ t('setting.transition.list.slideTop') }}</a-radio>
      </a-radio-group>
    </div>

    <!-- 功能开关 -->
    <div class="mb-6">
      <div class="text-sm font-medium text-[var(--color-text-1)] mb-3">
        {{ t('setting.basics.title') }}
      </div>
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-sm text-[var(--color-text-2)]">{{
            t('setting.basics.list.breadcrumb')
          }}</span>
          <a-switch :model-value="settingStore.showCrumbs" @change="settingStore.setCrumbs" />
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm text-[var(--color-text-2)]">{{
            t('setting.basics.list.multiTab')
          }}</span>
          <a-switch
            :model-value="settingStore.showWorkTab"
            @change="(v: boolean) => settingStore.setWorkTab(v)"
          />
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm text-[var(--color-text-2)]">{{
            t('setting.basics.list.progressBar')
          }}</span>
          <a-switch :model-value="settingStore.showNprogress" @change="settingStore.setNprogress" />
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm text-[var(--color-text-2)]">{{
            t('setting.basics.list.language')
          }}</span>
          <a-switch :model-value="settingStore.showLanguage" @change="settingStore.setLanguage" />
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm text-[var(--color-text-2)]">{{
            t('setting.basics.list.accordion')
          }}</span>
          <a-switch
            :model-value="settingStore.uniqueOpened"
            @change="settingStore.setUniqueOpened"
          />
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm text-[var(--color-text-2)]">{{
            t('setting.basics.list.watermark')
          }}</span>
          <a-switch
            :model-value="settingStore.watermarkVisible"
            @change="(v: boolean) => settingStore.setWatermarkVisible(v)"
          />
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm text-[var(--color-text-2)]">双列菜单文字</span>
          <a-switch
            :model-value="settingStore.dualMenuShowText"
            @change="(v: boolean) => settingStore.setDualMenuShowText(v)"
          />
        </div>
      </div>
    </div>
  </a-drawer>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSettingStore } from '@/store/modules/setting'
import { useTheme } from '@/hooks/core/useTheme'
import AppConfig from '@/config'
import { SystemThemeEnum } from '@/enums/appEnum'
import mittBus from '@/utils/mitt'

defineOptions({ name: 'ZhaoSettingsPanel' })

const { t } = useI18n()
const settingStore = useSettingStore()
const { switchThemeStyles } = useTheme()

const visible = ref(false)

const layoutList = AppConfig.menuLayoutList
const themeList = AppConfig.settingThemeList
const mainColors = AppConfig.systemMainColor

const onThemeChange = (theme: SystemThemeEnum) => {
  switchThemeStyles(theme)
}

onMounted(() => {
  mittBus.on('open-settings', () => {
    visible.value = true
  })
})

onBeforeUnmount(() => {
  mittBus.off('open-settings')
})
</script>
