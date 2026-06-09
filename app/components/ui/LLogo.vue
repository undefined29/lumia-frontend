<script setup lang="ts">
withDefaults(defineProps<{ size?: number; glow?: boolean }>(), { size: 28, glow: true })
</script>

<template>
  <img
    src="/lumia-logo.png"
    alt=""
    aria-hidden="true"
    :width="size"
    :height="size"
    class="lumia-logo"
    :class="{ 'lumia-logo--glow': glow }"
    decoding="async"
  />
</template>

<style scoped>
.lumia-logo {
  display: inline-block;
  object-fit: cover;
  border-radius: var(--radius-m, 8px);
  flex-shrink: 0;
}
.lumia-logo--glow {
  box-shadow: 0 0 12px color-mix(in srgb, var(--color-accent, #c8ff3e) 45%, transparent);
}
</style>
