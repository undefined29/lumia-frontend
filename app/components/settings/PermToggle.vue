<script setup lang="ts">
import type { PermFlag } from './perms'

const props = defineProps<{
  flag: PermFlag
  on: boolean
  locked?: boolean
}>()

const emit = defineEmits<{ change: [boolean] }>()
const { t } = useI18n()

function onToggle(next: boolean): void {
  if (!props.locked) emit('change', next)
}
</script>

<template>
  <div class="perm-toggle" :class="{ 'perm-toggle--locked': locked }">
    <LIcon
      :name="flag.icon"
      :size="14"
      class="perm-toggle__icon"
      :class="{ 'perm-toggle__icon--on': on }"
    />
    <div class="perm-toggle__text">
      <div class="perm-toggle__label" :class="{ 'perm-toggle__label--on': on }">
        {{ t(`settings.perm.${flag.key}.label`) }}
      </div>
      <div class="perm-toggle__desc mono">{{ t(`settings.perm.${flag.key}.desc`) }}</div>
    </div>
    <LToggle
      :model-value="on"
      :disabled="locked"
      :label="t(`settings.perm.${flag.key}.label`)"
      @update:model-value="onToggle"
    />
  </div>
</template>

<style scoped>
.perm-toggle {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 8px 10px;
  border-radius: var(--radius-s);
  transition: background var(--dur-fast);
}
.perm-toggle:not(.perm-toggle--locked):hover {
  background: var(--color-surface2);
}
.perm-toggle--locked {
  background: var(--color-surface);
  opacity: 0.7;
}
.perm-toggle__icon {
  color: var(--color-muted);
  flex-shrink: 0;
}
.perm-toggle__icon--on {
  color: var(--color-accent-text);
}
.perm-toggle__text {
  flex: 1;
  min-width: 0;
}
.perm-toggle__label {
  font-size: 13px;
  color: var(--color-text2);
}
.perm-toggle__label--on {
  color: var(--color-text);
}
.perm-toggle__desc {
  font-size: 10.5px;
  color: var(--color-muted);
  letter-spacing: 0.4px;
}
</style>
