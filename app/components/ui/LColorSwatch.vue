<script setup lang="ts">
defineProps<{ color: string; active?: boolean; label?: string }>()
defineEmits<{ select: [] }>()
</script>

<template>
  <button
    type="button"
    class="swatch"
    :class="{ 'swatch--active': active }"
    :style="{ borderColor: active ? color : 'transparent' }"
    :title="label"
    :aria-label="label"
    :aria-pressed="active"
    @click="$emit('select')"
  >
    <span
      class="swatch__fill"
      :style="{
        background: color,
        boxShadow: `0 0 6px color-mix(in srgb, ${color} 33%, transparent)`,
      }"
    />
    <span v-if="active" class="swatch__check"><LIcon name="check" :size="14" :stroke="3" /></span>
  </button>
</template>

<style scoped>
.swatch {
  position: relative;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-s);
  border: 1.5px solid transparent;
  padding: 3px;
}
.swatch__fill {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 4px;
}
.swatch__check {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-accent-contrast);
  pointer-events: none;
}
</style>
