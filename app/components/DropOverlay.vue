<script setup lang="ts">
defineProps<{ active: boolean }>()
const { t } = useI18n()
</script>

<template>
  <Transition name="fade">
    <div v-if="active" class="drop" aria-hidden="true">
      <div class="drop__frame">
        <div class="drop__card">
          <LIcon name="upload" :size="32" :stroke="1.5" />
          <p class="drop__title">{{ t('upload.dropTitle') }}</p>
          <p class="drop__hint mono">{{ t('upload.dropHint') }}</p>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.drop {
  position: fixed;
  inset: 0;
  z-index: var(--z-overlay);
  pointer-events: none;
}
.drop__frame {
  position: absolute;
  inset: 12px;
  border: 2px dashed var(--color-accent);
  border-radius: var(--radius-l);
  background: color-mix(in srgb, var(--color-accent) 4%, transparent);
  box-shadow: inset 0 0 60px var(--color-accent-dim);
}
.drop__card {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: 22px 32px;
  border-radius: var(--radius-l);
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--color-accent);
  box-shadow: 0 0 50px var(--color-accent-dim);
  color: var(--color-accent-text);
  text-align: center;
}
.drop__title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
}
.drop__hint {
  font-size: 11px;
  color: var(--color-muted);
  letter-spacing: 0.8px;
}
</style>
