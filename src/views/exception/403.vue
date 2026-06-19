<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
const { t } = useI18n()
const router = useRouter()
</script>
<template>
  <div class="flex flex-col items-center justify-center min-h-[60vh]">
    <h1 class="text-8xl font-bold text-[var(--color-text-4)]">403</h1>
    <p class="mt-4 text-lg text-[var(--color-text-2)]">{{ t('exceptionPage.403') }}</p>
    <a-button type="primary" class="mt-6" @click="router.push('/')">{{
      t('exceptionPage.gohome')
    }}</a-button>
  </div>
</template>
