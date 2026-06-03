<script setup lang="ts">
import { computed, useSlots, Comment, Text } from 'vue'

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const props = withDefaults(
  defineProps<{
    variant?: Variant
    size?: Size
    icon?: string
    iconRight?: string
    loading?: boolean
    disabled?: boolean
    type?: 'button' | 'submit'
    block?: boolean
    ariaLabel?: string
  }>(),
  {
    variant: 'primary',
    size: 'md',
    type: 'button',
    loading: false,
    disabled: false,
    block: false,
    icon: undefined,
    iconRight: undefined,
    ariaLabel: undefined,
  },
)

const slots = useSlots()

const hasLabel = computed(() => {
  const nodes = slots.default?.()
  if (!nodes) return false
  return nodes.some((n) => {
    if (n.type === Comment) return false
    if (n.type === Text) return typeof n.children === 'string' && n.children.trim().length > 0
    return true
  })
})

const isIconOnly = computed(() => !hasLabel.value && !!(props.icon || props.iconRight))

const iconSize = computed(() => {
  if (isIconOnly.value) return props.size === 'sm' ? 17 : props.size === 'lg' ? 24 : 20
  return props.size === 'sm' ? 16 : props.size === 'lg' ? 20 : 18
})
</script>

<template>
  <button
    :type="type"
    :class="[
      'btn',
      `btn--${variant}`,
      `btn--${size}`,
      { 'btn--block': block, 'btn--loading': loading, 'btn--icon-only': isIconOnly },
    ]"
    :disabled="disabled || loading"
    :aria-label="ariaLabel"
    :aria-busy="loading"
  >
    <LSpinner
      v-if="loading"
      :size="iconSize"
      :color="variant === 'primary' ? 'var(--color-accent-contrast)' : 'var(--color-accent)'"
    />
    <LIcon v-else-if="icon" :name="icon" :size="iconSize" />
    <span v-if="hasLabel" class="btn__label"><slot /></span>
    <LIcon v-if="iconRight && !loading" :name="iconRight" :size="iconSize" />
  </button>
</template>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  border: 1px solid transparent;
  border-radius: var(--radius-m);
  white-space: nowrap;
  transition:
    transform 0.08s var(--ease-out),
    background var(--dur-fast),
    box-shadow var(--dur-fast),
    border-color var(--dur-fast);
}
.btn:active:not(:disabled) {
  transform: scale(0.97);
}
.btn > :not(.btn__label) {
  flex-shrink: 0;
}
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn--block {
  width: 100%;
}
.btn--sm {
  height: 30px;
  padding: 0 12px;
  font-size: 13px;
  gap: var(--space-1);
}
.btn--md {
  height: 38px;
  padding: 0 16px;
  font-size: 14px;
}
.btn--lg {
  height: 48px;
  padding: 0 22px;
  font-size: 16px;
  gap: var(--space-2);
}

.btn--icon-only {
  padding: 0;
  aspect-ratio: 1;
}
.btn--icon-only.btn--sm {
  width: 30px;
}
.btn--icon-only.btn--md {
  width: 38px;
}
.btn--icon-only.btn--lg {
  width: 48px;
}

.btn--primary {
  background: var(--color-accent);
  color: var(--color-accent-contrast);
  border-color: var(--color-accent);
  font-weight: 600;
}
.btn--primary:hover:not(:disabled) {
  box-shadow: var(--glow-accent);
}
.btn--secondary {
  background: var(--color-surface2);
  color: var(--color-text);
  border-color: var(--color-border);
  font-weight: 500;
}
.btn--secondary:hover:not(:disabled) {
  background: var(--color-surface3);
}
.btn--ghost {
  background: transparent;
  color: var(--color-text2);
  font-weight: 500;
}
.btn--ghost:hover:not(:disabled) {
  background: var(--color-surface2);
  color: var(--color-text);
}
.btn--outline {
  background: transparent;
  color: var(--color-text);
  border-color: var(--color-border-hi);
  font-weight: 500;
}
.btn--outline:hover:not(:disabled) {
  background: var(--color-surface2);
}
.btn--danger {
  background: color-mix(in srgb, var(--color-err) 12%, transparent);
  color: var(--color-err);
  border-color: color-mix(in srgb, var(--color-err) 30%, transparent);
  font-weight: 500;
}
.btn--danger:hover:not(:disabled) {
  background: color-mix(in srgb, var(--color-err) 20%, transparent);
}
</style>
