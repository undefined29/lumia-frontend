<script setup lang="ts">
defineProps<{ label?: string; hint?: string }>()
</script>

<template>
  <div class="field">
    <span v-if="label" class="field__label mono">{{ label }}</span>
    <slot />
    <span v-if="hint" class="field__hint">{{ hint }}</span>
  </div>
</template>

<style scoped>
.field__label {
  display: block;
  font-size: 11px;
  color: var(--color-muted);
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin-bottom: var(--space-2);
}
.field__hint {
  display: block;
  font-size: 11.5px;
  color: var(--color-muted);
  margin-top: 6px;
}
</style>
