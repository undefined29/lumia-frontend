<script setup lang="ts">
import { useAppLocale } from '~/composables/useAppLocale'
import type { LocaleCode } from '~/stores/locale'

const { current, available, change } = useAppLocale()
const { t } = useI18n()

async function select(code: LocaleCode, close: () => void): Promise<void> {
  await change(code)
  close()
}
</script>

<template>
  <LDropdown align="right">
    <template #trigger="{ toggle }">
      <button
        type="button"
        class="locale-trigger"
        :aria-label="t('locale.label')"
        :title="t('locale.label')"
        @click="toggle"
      >
        <LIcon name="globe" :size="16" />
        <span class="locale-trigger__code mono">{{ current.toUpperCase() }}</span>
      </button>
    </template>
    <template #menu="{ close }">
      <button
        v-for="loc in available"
        :key="loc.code"
        type="button"
        class="locale-item"
        :class="{ 'locale-item--active': loc.code === current }"
        @click="select(loc.code, close)"
      >
        <span>{{ loc.label }}</span>
        <LIcon v-if="loc.code === current" name="check" :size="14" />
      </button>
    </template>
  </LDropdown>
</template>

<style scoped>
.locale-trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 10px;
  border-radius: var(--radius-m);
  border: 1px solid var(--color-border);
  background: var(--color-surface2);
  color: var(--color-text2);
  font-size: 12px;
  transition: background var(--dur-fast);
}
.locale-trigger:hover {
  background: var(--color-surface3);
  color: var(--color-text);
}
.locale-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: var(--space-3);
  padding: 8px 10px;
  border-radius: var(--radius-s);
  font-size: 13px;
  color: var(--color-text2);
  transition: background var(--dur-fast);
}
.locale-item:hover {
  background: var(--color-surface2);
  color: var(--color-text);
}
.locale-item--active {
  color: var(--color-accent-text);
}
</style>
