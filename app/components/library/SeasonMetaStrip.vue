<script setup lang="ts">
import { computed } from 'vue'
import type { SeasonView } from '~/types/view'

const props = withDefaults(
  defineProps<{
    season: SeasonView
    imagesCount: number
    editable?: boolean
  }>(),
  { editable: false },
)
const emit = defineEmits<{ edit: [] }>()

const { t } = useI18n()

const statusText = computed(() =>
  props.season.isOngoing ? t('library.statusOngoing') : t('library.statusFinished'),
)
const imagesPerEp = computed(() => t('library.imagesPerEp', { count: props.season.episodesCount }))
</script>

<template>
  <div class="strip">
    <div class="strip__item">
      <div class="strip__label mono">{{ t('library.season') }}</div>
      <div class="strip__value">{{ season.title }}</div>
    </div>
    <span class="strip__divider" />
    <div class="strip__item">
      <div class="strip__label mono">{{ t('library.episodes') }}</div>
      <div class="strip__value">{{ season.episodesCount }}</div>
    </div>
    <span class="strip__divider" />
    <div class="strip__item">
      <div class="strip__label mono">{{ t('library.status') }}</div>
      <div class="strip__status" :class="{ 'strip__status--ongoing': season.isOngoing }">
        <span v-if="season.isOngoing" class="strip__dot" aria-hidden="true" />
        {{ statusText }}
      </div>
    </div>
    <span class="strip__divider" />
    <div class="strip__item">
      <div class="strip__label mono">{{ t('library.images') }}</div>
      <div class="strip__value">
        {{ imagesCount }}
        <span class="strip__hint">/ {{ imagesPerEp }}</span>
      </div>
    </div>
    <span class="strip__spacer" />
    <LButton v-if="editable" variant="secondary" size="sm" icon="edit" @click="emit('edit')">
      {{ t('library.editSeason') }}
    </LButton>
  </div>
</template>

<style scoped>
.strip {
  display: flex;
  align-items: center;
  gap: var(--space-6);
  padding: 14px 18px;
  margin-bottom: var(--space-5);
  border-radius: var(--radius-m);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  flex-wrap: wrap;
}
.strip__label {
  font-size: 10px;
  letter-spacing: 1px;
  color: var(--color-muted);
  margin-bottom: 2px;
}
.strip__value {
  font-size: 16px;
  font-weight: 600;
}
.strip__hint {
  color: var(--color-muted);
  font-size: 12px;
  font-weight: 500;
}
.strip__status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-top: 2px;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text2);
}
.strip__status--ongoing {
  color: var(--color-ok);
}
.strip__dot {
  width: 6px;
  height: 6px;
  border-radius: var(--radius-pill);
  background: var(--color-ok);
}
.strip__divider {
  width: 1px;
  height: 28px;
  background: var(--color-border);
}
.strip__spacer {
  flex: 1;
}
</style>
