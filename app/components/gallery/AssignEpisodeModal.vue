<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { AnimeView, SeasonView, EpisodeView } from '~/types/view'

const props = withDefaults(defineProps<{ open: boolean; count: number; saving?: boolean }>(), {
  saving: false,
})

const emit = defineEmits<{
  save: [payload: { episodeId: string }]
  close: []
}>()

const { t } = useI18n()
const { api } = useApi()
const { toSeasonView, toEpisodeView } = useAdapters()

const {
  query: seriesQuery,
  options: seriesOptions,
  loading: loadingSeries,
  searching: searchingSeries,
  load: loadSeries,
  reset: resetSeriesSearch,
} = useSeriesSearch()

const seasons = ref<SeasonView[]>([])
const episodes = ref<EpisodeView[]>([])

const seriesId = ref<string | null>(null)
const seasonId = ref<string | null>(null)
const episodeId = ref<string | null>(null)
const pickedSeries = ref<AnimeView | null>(null)

const loadingSeasons = ref(false)
const loadingEpisodes = ref(false)

const seriesLabel = computed(() => pickedSeries.value?.title ?? null)
const seasonLabel = computed(
  () => seasons.value.find((s) => s.id === seasonId.value)?.title ?? null,
)
const episodeLabel = computed(() => {
  const ep = episodes.value.find((e) => e.id === episodeId.value)
  return ep ? `E${String(ep.number).padStart(2, '0')} · ${ep.title}` : null
})

const canSave = computed(() => !props.saving && !!episodeId.value)

watch(
  () => props.open,
  async (open) => {
    if (!open) return
    resetSeriesSearch()
    seriesId.value = null
    seasonId.value = null
    episodeId.value = null
    pickedSeries.value = null
    seasons.value = []
    episodes.value = []
    await loadSeries()
  },
)

async function pickSeries(s: AnimeView): Promise<void> {
  seriesId.value = s.id
  pickedSeries.value = s
  resetSeriesSearch()
  seasonId.value = null
  episodeId.value = null
  seasons.value = []
  episodes.value = []
  loadingSeasons.value = true
  try {
    const rows = await api.listSeasons(s.id)
    seasons.value = rows.map((x) => toSeasonView(x))
  } finally {
    loadingSeasons.value = false
  }
}

async function pickSeason(id: string): Promise<void> {
  seasonId.value = id
  episodeId.value = null
  episodes.value = []
  loadingEpisodes.value = true
  try {
    const rows = await api.listEpisodes(id)
    episodes.value = rows.map((e) => toEpisodeView(e))
  } finally {
    loadingEpisodes.value = false
  }
}

function pickEpisode(id: string): void {
  episodeId.value = id
}

function onSave(): void {
  if (!canSave.value || !episodeId.value) return
  emit('save', { episodeId: episodeId.value })
}
</script>

<template>
  <LModal :open="open" :max-width="540" labelled-by="assign-ep-title" @close="emit('close')">
    <header class="ae__header">
      <div>
        <h2 id="assign-ep-title" class="ae__title">{{ t('selection.episodeTitle') }}</h2>
        <p class="ae__sub mono">{{ t('selection.appliesTo', { n: count }, count) }}</p>
      </div>
      <button type="button" class="ae__icon" :aria-label="t('common.close')" @click="emit('close')">
        <LIcon name="x" :size="18" :stroke="2" />
      </button>
    </header>

    <div class="ae__body">
      <LField :label="t('selection.stepSeries')">
        <LDropdown>
          <template #trigger="{ open: dOpen, toggle }">
            <button
              type="button"
              class="ae__sel"
              :class="{ 'ae__sel--open': dOpen }"
              @click="toggle"
            >
              <LIcon name="film" :size="14" class="ae__sel-icn" />
              <span class="ae__sel-val" :class="{ 'ae__sel-val--ph': !seriesLabel }">
                {{ seriesLabel || t('selection.pickSeries') }}
              </span>
              <LSpinner v-if="loadingSeries" :size="13" />
              <LIcon v-else name="chev" :size="14" class="ae__sel-icn" />
            </button>
          </template>
          <template #menu="{ close }">
            <div class="ae__search">
              <LIcon name="search" :size="14" class="ae__search-icn" />
              <input
                v-model="seriesQuery"
                type="text"
                class="ae__search-input"
                :placeholder="t('gallery.searchAnime')"
                :aria-label="t('gallery.searchAnime')"
              />
              <LSpinner v-if="searchingSeries" :size="14" class="ae__search-spin" />
            </div>
            <p v-if="!searchingSeries && !seriesOptions.length" class="ae__opt-empty">
              {{ t('gallery.noAnime') }}
            </p>
            <button
              v-for="s in seriesOptions"
              :key="s.id"
              type="button"
              class="ae__opt"
              :class="{ 'ae__opt--active': s.id === seriesId }"
              @click="(pickSeries(s), close())"
            >
              <span class="ae__opt-label">{{ s.title }}</span>
            </button>
          </template>
        </LDropdown>
      </LField>

      <LField :label="t('selection.stepSeason')">
        <LDropdown :disabled="!seriesId">
          <template #trigger="{ open: dOpen, toggle }">
            <button
              type="button"
              class="ae__sel"
              :class="{ 'ae__sel--open': dOpen, 'ae__sel--disabled': !seriesId }"
              :disabled="!seriesId"
              @click="toggle"
            >
              <LIcon name="grid" :size="14" class="ae__sel-icn" />
              <span class="ae__sel-val" :class="{ 'ae__sel-val--ph': !seasonLabel }">
                {{ seasonLabel || (seriesId ? t('selection.pickSeason') : t('gallery.pickAnime')) }}
              </span>
              <LSpinner v-if="loadingSeasons" :size="13" />
              <LIcon v-else name="chev" :size="14" class="ae__sel-icn" />
            </button>
          </template>
          <template #menu="{ close }">
            <button
              v-for="s in seasons"
              :key="s.id"
              type="button"
              class="ae__opt"
              :class="{ 'ae__opt--active': s.id === seasonId }"
              @click="(pickSeason(s.id), close())"
            >
              <span class="ae__opt-label">{{ s.title }}</span>
              <span v-if="s.episodesCount" class="ae__opt-hint mono">{{ s.episodesCount }} EP</span>
            </button>
          </template>
        </LDropdown>
      </LField>

      <LField :label="t('selection.stepEpisode')">
        <LDropdown :disabled="!seasonId">
          <template #trigger="{ open: dOpen, toggle }">
            <button
              type="button"
              class="ae__sel"
              :class="{ 'ae__sel--open': dOpen, 'ae__sel--disabled': !seasonId }"
              :disabled="!seasonId"
              @click="toggle"
            >
              <LIcon name="film" :size="14" class="ae__sel-icn" />
              <span class="ae__sel-val" :class="{ 'ae__sel-val--ph': !episodeLabel }">
                {{
                  episodeLabel || (seasonId ? t('selection.pickEpisode') : t('gallery.pickSeason'))
                }}
              </span>
              <LSpinner v-if="loadingEpisodes" :size="13" />
              <LIcon v-else name="chev" :size="14" class="ae__sel-icn" />
            </button>
          </template>
          <template #menu="{ close }">
            <button
              v-for="e in episodes"
              :key="e.id"
              type="button"
              class="ae__opt"
              :class="{ 'ae__opt--active': e.id === episodeId }"
              @click="(pickEpisode(e.id), close())"
            >
              <span class="ae__opt-label"
                >E{{ String(e.number).padStart(2, '0') }} · {{ e.title }}</span
              >
            </button>
          </template>
        </LDropdown>
      </LField>
    </div>

    <footer class="ae__footer">
      <LButton variant="ghost" @click="emit('close')">{{ t('common.cancel') }}</LButton>
      <LButton variant="primary" icon="check" :disabled="!canSave" @click="onSave">
        {{ t('selection.markScreenshots') }}
      </LButton>
    </footer>
  </LModal>
</template>

<style scoped>
.ae__header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 18px 22px;
  border-bottom: 1px solid var(--color-border);
}
.ae__title {
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.2px;
}
.ae__sub {
  font-size: 11px;
  color: var(--color-muted);
  letter-spacing: 0.6px;
  margin-top: 3px;
}
.ae__icon {
  margin-left: auto;
  display: inline-flex;
  padding: 8px;
  border-radius: var(--radius-s);
  color: var(--color-muted);
}
.ae__icon:hover {
  background: var(--color-surface2);
  color: var(--color-text);
}
.ae__body {
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.ae__sel {
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
.ae__sel--open {
  background: var(--color-surface3);
  border-color: var(--color-border-hi);
}
.ae__sel--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.ae__sel-icn {
  color: var(--color-muted);
  flex-shrink: 0;
}
.ae__sel-val {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--color-text);
}
.ae__sel-val--ph {
  color: var(--color-muted);
}
.ae__opt {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 10px;
  padding: 8px 10px;
  border-radius: var(--radius-s);
  text-align: left;
  font-size: 13px;
}
.ae__opt:hover,
.ae__opt--active {
  background: var(--color-surface2);
}
.ae__opt-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ae__opt-hint {
  font-size: 11px;
  color: var(--color-muted);
  flex-shrink: 0;
}
.ae__search {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  margin-bottom: 4px;
  border-radius: var(--radius-s);
  background: var(--color-surface2);
  border: 1px solid var(--color-border);
}
.ae__search-icn {
  color: var(--color-muted);
  flex-shrink: 0;
}
.ae__search-input {
  flex: 1;
  min-width: 0;
  background: none;
  border: none;
  outline: none;
  color: var(--color-text);
  font-size: 13px;
}
.ae__search-input::placeholder {
  color: var(--color-muted);
}
.ae__search-spin {
  color: var(--color-muted);
  flex-shrink: 0;
}
.ae__opt-empty {
  padding: 10px 8px;
  font-size: 12.5px;
  color: var(--color-muted);
  text-align: center;
}
.ae__footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 22px;
  border-top: 1px solid var(--color-border);
}
</style>
