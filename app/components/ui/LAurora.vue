<script setup lang="ts">
import { useId } from 'vue'

const props = withDefaults(defineProps<{ hue?: number; intensity?: number }>(), {
  hue: 130,
  intensity: 1,
})
const uid = useId()
</script>

<template>
  <div class="aurora" aria-hidden="true">
    <div
      class="aurora__fog"
      :style="{
        background: `
          radial-gradient(ellipse 60% 50% at 30% 40%, oklch(0.75 0.22 ${props.hue} / ${0.55 * props.intensity}), transparent 60%),
          radial-gradient(ellipse 50% 40% at 70% 60%, oklch(0.65 0.20 ${props.hue + 30} / ${0.45 * props.intensity}), transparent 65%),
          radial-gradient(ellipse 70% 35% at 50% 90%, oklch(0.55 0.18 ${props.hue - 30} / ${0.35 * props.intensity}), transparent 70%),
          #050608`,
      }"
    />
    <svg class="aurora__stars" width="100%" height="100%">
      <defs>
        <pattern
          :id="`stars-${uid}`"
          x="0"
          y="0"
          width="80"
          height="80"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="12" cy="22" r="0.7" fill="#fff" opacity=".7" />
          <circle cx="55" cy="48" r="0.5" fill="#fff" opacity=".5" />
          <circle cx="38" cy="68" r="0.9" fill="#fff" opacity=".85" />
          <circle cx="72" cy="14" r="0.4" fill="#fff" opacity=".4" />
          <circle cx="20" cy="55" r="0.5" fill="#fff" opacity=".5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" :fill="`url(#stars-${uid})`" />
    </svg>
  </div>
</template>

<style scoped>
.aurora {
  position: absolute;
  inset: 0;
  overflow: hidden;
}
.aurora__fog {
  position: absolute;
  inset: -20%;
  filter: blur(40px);
}
.aurora__stars {
  position: absolute;
  inset: 0;
  opacity: 0.6;
}
</style>
