<script setup lang="ts">
import { useI18n } from 'vue-i18n'
defineOptions({ name: 'DashboardEcommerce' })
const { t } = useI18n()
</script>
<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold text-[var(--color-text-1)]">
      {{ t('menus.dashboard.ecommerce') }}
    </h1>
    <p class="mt-2 text-[var(--color-text-3)]">{{ t('menus.dashboard.ecommerce') }} - 页面开发中</p>
  </div>
</template>
