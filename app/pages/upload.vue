<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import type { AnimeView, SeasonView, EpisodeView } from '~/types/view'
import { useUpload } from '~/composables/useUpload'
import type { UploadPhase } from '~/composables/useUpload'
import { formatBytes } from '~/utils/format'

const { t } = useI18n()
const { api } = useApi()
const { toSeasonView, toEpisodeView } = useAdapters()
const { canUpload } = usePermissions()
const { items, error, notice, start, deleteUploaded, clear, suppressGlobalDrop } = useUpload()

const deleteTargetId = ref<string | null>(null)
const deleting = ref(false)
function askDelete(id: string): void {
  deleteTargetId.value = id
}
async function confirmDelete(): Promise<void> {
  const id = deleteTargetId.value
  if (!id) return
  deleting.value = true
  try {
    await deleteUploaded(id)
    deleteTargetId.value = null
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  suppressGlobalDrop.value = true
})
onBeforeUnmount(() => {
  suppressGlobalDrop.value = false
  error.value = null
  notice.value = null
})

useSeoMeta({
  title: () => t('seo.uploadTitle'),
  description: () => t('seo.uploadDescription'),
})

const {
  query: seriesQuery,
  options: seriesOptions,
  loading: loadingSeries,
  searching: searchingSeries,
  load: loadSeriesList,
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
  return ep ? episodeOptionLabel(ep) : null
})

function episodeOptionLabel(e: EpisodeView): string {
  return `E${String(e.number).padStart(2, '0')} · ${e.title}`
}

onMounted(() => void loadSeriesList())

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

const fileInput = ref<HTMLInputElement | null>(null)
const dragging = ref(false)
const ready = computed(() => !!episodeId.value && canUpload.value)

function browse(): void {
  if (ready.value) fileInput.value?.click()
}

async function addFiles(files: File[]): Promise<void> {
  if (!episodeId.value) return
  const images = files.filter((f) => f.type.startsWith('image/'))
  if (!images.length) return
  await start(images, { episodeId: episodeId.value, sourceType: 'screenshot', open: false })
}

function onPick(event: Event): void {
  const input = event.target as HTMLInputElement
  void addFiles(Array.from(input.files ?? []))
  input.value = ''
}

function onDrop(event: DragEvent): void {
  dragging.value = false
  if (!ready.value) return
  void addFiles(Array.from(event.dataTransfer?.files ?? []))
}
function onDragOver(): void {
  if (ready.value) dragging.value = true
}
function onDragLeave(): void {
  dragging.value = false
}

const doneCount = computed(() => items.value.filter((i) => i.phase === 'done').length)

const BADGE: Record<UploadPhase, { key: string; color: string }> = {
  queued: { key: 'upload.badgeQueued', color: 'var(--color-muted)' },
  uploading: { key: 'upload.badgeUploading', color: 'var(--color-accent-text)' },
  analyzing: { key: 'upload.badgeAnalyzing', color: 'var(--cat-character)' },
  done: { key: 'upload.badgeDone', color: 'var(--color-ok)' },
  error: { key: 'upload.badgeError', color: 'var(--color-err)' },
}
</script>

<template>
  <main class="bulk">
    <header class="bulk__head">
      <h1 class="bulk__title">{{ t('upload.bulkTitle') }}</h1>
      <p class="bulk__desc">{{ t('upload.bulkDesc') }}</p>
    </header>

    <div v-if="!canUpload" class="bulk__guard">{{ t('errors.notEnoughPermissions') }}</div>

    <template v-else>
      <section class="bulk__panel">
        <div class="bulk__eyebrow mono">{{ t('upload.bulkPickEpisode') }}</div>
        <div class="bulk__cascade">
          <LField :label="t('selection.stepSeries')">
            <LDropdown>
              <template #trigger="{ open: dOpen, toggle }">
                <button type="button" class="sel" :class="{ 'sel--open': dOpen }" @click="toggle">
                  <LIcon name="film" :size="14" class="sel__prefix" />
                  <span class="sel__value" :class="{ 'sel__value--ph': !seriesLabel }">
                    {{ seriesLabel || t('selection.pickSeries') }}
                  </span>
                  <LSpinner v-if="loadingSeries" :size="13" />
                  <LIcon v-else name="chev" :size="14" class="sel__chev" />
                </button>
              </template>
              <template #menu="{ close }">
                <div class="bulk__search">
                  <LIcon name="search" :size="14" class="bulk__search-icn" />
                  <input
                    v-model="seriesQuery"
                    type="text"
                    class="bulk__search-input"
                    :placeholder="t('gallery.searchAnime')"
                    :aria-label="t('gallery.searchAnime')"
                  />
                  <LSpinner v-if="searchingSeries" :size="14" class="bulk__search-spin" />
                </div>
                <p v-if="!searchingSeries && !seriesOptions.length" class="opt__empty">
                  {{ t('gallery.noAnime') }}
                </p>
                <button
                  v-for="s in seriesOptions"
                  :key="s.id"
                  type="button"
                  class="opt"
                  :class="{ 'opt--active': s.id === seriesId }"
                  @click="(pickSeries(s), close())"
                >
                  <span class="opt__label">{{ s.title }}</span>
                </button>
              </template>
            </LDropdown>
          </LField>

          <LField :label="t('selection.stepSeason')">
            <LDropdown :disabled="!seriesId">
              <template #trigger="{ open: dOpen, toggle }">
                <button
                  type="button"
                  class="sel"
                  :class="{ 'sel--open': dOpen, 'sel--disabled': !seriesId }"
                  :disabled="!seriesId"
                  @click="toggle"
                >
                  <LIcon name="grid" :size="14" class="sel__prefix" />
                  <span class="sel__value" :class="{ 'sel__value--ph': !seasonLabel }">
                    {{
                      seasonLabel || (seriesId ? t('selection.pickSeason') : t('gallery.pickAnime'))
                    }}
                  </span>
                  <LSpinner v-if="loadingSeasons" :size="13" />
                  <LIcon v-else name="chev" :size="14" class="sel__chev" />
                </button>
              </template>
              <template #menu="{ close }">
                <button
                  v-for="s in seasons"
                  :key="s.id"
                  type="button"
                  class="opt"
                  :class="{ 'opt--active': s.id === seasonId }"
                  @click="(pickSeason(s.id), close())"
                >
                  <span class="opt__label">{{ s.title }}</span>
                  <span v-if="s.episodesCount" class="opt__hint mono"
                    >{{ s.episodesCount }} EP</span
                  >
                </button>
              </template>
            </LDropdown>
          </LField>

          <LField :label="t('selection.stepEpisode')">
            <LDropdown :disabled="!seasonId">
              <template #trigger="{ open: dOpen, toggle }">
                <button
                  type="button"
                  class="sel"
                  :class="{ 'sel--open': dOpen, 'sel--disabled': !seasonId }"
                  :disabled="!seasonId"
                  @click="toggle"
                >
                  <LIcon name="film" :size="14" class="sel__prefix" />
                  <span class="sel__value" :class="{ 'sel__value--ph': !episodeLabel }">
                    {{
                      episodeLabel ||
                      (seasonId ? t('selection.pickEpisode') : t('gallery.pickSeason'))
                    }}
                  </span>
                  <LSpinner v-if="loadingEpisodes" :size="13" />
                  <LIcon v-else name="chev" :size="14" class="sel__chev" />
                </button>
              </template>
              <template #menu="{ close }">
                <button
                  v-for="e in episodes"
                  :key="e.id"
                  type="button"
                  class="opt"
                  :class="{ 'opt--active': e.id === episodeId }"
                  @click="(pickEpisode(e.id), close())"
                >
                  <span class="opt__label">{{ episodeOptionLabel(e) }}</span>
                </button>
              </template>
            </LDropdown>
          </LField>
        </div>
      </section>

      <section
        class="dz"
        :class="{ 'dz--ready': ready, 'dz--drag': dragging, 'dz--locked': !episodeId }"
        role="button"
        :tabindex="ready ? 0 : -1"
        :aria-disabled="!ready"
        @click="browse"
        @keydown.enter.prevent="browse"
        @keydown.space.prevent="browse"
        @dragover.prevent.stop="onDragOver"
        @dragleave="onDragLeave"
        @drop.prevent.stop="onDrop"
      >
        <input ref="fileInput" type="file" accept="image/*" multiple hidden @change="onPick" />
        <LIcon name="upload" :size="30" class="dz__icon" />
        <p class="dz__title">
          {{ episodeId ? t('upload.bulkDropTitle') : t('upload.bulkEpisodeRequired') }}
        </p>
        <p v-if="episodeId" class="dz__hint mono">{{ t('upload.bulkDropHint') }}</p>
      </section>

      <div v-if="error" class="bulk__alert bulk__alert--err" role="alert">
        <LIcon name="x" :size="14" :stroke="2.5" />
        <span>{{ error }}</span>
      </div>
      <div v-else-if="notice" class="bulk__alert bulk__alert--ok" role="status">
        <LIcon name="check" :size="14" :stroke="2.5" />
        <span>{{ notice }}</span>
      </div>

      <section v-if="items.length" class="bulk__progress">
        <div class="bulk__progress-head">
          <span class="bulk__progress-summary mono">
            {{
              t('upload.summary', {
                done: doneCount,
                remaining: items.length - doneCount,
                max: items.length,
              })
            }}
          </span>
          <LButton variant="ghost" size="sm" @click="clear">{{ t('common.clearAll') }}</LButton>
        </div>
        <ul class="bulk__list">
          <li v-for="item in items" :key="item.id" class="row">
            <div
              class="row__thumb"
              :style="{
                background: `linear-gradient(135deg, oklch(0.55 0.2 ${item.hue}), oklch(0.2 0.1 ${item.hue + 40}))`,
              }"
            >
              <img v-if="item.previewUrl" :src="item.previewUrl" alt="" class="row__thumb-img" />
              <div v-if="item.phase === 'analyzing'" class="row__overlay">
                <LSpinner :size="20" color="var(--cat-character)" />
              </div>
              <div v-else-if="item.phase === 'error'" class="row__overlay row__overlay--error">
                <LIcon name="x" :size="18" :stroke="2" />
              </div>
            </div>
            <div class="row__body">
              <div class="row__top">
                <span class="row__name mono">{{ item.filename }}</span>
                <span class="row__size mono">{{ formatBytes(item.size) }}</span>
                <span class="row__badge mono" :style="{ '--badge-c': BADGE[item.phase].color }">
                  {{ t(BADGE[item.phase].key) }}
                </span>
              </div>
              <div v-if="item.tags?.length" class="row__tags">
                <LTagChip
                  v-for="tag in item.tags"
                  :key="tag.name"
                  :category="tag.category"
                  :color="tag.color"
                  size="sm"
                >
                  {{ tag.name }}
                </LTagChip>
              </div>
            </div>
            <button
              type="button"
              class="row__remove"
              :aria-label="t('common.delete')"
              @click="askDelete(item.id)"
            >
              <LIcon name="x" :size="15" :stroke="2" />
            </button>
          </li>
        </ul>
      </section>
    </template>

    <LConfirm
      :open="!!deleteTargetId"
      :title="t('upload.deleteImageTitle')"
      :body="t('upload.deleteImageBody')"
      :confirm-label="t('common.delete')"
      danger
      :loading="deleting"
      @confirm="confirmDelete"
      @cancel="deleteTargetId = null"
    />
  </main>
</template>

<style scoped>
.bulk {
  max-width: 880px;
  margin: 0 auto;
  padding: var(--space-8) var(--space-6) var(--space-10);
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}
.bulk__title {
  font-size: 26px;
  font-weight: 600;
  letter-spacing: -0.5px;
}
.bulk__desc {
  margin-top: 6px;
  font-size: 13.5px;
  color: var(--color-muted);
  max-width: 60ch;
}
.bulk__guard {
  padding: 40px;
  text-align: center;
  color: var(--color-muted);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-m);
}
.bulk__panel {
  padding: 18px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-l);
  background: var(--color-bg2);
}
.bulk__eyebrow {
  font-size: 10.5px;
  color: var(--color-muted);
  letter-spacing: 1px;
  margin-bottom: 12px;
}
.bulk__cascade {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

.sel {
  width: 100%;
  height: 38px;
  padding: 0 8px 0 12px;
  background: var(--color-surface2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-m);
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  text-align: left;
}
.sel--open {
  background: var(--color-surface3);
  border-color: var(--color-border-hi);
}
.sel--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.sel__prefix,
.sel__chev {
  color: var(--color-muted);
  flex-shrink: 0;
}
.sel__value {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--color-text);
}
.sel__value--ph {
  color: var(--color-muted);
}
.opt {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 10px;
  padding: 7px 10px;
  border-radius: var(--radius-s);
  text-align: left;
  font-size: 13px;
}
.opt:hover,
.opt--active {
  background: var(--color-surface2);
}
.opt__label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.opt__hint {
  font-size: 11px;
  color: var(--color-muted);
  flex-shrink: 0;
}
.bulk__search {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  margin-bottom: 4px;
  border-radius: var(--radius-s);
  background: var(--color-surface2);
  border: 1px solid var(--color-border);
}
.bulk__search-icn,
.bulk__search-spin {
  color: var(--color-muted);
  flex-shrink: 0;
}
.bulk__search-input {
  flex: 1;
  min-width: 0;
  background: none;
  border: none;
  outline: none;
  color: var(--color-text);
  font-size: 13px;
}
.bulk__search-input::placeholder {
  color: var(--color-muted);
}
.opt__empty {
  padding: 10px 8px;
  font-size: 12.5px;
  color: var(--color-muted);
  text-align: center;
}

.dz {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 48px 24px;
  border: 1.5px dashed var(--color-border);
  border-radius: var(--radius-l);
  background: var(--color-bg2);
  color: var(--color-muted);
  text-align: center;
  transition:
    border-color var(--dur-fast),
    background var(--dur-fast),
    color var(--dur-fast);
}
.dz--ready {
  cursor: pointer;
  color: var(--color-text2);
}
.dz--ready:hover,
.dz--drag {
  border-color: var(--color-accent);
  background: var(--color-accent-dim);
  color: var(--color-text);
}
.dz--locked {
  opacity: 0.65;
}
.dz__icon {
  color: var(--color-accent-text);
}
.dz__title {
  font-size: 14px;
  font-weight: 500;
}
.dz__hint {
  font-size: 11px;
  letter-spacing: 0.6px;
}

.bulk__alert {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: var(--radius-m);
  font-size: 12.5px;
}
.bulk__alert--err {
  color: var(--color-err);
  background: color-mix(in srgb, var(--color-err) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-err) 30%, transparent);
}
.bulk__alert--ok {
  color: var(--color-ok);
  background: color-mix(in srgb, var(--color-ok) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-ok) 30%, transparent);
}

.bulk__progress-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.bulk__progress-summary {
  font-size: 11px;
  color: var(--color-muted);
  letter-spacing: 0.6px;
}
.bulk__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.row {
  display: grid;
  grid-template-columns: 64px 1fr auto;
  gap: 14px;
  align-items: center;
  padding: 12px;
  border-radius: var(--radius-m);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}
.row__thumb {
  position: relative;
  width: 64px;
  height: 64px;
  border-radius: var(--radius-s);
  overflow: hidden;
}
.row__thumb-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.row__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
}
.row__overlay--error {
  color: var(--color-err);
}
.row__body {
  min-width: 0;
}
.row__top {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}
.row__name {
  font-size: 12.5px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.row__size {
  font-size: 10.5px;
  color: var(--color-muted);
  flex-shrink: 0;
}
.row__badge {
  margin-left: auto;
  flex-shrink: 0;
  padding: 2px 8px;
  border-radius: var(--radius-pill);
  font-size: 10.5px;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: var(--badge-c);
  background: color-mix(in srgb, var(--badge-c) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--badge-c) 20%, transparent);
}
.row__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}
.row__remove {
  display: inline-flex;
  padding: 8px;
  border-radius: var(--radius-s);
  color: var(--color-muted);
}
.row__remove:hover {
  background: var(--color-surface2);
  color: var(--color-err);
}

@media (max-width: 768px) {
  .bulk__cascade {
    grid-template-columns: 1fr;
  }
}
</style>
