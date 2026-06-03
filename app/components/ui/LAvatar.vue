<script setup lang="ts">
import { computed } from 'vue'
import { hueGradient } from '~/utils/hue'

const props = withDefaults(
  defineProps<{ name: string; src?: string | null; hue?: number; size?: number }>(),
  { size: 28, hue: 200, src: undefined },
)
const initial = computed(() => props.name?.charAt(0).toUpperCase() || '?')
const fontSize = computed(() => Math.round(props.size * 0.45))
</script>

<template>
  <span
    class="avatar"
    :style="{
      width: `${size}px`,
      height: `${size}px`,
      background: hueGradient(hue, 'avatar'),
      fontSize: `${fontSize}px`,
    }"
  >
    <img v-if="src" :src="src" :alt="name" class="avatar__img" />
    <span v-else aria-hidden="true">{{ initial }}</span>
  </span>
</template>

<style scoped>
.avatar {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: #fff;
  font-weight: 700;
  flex-shrink: 0;
  overflow: hidden;
}
.avatar__img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
