<template>
  <a-dropdown trigger="click" @select="onUserMenuSelect">
    <div
      class="flex items-center gap-2 ml-2 px-2 py-1 rounded-md cursor-pointer hover:bg-(--color-fill-2) transition-colors"
    >
      <div
        class="w-7 h-7 rounded-full bg-(--theme-color,#5d87ff) flex items-center justify-center text-white text-xs font-medium"
      >
        {{ userAvatarText }}
      </div>
      <span class="text-sm text-(--color-text-1) hidden sm:inline">{{ userName }}</span>
      <ZhaoIcon icon="ri:arrow-down-s-line" class="text-sm text-(--color-text-3)" />
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
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '@/store/modules/user'
import { Modal } from '@arco-design/web-vue'
import ZhaoIcon from '@/components/icons/ZhaoIcon.vue'

defineOptions({ name: 'ZhaoUserDropdown' })

const router = useRouter()
const { t } = useI18n()
const userStore = useUserStore()

const userAvatarText = computed(() => {
  return (userStore.info.userName || 'U').charAt(0).toUpperCase()
})
const userName = computed(() => userStore.info.userName || 'User')

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
</script>
