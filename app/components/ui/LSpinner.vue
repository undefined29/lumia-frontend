<script setup lang="ts">
withDefaults(defineProps<{ size?: number; color?: string }>(), {
  size: 16,
  color: 'var(--color-accent)',
})
</script>

<template>
  <span
    class="spinner"
    role="status"
    :style="{ width: `${size}px`, height: `${size}px`, borderTopColor: color }"
  />
</template>

<style scoped>
.spinner {
  display: inline-block;
  border: 2px solid var(--color-surface3);
  border-radius: 50%;
  animation: lumia-spin 0.9s linear infinite;
}
</style>
