<script setup lang="ts">
import type { ResourceStatus } from '~/composables/useAsyncResource'

defineProps<{
  status: ResourceStatus
  error?: Error | null
}>()
defineEmits<{ retry: [] }>()
const { t } = useI18n()
</script>

<template>
  <div class="async-state">
    <slot v-if="status === 'success'" />

    <slot v-else-if="status === 'loading' || status === 'idle'" name="loading">
      <div class="async-state__center" role="status" aria-live="polite">
        <LSpinner :size="22" />
        <span class="async-state__text">{{ t('state.loadingTitle') }}</span>
      </div>
    </slot>

    <slot v-else-if="status === 'error'" name="error" :error="error">
      <div class="async-state__center" role="alert">
        <span class="async-state__title">{{ t('state.errorTitle') }}</span>
        <LButton variant="secondary" size="sm" icon="arrowR" @click="$emit('retry')">
          {{ t('state.errorRetry') }}
        </LButton>
      </div>
    </slot>

    <slot v-else-if="status === 'empty'" name="empty">
      <div class="async-state__center">
        <span class="async-state__text">{{ t('state.empty') }}</span>
      </div>
    </slot>
  </div>
</template>

<style scoped>
.async-state__center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  padding: var(--space-12) var(--space-4);
  text-align: center;
  min-height: 200px;
}
.async-state__title {
  font-size: 15px;
  font-weight: 600;
}
.async-state__text {
  font-size: 13.5px;
  color: var(--color-muted);
}
</style>
