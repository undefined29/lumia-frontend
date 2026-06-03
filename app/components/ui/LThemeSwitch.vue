<script setup lang="ts">
import { computed } from 'vue'
import { useTheme } from '~/composables/useTheme'

const { theme, cycle } = useTheme()
const { t } = useI18n()

const icon = computed(() => (theme.value === 'light' ? 'sun' : 'moon'))
const label = computed(() => `${t('theme.label')}: ${t(`theme.${theme.value}`)}`)
</script>

<template>
  <button type="button" class="theme-switch" :aria-label="label" :title="label" @click="cycle">
    <LIcon :name="icon" :size="16" />
    <span class="theme-switch__text mono">{{ t(`theme.${theme}`) }}</span>
  </button>
</template>

<style scoped>
.theme-switch {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  height: 32px;
  padding: 0 10px;
  border-radius: var(--radius-m);
  border: 1px solid var(--color-border);
  background: var(--color-surface2);
  color: var(--color-text2);
  font-size: 12px;
  transition: background var(--dur-fast);
}
.theme-switch:hover {
  background: var(--color-surface3);
  color: var(--color-text);
}
.theme-switch__text {
  text-transform: uppercase;
  letter-spacing: 0.6px;
}
@media (max-width: 768px) {
  .theme-switch__text {
    display: none;
  }
}
</style>
