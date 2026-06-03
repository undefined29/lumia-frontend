<script setup lang="ts">
import { computed } from 'vue'
import type { AnimeView } from '~/types/view'

const props = defineProps<{ anime: AnimeView }>()
const emit = defineEmits<{ select: [id: string] }>()

const { t } = useI18n()

const metaParts = computed(() => {
  const parts: string[] = []
  if (props.anime.year != null) parts.push(String(props.anime.year))
  parts.push(`S${props.anime.seasonsCount}`)
  parts.push(t('library.epsShort', { n: props.anime.episodesCount }))
  return parts
})

const ratingText = computed(() =>
  props.anime.rating != null ? props.anime.rating.toFixed(1) : '—',
)
</script>

<template>
  <button type="button" class="poster" @click="emit('select', anime.id)">
    <div class="poster__media">
      <LImage variant="poster" :src="anime.coverUrl" :hue="anime.hue" :alt="anime.title" />
      <span class="poster__overlay" aria-hidden="true" />

      <span v-if="anime.isOngoing" class="poster__badge">
        <span class="poster__dot" aria-hidden="true" />
        {{ t('library.ongoing') }}
      </span>

      <div class="poster__info">
        <div class="poster__title">{{ anime.title }}</div>
        <div class="poster__meta mono">
          <template v-for="(part, i) in metaParts" :key="i">
            <span v-if="i > 0" class="poster__sep">·</span>
            <span>{{ part }}</span>
          </template>
          <span class="poster__spacer" />
          <span class="poster__rating">
            <LIcon name="star" :size="10" :stroke="0" class="poster__star" />
            {{ ratingText }}
          </span>
        </div>
      </div>
    </div>
  </button>
</template>

<style scoped>
.poster {
  display: block;
  width: 100%;
  position: relative;
  border-radius: var(--radius-m);
  overflow: hidden;
  text-align: left;
  transition: transform var(--dur-fast) var(--ease-out);
}
.poster:hover {
  transform: translateY(-2px);
}
.poster__media {
  position: relative;
  width: 100%;
  aspect-ratio: 2 / 3;
  overflow: hidden;
  border-radius: inherit;
}
.poster__overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.88) 0%,
    rgba(0, 0, 0, 0.2) 50%,
    rgba(0, 0, 0, 0) 100%
  );
}
.poster__badge {
  position: absolute;
  top: 8px;
  left: 8px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 7px;
  border-radius: var(--radius-pill);
  background: rgba(8, 9, 12, 0.7);
  backdrop-filter: blur(6px);
  border: 1px solid color-mix(in srgb, var(--color-ok) 25%, transparent);
  font-family: var(--font-mono);
  font-size: 9.5px;
  letter-spacing: 0.8px;
  color: var(--color-ok);
}
.poster__dot {
  width: 5px;
  height: 5px;
  border-radius: var(--radius-pill);
  background: var(--color-ok);
  animation: lumia-pulse 1.6s ease-in-out infinite;
}
.poster__info {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 14px 12px 11px;
}
.poster__title {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.2px;
  line-height: 1.2;
  margin-bottom: 4px;
  color: #fff;
}
.poster__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 10.5px;
  letter-spacing: 0.5px;
  color: rgba(255, 255, 255, 0.72);
}
.poster__sep {
  color: rgba(255, 255, 255, 0.4);
}
.poster__spacer {
  flex: 1;
}
.poster__rating {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: var(--color-warn);
}
.poster__star {
  fill: var(--color-warn);
}
</style>
