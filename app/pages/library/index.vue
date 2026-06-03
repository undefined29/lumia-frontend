<script setup lang="ts">
import { ref, computed } from 'vue'
import type { AnimeView } from '~/types/view'
import type { SeasonResponseDto } from '~/types/season'
import { ApiError } from '~/types/api'
import { deriveSeriesAggregates } from '~/utils/adapters'
import { thumbUrlFromKey } from '~/utils/format'

const { t } = useI18n()
const localePath = useLocalePath()
const config = useRuntimeConfig()
const { api } = useApi()
const adapters = useAdapters()
const { canManageAnime } = usePermissions()

const baseCdnUrl = config.public.baseCdnUrl as string

type FilterKey = 'all' | 'ongoing' | 'finished' | 'hasGallery' | 'empty'
type SortKey = 'recent' | 'title' | 'rating'

const FILTERS: FilterKey[] = ['all', 'ongoing', 'finished', 'hasGallery', 'empty']
const SORTS: SortKey[] = ['recent', 'title', 'rating']

const search = ref('')
const activeFilter = ref<FilterKey>('all')
const activeSort = ref<SortKey>('recent')

const resource = useAsyncResource<AnimeView[]>(async () => {
  const series = await api.listSeries()
  return Promise.all(
    series.map(async (s) => {
      const [seasons, cover] = await Promise.all([
        api.listSeasons(s.id).catch(() => [] as SeasonResponseDto[]),
        s.coverImageId ? api.getImage(s.coverImageId).catch(() => null) : Promise.resolve(null),
      ])
      const view = adapters.toAnimeView({ ...s, ...deriveSeriesAggregates(seasons) })
      return cover
        ? { ...view, coverUrl: thumbUrlFromKey(cover.storageKey, baseCdnUrl, true) || null }
        : view
    }),
  )
})

function matchesFilter(anime: AnimeView): boolean {
  switch (activeFilter.value) {
    case 'ongoing':
      return anime.isOngoing
    case 'finished':
      return !anime.isOngoing
    case 'hasGallery':
      return anime.episodesCount > 0
    case 'empty':
      return anime.episodesCount === 0
    case 'all':
    default:
      return true
  }
}

const visible = computed<AnimeView[]>(() => {
  const list = resource.data.value ?? []
  const term = search.value.trim().toLowerCase()
  const filtered = list.filter((a) => {
    if (!matchesFilter(a)) return false
    if (!term) return true
    return (
      a.title.toLowerCase().includes(term) ||
      (a.titleSecondary?.toLowerCase().includes(term) ?? false)
    )
  })
  const sorted = [...filtered]
  switch (activeSort.value) {
    case 'title':
      sorted.sort((a, b) => a.title.localeCompare(b.title))
      break
    case 'rating':
      sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
      break
    case 'recent':
    default:
      break
  }
  return sorted
})

const totalCount = computed(() => resource.data.value?.length ?? 0)

function openTitle(id: string): void {
  navigateTo(localePath(`/library/${id}`))
}

function selectSort(key: SortKey, close: () => void): void {
  activeSort.value = key
  close()
}

const showFilters = ref(true)

const importOpen = ref(false)
const importing = ref(false)
const importError = ref<string | null>(null)

function openImport(): void {
  importError.value = null
  importOpen.value = true
}

async function submitImport(url: string): Promise<void> {
  importing.value = true
  importError.value = null
  try {
    await api.importSeries(url)
    importOpen.value = false
    await resource.retry()
  } catch (error: unknown) {
    importError.value = error instanceof ApiError ? error.message : t('library.importFailed')
  } finally {
    importing.value = false
  }
}

useSeoMeta({
  title: () => t('seo.libraryTitle'),
  description: () => t('seo.libraryDescription'),
})
</script>

<template>
  <main class="library">
    <header class="library__head">
      <div class="library__heading">
        <div class="library__label mono">
          {{ t('library.titlesCount', { n: totalCount }, totalCount) }}
        </div>
        <h1 class="library__title">{{ t('library.yourAnime') }}</h1>
      </div>

      <div class="library__tools">
        <label class="library__search">
          <LIcon name="search" :size="16" class="library__search-icon" />
          <input
            v-model="search"
            type="search"
            class="library__search-input"
            :placeholder="t('library.searchTitles')"
            :aria-label="t('library.searchTitles')"
          />
        </label>
        <LButton
          variant="secondary"
          icon="filter"
          :aria-pressed="showFilters"
          @click="showFilters = !showFilters"
          >{{ t('library.filters') }}</LButton
        >
        <LButton v-if="canManageAnime" variant="primary" icon="plus" @click="openImport">{{
          t('library.addTitle')
        }}</LButton>
      </div>
    </header>

    <div v-if="showFilters" class="library__bar">
      <span class="library__bar-label mono">{{ t('library.filter') }}</span>
      <button
        v-for="key in FILTERS"
        :key="key"
        type="button"
        class="pill"
        :class="{ 'pill--active': activeFilter === key }"
        :aria-pressed="activeFilter === key"
        @click="activeFilter = key"
      >
        {{ t(`library.${key}`) }}
      </button>
      <span class="library__bar-spacer" />
      <span class="library__bar-label mono">{{ t('library.sort') }}</span>
      <LDropdown>
        <template #trigger="{ toggle }">
          <button type="button" class="pill pill--sort" @click="toggle">
            {{ t(`library.sort_${activeSort}`) }}
            <LIcon name="chev" :size="12" />
          </button>
        </template>
        <template #menu="{ close }">
          <button
            v-for="key in SORTS"
            :key="key"
            type="button"
            class="menu-item"
            :class="{ 'menu-item--active': activeSort === key }"
            @click="selectSort(key, close)"
          >
            {{ t(`library.sort_${key}`) }}
          </button>
        </template>
      </LDropdown>
    </div>

    <LAsyncState
      :status="resource.status.value"
      :error="resource.error.value"
      @retry="resource.retry"
    >
      <template #loading>
        <div class="library__grid">
          <LSkeleton
            v-for="n in 10"
            :key="n"
            height="0"
            radius="var(--radius-m)"
            class="library__skeleton"
          />
        </div>
      </template>

      <div v-if="visible.length" class="library__grid">
        <AnimePoster
          v-for="anime in visible"
          :key="anime.id"
          v-reveal
          :anime="anime"
          @select="openTitle"
        />
      </div>
      <div v-else class="library__empty">
        <span class="library__empty-text">{{ t('library.noMatches') }}</span>
      </div>
    </LAsyncState>

    <ImportShikimoriModal
      :open="importOpen"
      :title="t('library.importTitle')"
      :saving="importing"
      :error="importError"
      @submit="submitImport"
      @close="importOpen = false"
    />
  </main>
</template>

<style scoped>
.library {
  padding: var(--space-8) var(--space-8) var(--space-7);
}
.library__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
  flex-wrap: wrap;
}
.library__label {
  font-size: 11px;
  letter-spacing: 1.4px;
  color: var(--color-muted);
  margin-bottom: 6px;
}
.library__title {
  font-size: 30px;
  font-weight: 600;
  letter-spacing: -0.7px;
}
.library__tools {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
}
.library__search {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  height: 38px;
  width: 280px;
  max-width: 100%;
  padding: 0 14px;
  background: var(--color-surface2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-m);
}
.library__search:focus-within {
  border-color: var(--color-border-hi);
}
.library__search-icon {
  color: var(--color-muted);
  flex-shrink: 0;
}
.library__search-input {
  flex: 1;
  min-width: 0;
  background: none;
  border: 0;
  outline: none;
  font-size: 13.5px;
  color: var(--color-text);
}
.library__search-input::placeholder {
  color: var(--color-muted);
}
.library__bar {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
  margin-bottom: var(--space-6);
}
.library__bar-label {
  font-size: 11px;
  letter-spacing: 1px;
  color: var(--color-muted);
  margin-right: var(--space-1);
}
.library__bar-spacer {
  flex: 1;
}
.pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 11px;
  border-radius: var(--radius-pill);
  font-size: 12.5px;
  font-weight: 500;
  color: var(--color-text2);
  background: transparent;
  border: 1px solid var(--color-border);
  transition: background var(--dur-fast);
}
.pill:hover:not(.pill--active) {
  background: var(--color-surface2);
}
.pill--active {
  background: var(--color-accent);
  color: var(--color-accent-contrast);
  border-color: var(--color-accent);
  font-weight: 600;
}
.pill--sort {
  background: var(--color-surface2);
}
.menu-item {
  display: block;
  width: 100%;
  text-align: left;
  padding: 8px 10px;
  border-radius: var(--radius-s);
  font-size: 13px;
  color: var(--color-text2);
}
.menu-item:hover {
  background: var(--color-surface2);
  color: var(--color-text);
}
.menu-item--active {
  color: var(--color-accent);
}
.library__grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--space-4);
}
.library__skeleton {
  aspect-ratio: 2 / 3;
  height: auto;
}
.library__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}
.library__empty-text {
  font-size: 13.5px;
  color: var(--color-muted);
}

@media (max-width: 1024px) {
  .library__grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
@media (max-width: 768px) {
  .library {
    padding: var(--space-5) var(--space-4) var(--space-6);
  }
  .library__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
