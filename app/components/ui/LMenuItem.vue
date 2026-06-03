<script setup lang="ts">
defineProps<{ icon?: string; disabled?: boolean; danger?: boolean }>()
const emit = defineEmits<{ select: [] }>()
</script>

<template>
  <button
    type="button"
    class="lmenu-item"
    :class="{ 'lmenu-item--danger': danger }"
    :disabled="disabled"
    role="menuitem"
    @click="emit('select')"
  >
    <LIcon v-if="icon" :name="icon" :size="15" class="lmenu-item__icon" />
    <span class="lmenu-item__label"><slot /></span>
  </button>
</template>

<style scoped>
.lmenu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 10px;
  border-radius: var(--radius-s);
  font-size: 13px;
  color: var(--color-text2);
  text-align: left;
  transition:
    background var(--dur-fast),
    color var(--dur-fast);
}
.lmenu-item:hover:not(:disabled) {
  background: var(--color-surface2);
  color: var(--color-text);
}
.lmenu-item:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.lmenu-item__icon {
  flex-shrink: 0;
  color: var(--color-muted);
}
.lmenu-item:hover:not(:disabled) .lmenu-item__icon {
  color: var(--color-text2);
}
.lmenu-item--danger {
  color: var(--color-err);
}
.lmenu-item--danger .lmenu-item__icon {
  color: var(--color-err);
}
.lmenu-item--danger:hover:not(:disabled) {
  background: color-mix(in srgb, var(--color-err) 12%, transparent);
  color: var(--color-err);
}
.lmenu-item--danger:hover:not(:disabled) .lmenu-item__icon {
  color: var(--color-err);
}
.lmenu-item__label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
