<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { EpisodeView } from '~/types/view'
import { episodeLabel } from '~/utils/format'
import { hueGradient } from '~/utils/hue'

const props = defineProps<{ episode: EpisodeView }>()
const emit = defineEmits<{ select: [episode: EpisodeView] }>()

const { t } = useI18n()

const numberLabel = computed(() => episodeLabel(props.episode.number))
const numberBackground = computed(() =>
  props.episode.isEmpty ? 'var(--color-surface)' : hueGradient(props.episode.hue, 'card'),
)

const thumbFailed = ref(false)
watch(
  () => props.episode.thumbUrl,
  () => {
    thumbFailed.value = false
  },
)
const showThumb = computed(() => !!props.episode.thumbUrl && !thumbFailed.value)
const metaText = computed(() =>
  props.episode.isEmpty
    ? t('library.emptyDropImages')
    : t('library.imagesCount', { n: props.episode.imagesCount }, props.episode.imagesCount),
)

function onClick(): void {
  if (props.episode.isEmpty) return
  emit('select', props.episode)
}
</script>

<template>
  <button
    type="button"
    class="ep"
    :class="{ 'ep--empty': episode.isEmpty }"
    :disabled="episode.isEmpty"
    @click="onClick"
  >
    <span
      class="ep__num mono"
      :class="{ 'ep__num--image': showThumb }"
      :style="showThumb ? undefined : { background: numberBackground }"
    >
      <img
        v-if="showThumb"
        :src="episode.thumbUrl!"
        alt=""
        class="ep__thumb"
        loading="lazy"
        @error="thumbFailed = true"
      />
      <span class="ep__num-text">{{ numberLabel }}</span>
    </span>
    <span class="ep__body">
      <span class="ep__title">{{ episode.title }}</span>
      <span class="ep__meta mono">{{ metaText }}</span>
    </span>
    <LIcon v-if="!episode.isEmpty" name="chevR" :size="14" class="ep__chev" />
  </button>
</template>

<style scoped>
.ep {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 14px;
  text-align: left;
  border-radius: var(--radius-m);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  transition:
    background var(--dur-fast),
    border-color var(--dur-fast);
}
.ep:not(.ep--empty):hover {
  background: var(--color-surface2);
  border-color: var(--color-border-hi);
}
.ep--empty {
  background: transparent;
  border-style: dashed;
  border-color: var(--color-border-hi);
  cursor: default;
}
.ep__num {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  border-radius: var(--radius-s);
  overflow: hidden;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
}
.ep--empty .ep__num {
  color: var(--color-muted);
}
.ep__thumb {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.ep__num--image::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.65), rgba(0, 0, 0, 0.2));
}
.ep__num-text {
  position: relative;
  z-index: 1;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}
.ep__body {
  flex: 1;
  min-width: 0;
}
.ep__title {
  display: block;
  font-size: 13.5px;
  font-weight: 500;
  margin-bottom: 2px;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ep--empty .ep__title {
  color: var(--color-muted);
}
.ep__meta {
  display: block;
  font-size: 10.5px;
  letter-spacing: 0.5px;
  color: var(--color-muted);
}
.ep--empty .ep__meta {
  color: var(--color-mute2);
}
.ep__chev {
  color: var(--color-muted);
  flex-shrink: 0;
}
</style>
