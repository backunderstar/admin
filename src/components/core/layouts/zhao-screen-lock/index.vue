<template>
  <Teleport to="body">
    <div
      v-if="userStore.isLock"
      class="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      :style="{ background: 'var(--color-bg-1)' }"
    >
      <div class="text-4xl font-light text-[var(--color-text-1)] mb-2">
        {{ time }}
      </div>
      <div class="text-sm text-[var(--color-text-3)] mb-8">
        {{ date }}
      </div>

      <div
        class="w-16 h-16 rounded-full bg-[var(--theme-color,#5d87ff)] flex items-center justify-center text-white text-2xl font-medium mb-6"
      >
        {{ avatarText }}
      </div>
      <div class="text-base text-[var(--color-text-1)] mb-4">
        {{ userStore.info.userName || 'User' }}
      </div>

      <a-input-password
        v-model="pwd"
        :placeholder="t('lockScreen.unlock.inputPlaceholder')"
        size="large"
        style="width: 240px"
        @keyup.enter="unlock"
      />
      <div v-if="pwdError" class="text-xs text-[rgb(var(--danger-6))] mt-2">
        {{ t('lockScreen.pwdError') }}
      </div>

      <div class="mt-4 flex gap-4">
        <a-button @click="unlock">
          {{ t('lockScreen.unlock.btnText') }}
        </a-button>
        <a-button @click="backToLogin">
          {{ t('lockScreen.unlock.backBtnText') }}
        </a-button>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '@/store/modules/user'

defineOptions({ name: 'ZhaoScreenLock' })

const router = useRouter()
const { t } = useI18n()
const userStore = useUserStore()

const pwd = ref('')
const pwdError = ref(false)
const time = ref('')
const date = ref('')

const avatarText = computed(() => {
  return (userStore.info.userName || 'U').charAt(0).toUpperCase()
})

let timer: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  const update = () => {
    const now = new Date()
    time.value = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    date.value = now.toLocaleDateString([], { month: 'long', day: 'numeric', weekday: 'long' })
  }
  update()
  timer = setInterval(update, 10000)
})

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})

const unlock = () => {
  if (pwd.value === userStore.lockPassword) {
    userStore.setLockStatus(false)
    pwd.value = ''
    pwdError.value = false
  } else {
    pwdError.value = true
  }
}

const backToLogin = () => {
  userStore.setLockStatus(false)
  userStore.logOut()
}
</script>
