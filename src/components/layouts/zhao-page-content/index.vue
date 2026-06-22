<template>
  <div class="page-content flex flex-col h-full" :style="containerStyle">
    <!-- 工作标签栏 -->
    <ZhaoWorkTab v-if="settingStore.showWorkTab" />

    <!-- 页面内容 -->
    <div class="flex-1 relative" :style="{ minHeight: contentMinHeight }">
      <RouterView v-if="!isReloading" v-slot="{ Component: Comp }">
        <Transition :name="transitionName" mode="out-in">
          <KeepAlive :max="10" :exclude="worktabStore.keepAliveExclude">
            <component :is="Comp" v-if="Comp && (route as any).meta?.keepAlive" :key="route.path" />
          </KeepAlive>
        </Transition>
        <!-- 非缓存页面 -->
        <Transition :name="transitionName" mode="out-in">
          <component :is="Comp" v-if="Comp && !(route as any).meta?.keepAlive" :key="route.path" />
        </Transition>
      </RouterView>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useSettingStore } from '@/store/modules/setting'
import { useWorktabStore } from '@/store/modules/worktab'
import { ContainerWidthEnum } from '@/enums/appEnum'
import ZhaoWorkTab from '@/components/layouts/zhao-work-tab/index.vue'

defineOptions({ name: 'ZhaoPageContent' })

const route = useRoute()
const settingStore = useSettingStore()
const worktabStore = useWorktabStore()

// ── 刷新控制 ──
const isReloading = ref(false)

watch(
  () => settingStore.refresh,
  () => {
    isReloading.value = true
    setTimeout(() => {
      isReloading.value = false
    }, 50)
  },
)

// ── 页面过渡动画 ──
const transitionName = computed(() => {
  const t = settingStore.pageTransition
  return !t || t === 'none' ? '' : t
})

// ── 容器宽度 ──
const containerStyle = computed(() => {
  if (settingStore.containerWidth === ContainerWidthEnum.BOXED) {
    return {
      maxWidth: '1200px',
      margin: '0 auto',
      width: '100%',
    }
  }
  return {}
})

// ── 内容区高度（CSS 变量由 useAutoLayoutHeight 设置） ──
const contentMinHeight = computed(() => {
  return 'var(--art-full-height, auto)'
})
</script>

<style scoped>
/* 页面过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-left-enter-active,
.slide-left-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-left-enter-from {
  opacity: 0;
  transform: translateX(20px);
}
.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.slide-bottom-enter-active,
.slide-bottom-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-bottom-enter-from {
  opacity: 0;
  transform: translateY(20px);
}
.slide-bottom-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

.slide-top-enter-active,
.slide-top-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-top-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}
.slide-top-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
