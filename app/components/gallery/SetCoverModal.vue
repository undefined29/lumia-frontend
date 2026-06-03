<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { AnimeView } from '~/types/view'

const props = withDefaults(
  defineProps<{
    open: boolean
    currentSeriesId?: string | null
    saving?: boolean
  }>(),
  { currentSeriesId: null, saving: false },
)

const emit = defineEmits<{
  save: [payload: { seriesId: string }]
  close: []
}>()

const { t } = useI18n()
const {
  query: seriesQuery,
  options: seriesOptions,
  base: seriesBase,
  loading,
  searching,
  load: loadSeries,
  reset: resetSeriesSearch,
} = useSeriesSearch()

const seriesId = ref<string | null>(null)
const picked = ref<AnimeView | null>(null)

const seriesLabel = computed(() => picked.value?.title ?? null)
const canSave = computed(() => !props.saving && !!seriesId.value)

watch(
  () => props.open,
  async (open) => {
    if (!open) return
    resetSeriesSearch()
    seriesId.value = props.currentSeriesId
    picked.value = null
    await loadSeries()
    if (props.currentSeriesId) {
      picked.value = seriesBase.value.find((s) => s.id === props.currentSeriesId) ?? null
    }
  },
)

function pickSeries(s: AnimeView): void {
  seriesId.value = s.id
  picked.value = s
  resetSeriesSearch()
}

function onSave(): void {
  if (!canSave.value || !seriesId.value) return
  emit('save', { seriesId: seriesId.value })
}
</script>

<template>
  <LModal :open="open" :max-width="440" labelled-by="set-cover-title" @close="emit('close')">
    <header class="sc__header">
      <div>
        <h2 id="set-cover-title" class="sc__title">{{ t('selection.coverTitle') }}</h2>
        <p class="sc__sub mono">{{ t('selection.coverSub') }}</p>
      </div>
      <button type="button" class="sc__icon" :aria-label="t('common.close')" @click="emit('close')">
        <LIcon name="x" :size="18" :stroke="2" />
      </button>
    </header>

    <div class="sc__body">
      <LField :label="t('selection.stepSeries')">
        <LDropdown>
          <template #trigger="{ open: dOpen, toggle }">
            <button
              type="button"
              class="sc__sel"
              :class="{ 'sc__sel--open': dOpen }"
              @click="toggle"
            >
              <LIcon name="film" :size="14" class="sc__sel-icn" />
              <span class="sc__sel-val" :class="{ 'sc__sel-val--ph': !seriesLabel }">
                {{ seriesLabel || t('selection.pickSeries') }}
              </span>
              <LSpinner v-if="loading" :size="13" />
              <LIcon v-else name="chev" :size="14" class="sc__sel-icn" />
            </button>
          </template>
          <template #menu="{ close }">
            <div class="sc__search">
              <LIcon name="search" :size="14" class="sc__search-icn" />
              <input
                v-model="seriesQuery"
                type="text"
                class="sc__search-input"
                :placeholder="t('gallery.searchAnime')"
                :aria-label="t('gallery.searchAnime')"
              />
              <LSpinner v-if="searching" :size="14" class="sc__search-spin" />
            </div>
            <p v-if="!searching && !seriesOptions.length" class="sc__opt-empty">
              {{ t('gallery.noAnime') }}
            </p>
            <button
              v-for="s in seriesOptions"
              :key="s.id"
              type="button"
              class="sc__opt"
              :class="{ 'sc__opt--active': s.id === seriesId }"
              @click="(pickSeries(s), close())"
            >
              <span class="sc__opt-label">{{ s.title }}</span>
            </button>
          </template>
        </LDropdown>
      </LField>
    </div>

    <footer class="sc__footer">
      <LButton variant="ghost" @click="emit('close')">{{ t('common.cancel') }}</LButton>
      <LButton variant="primary" icon="check" :disabled="!canSave" @click="onSave">
        {{ t('selection.setCover') }}
      </LButton>
    </footer>
  </LModal>
</template>

<style scoped>
.sc__header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 18px 22px;
  border-bottom: 1px solid var(--color-border);
}
.sc__title {
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.2px;
}
.sc__sub {
  font-size: 11px;
  color: var(--color-muted);
  letter-spacing: 0.6px;
  margin-top: 3px;
}
.sc__icon {
  margin-left: auto;
  display: inline-flex;
  padding: 8px;
  border-radius: var(--radius-s);
  color: var(--color-muted);
}
.sc__icon:hover {
  background: var(--color-surface2);
  color: var(--color-text);
}
.sc__body {
  padding: 20px 22px;
}
.sc__sel {
  width: 100%;
  height: 40px;
  padding: 0 10px 0 12px;
  background: var(--color-surface2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-m);
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  text-align: left;
  transition:
    background var(--dur-fast),
    border-color var(--dur-fast);
}
.sc__sel--open {
  background: var(--color-surface3);
  border-color: var(--color-border-hi);
}
.sc__sel-icn {
  color: var(--color-muted);
  flex-shrink: 0;
}
.sc__sel-val {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--color-text);
}
.sc__sel-val--ph {
  color: var(--color-muted);
}
.sc__opt {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 10px;
  padding: 8px 10px;
  border-radius: var(--radius-s);
  text-align: left;
  font-size: 13px;
}
.sc__opt:hover,
.sc__opt--active {
  background: var(--color-surface2);
}
.sc__opt-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sc__search {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  margin-bottom: 4px;
  border-radius: var(--radius-s);
  background: var(--color-surface2);
  border: 1px solid var(--color-border);
}
.sc__search-icn {
  color: var(--color-muted);
  flex-shrink: 0;
}
.sc__search-input {
  flex: 1;
  min-width: 0;
  background: none;
  border: none;
  outline: none;
  color: var(--color-text);
  font-size: 13px;
}
.sc__search-input::placeholder {
  color: var(--color-muted);
}
.sc__search-spin {
  color: var(--color-muted);
  flex-shrink: 0;
}
.sc__opt-empty {
  padding: 10px 8px;
  font-size: 12.5px;
  color: var(--color-muted);
  text-align: center;
}
.sc__footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 22px;
  border-top: 1px solid var(--color-border);
}
</style>
