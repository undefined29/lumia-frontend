<script setup lang="ts">
import { useId } from 'vue'

withDefaults(defineProps<{ size?: number; glow?: boolean }>(), { size: 28, glow: true })
const uid = useId()
</script>

<template>
  <svg :width="size" :height="size" viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <defs>
      <linearGradient :id="`lumia-g-${uid}`" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#c8ff3e" />
        <stop offset="1" stop-color="#5eead4" />
      </linearGradient>
      <filter v-if="glow" :id="`lumia-glow-${uid}`" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="1.5" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <g :filter="glow ? `url(#lumia-glow-${uid})` : undefined">
      <path
        d="M7 4v20a4 4 0 0 0 4 4h14"
        :stroke="`url(#lumia-g-${uid})`"
        stroke-width="3.2"
        stroke-linecap="round"
        fill="none"
      />
      <circle cx="25" cy="28" r="2.4" fill="#c8ff3e" />
    </g>
  </svg>
</template>
