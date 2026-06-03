<script setup lang="ts">
const props = withDefaults(
  defineProps<{ modelValue: boolean; disabled?: boolean; label?: string }>(),
  { disabled: false, label: undefined },
)
const emit = defineEmits<{ 'update:modelValue': [boolean] }>()

function toggle(): void {
  if (!props.disabled) emit('update:modelValue', !props.modelValue)
}
</script>

<template>
  <button
    type="button"
    role="switch"
    :aria-checked="modelValue"
    :aria-label="label"
    :disabled="disabled"
    class="toggle"
    :class="{ 'toggle--on': modelValue }"
    @click="toggle"
  >
    <span class="toggle__knob" />
  </button>
</template>

<style scoped>
.toggle {
  position: relative;
  width: 32px;
  height: 18px;
  border-radius: 9px;
  background: var(--color-surface3);
  border: 1px solid var(--color-border);
  transition: background var(--dur-base);
  flex-shrink: 0;
}
.toggle--on {
  background: var(--color-accent);
  border-color: var(--color-accent);
}
.toggle:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.toggle__knob {
  position: absolute;
  top: 1px;
  left: 1px;
  width: 14px;
  height: 14px;
  border-radius: 7px;
  background: var(--color-text2);
  transition: transform var(--dur-base) var(--ease-out);
}
.toggle--on .toggle__knob {
  transform: translateX(14px);
  background: var(--color-accent-contrast);
}
</style>
