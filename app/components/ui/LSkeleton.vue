<script setup lang="ts">
withDefaults(
  defineProps<{ width?: string; height?: string; radius?: string; circle?: boolean }>(),
  { width: '100%', height: '16px', radius: 'var(--radius-s)' },
)
</script>

<template>
  <span
    class="shimmer skeleton"
    :style="{ width, height, borderRadius: circle ? '50%' : radius }"
    aria-hidden="true"
  />
</template>

<style scoped>
.skeleton {
  display: block;
}
</style>
