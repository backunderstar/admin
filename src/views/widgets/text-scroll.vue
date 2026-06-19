<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>
<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold text-[var(--color-text-1)]">text scroll</h1>
    <p class="mt-2 text-[var(--color-text-3)]">"$\{t('menus.widgets.text-scroll')}"</p>
    <p class="mt-1 text-[var(--color-text-3)]">页面开发中</p>
  </div>
</template>
