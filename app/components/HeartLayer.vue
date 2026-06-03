<script setup lang="ts">
import { useHearts } from '~/composables/useHearts'

const { hearts } = useHearts()
</script>

<template>
  <Teleport to="body">
    <div class="hearts" aria-hidden="true">
      <span
        v-for="h in hearts"
        :key="h.id"
        class="hearts__item"
        :style="{
          left: `${h.x}px`,
          top: `${h.y}px`,
          '--dx': `${h.dx}px`,
          '--rise': `${-h.rise}px`,
          '--rot': `${h.rotate}deg`,
          '--scale': h.scale,
          '--hue': h.hue,
          animationDelay: `${h.delay}ms`,
        }"
      >
        <svg viewBox="0 0 24 24" width="22" height="22">
          <path
            d="M12 21s-7.4-4.8-9.9-9C.5 8.7 1.8 5 5.2 5c2 0 3.2 1.2 3.9 2.4C9.9 6.2 11 5 13 5c3.4 0 4.7 3.7 3.2 7-2.6 4.2-9.9 9-9.9 9Z"
          />
        </svg>
      </span>
    </div>
  </Teleport>
</template>

<style scoped>
.hearts {
  position: fixed;
  inset: 0;
  z-index: var(--z-toast);
  pointer-events: none;
  overflow: hidden;
}
.hearts__item {
  position: absolute;
  transform: translate(-50%, -50%);
  color: oklch(0.72 0.2 var(--hue, 350));
  animation: heart-fly 1.25s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  will-change: transform, opacity;
}
.hearts__item svg {
  display: block;
  fill: currentColor;
  filter: drop-shadow(0 2px 8px color-mix(in srgb, currentColor 45%, transparent));
}
@keyframes heart-fly {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.4) rotate(0deg);
  }
  15% {
    opacity: 1;
  }
  35% {
    transform: translate(calc(-50% + var(--dx) * 0.4), calc(-50% + var(--rise) * 0.4))
      scale(var(--scale)) rotate(calc(var(--rot) * 0.5));
  }
  100% {
    opacity: 0;
    transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--rise)))
      scale(calc(var(--scale) * 0.8)) rotate(var(--rot));
  }
}
</style>
