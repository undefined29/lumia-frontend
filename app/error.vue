<script setup lang="ts">
import type { NuxtError } from '#app'
import { computed } from 'vue'

const props = defineProps<{ error: NuxtError }>()
const { t } = useI18n()
const localePath = useLocalePath()

const is404 = computed(() => props.error.statusCode === 404)
const title = computed(() => (is404.value ? t('error.404Title') : t('error.500Title')))
const message = computed(() => (is404.value ? t('error.404Message') : t('error.500Message')))

function goHome(): void {
  clearError({ redirect: localePath('/') })
}
</script>

<template>
  <main class="error">
    <LAurora :hue="is404 ? 200 : 350" :intensity="0.7" />
    <div class="error__content">
      <LLogo :size="40" />
      <p class="error__code mono">{{ error.statusCode }}</p>
      <h1 class="error__title">{{ title }}</h1>
      <p class="error__message">{{ message }}</p>
      <LButton variant="primary" icon="arrowR" @click="goHome">{{ t('error.backHome') }}</LButton>
    </div>
  </main>
</template>

<style scoped>
.error {
  position: relative;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.error__content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  text-align: center;
  padding: var(--space-8);
}
.error__code {
  font-size: 64px;
  font-weight: 600;
  color: var(--color-accent-text);
  letter-spacing: -2px;
}
.error__title {
  font-size: 24px;
  font-weight: 600;
}
.error__message {
  font-size: 14px;
  color: var(--color-muted);
  max-width: 360px;
}
</style>
