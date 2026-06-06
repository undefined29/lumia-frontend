<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { SeasonResponseDto } from '~/types/season'
import type { SeriesResponseDto } from '~/types/series'
import type { AnimeView, SeasonView, EpisodeView } from '~/types/view'
import { ApiError } from '~/types/api'
import { deriveSeriesAggregates } from '~/utils/adapters'
import { imageUrlFromKey, thumbUrlFromKey } from '~/utils/format'
import { analyzeImageLuminance, isLightLuminance } from '~/utils/luminance'

interface SeriesBundle {
  series: SeriesResponseDto
  seasons: SeasonResponseDto[]
}

const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()
const { api } = useApi()
const adapters = useAdapters()
const { canManageAnime } = usePermissions()
const { theme } = useTheme()

const baseCdnUrl = config.public.baseCdnUrl as string
const seriesId = computed(() => String(route.params.id))
const activeSeasonId = ref<string | null>(
  typeof route.query.season === 'string' ? route.query.season : null,
)

const seriesResource = useAsyncResource<SeriesBundle>(async () => {
  const [series, seasons] = await Promise.all([
    api.getSeries(seriesId.value),
    api.listSeasons(seriesId.value),
  ])
  return { series, seasons }
})

const aggregates = computed(() => deriveSeriesAggregates(seriesResource.data.value?.seasons ?? []))

const anime = computed<AnimeView | null>(() => {
  const bundle = seriesResource.data.value
  if (!bundle) return null
  return adapters.toAnimeView({ ...bundle.series, ...aggregates.value })
})

const bannerUrl = ref<string | null>(null)
const coverIsLight = ref<boolean | null>(null)
const bannerImageId = computed(() => {
  if (anime.value?.coverImageId) return anime.value.coverImageId
  const list = seriesResource.data.value?.seasons ?? []
  const season = list.find((s) => s.id === activeSeasonId.value) ?? list[0]
  return season?.imageId ?? null
})
watch(
  bannerImageId,
  async (imageId) => {
    bannerUrl.value = null
    coverIsLight.value = null
    if (!imageId) return
    try {
      const img = await api.getImage(imageId)
      const url = imageUrlFromKey(img.storageKey, baseCdnUrl) || null
      bannerUrl.value = url
      if (url) {
        const luminance = await analyzeImageLuminance(url)
        if (luminance != null) coverIsLight.value = isLightLuminance(luminance)
      }
    } catch {}
  },
  { immediate: true },
)

const heroOnDarkCover = computed(() => theme.value === 'light' && coverIsLight.value === false)

const seasons = computed<SeasonView[]>(() =>
  (seriesResource.data.value?.seasons ?? []).map((s) => adapters.toSeasonView(s)),
)

watch(
  seasons,
  (list) => {
    if (!list.length) return
    const valid = activeSeasonId.value && list.some((s) => s.id === activeSeasonId.value)
    if (!valid) activeSeasonId.value = list[0]!.id
  },
  { immediate: true },
)

watch(activeSeasonId, (id) => {
  if (!id || route.query.season === id) return
  void router.replace({ query: { ...route.query, season: id } }).catch(() => {})
})

const activeSeason = computed<SeasonView | null>(
  () => seasons.value.find((s) => s.id === activeSeasonId.value) ?? null,
)

const episodesResource = useAsyncResource<EpisodeView[]>(
  async () => {
    if (!activeSeasonId.value) return []
    const list = await api.listEpisodes(activeSeasonId.value)
    const views = list.map((e) => adapters.toEpisodeView(e))
    return Promise.all(
      views.map(async (view) => {
        if (!view.imageId) return view
        try {
          const img = await api.getImage(view.imageId)
          return { ...view, thumbUrl: thumbUrlFromKey(img.storageKey, baseCdnUrl, true) || null }
        } catch {
          return view
        }
      }),
    )
  },
  { watch: [activeSeasonId] },
)

const seasonImagesCount = computed(() =>
  (episodesResource.data.value ?? []).reduce((sum, e) => sum + e.imagesCount, 0),
)

const ratingText = computed(() =>
  anime.value?.rating != null ? anime.value.rating.toFixed(1) : '—',
)

function selectSeason(id: string): void {
  activeSeasonId.value = id
}

const nextSeasonNumber = computed(() => {
  const list = seriesResource.data.value?.seasons ?? []
  return list.reduce((max, s) => Math.max(max, s.number), 0) + 1
})

const newSeasonOpen = ref(false)
const creatingSeason = ref(false)
const newSeasonError = ref<string | null>(null)

function openNewSeason(): void {
  newSeasonError.value = null
  newSeasonOpen.value = true
}

async function submitNewSeason(payload: { number: number; title?: string }): Promise<void> {
  creatingSeason.value = true
  newSeasonError.value = null
  try {
    const created = await api.createSeason(seriesId.value, payload)
    newSeasonOpen.value = false
    await seriesResource.retry()
    activeSeasonId.value = created.id
  } catch (error: unknown) {
    newSeasonError.value =
      error instanceof ApiError ? error.message : t('library.createSeasonFailed')
  } finally {
    creatingSeason.value = false
  }
}

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
    const imported = await api.importSeason(seriesId.value, url)
    importOpen.value = false
    await seriesResource.retry()
    activeSeasonId.value = imported.id
  } catch (error: unknown) {
    importError.value = error instanceof ApiError ? error.message : t('library.importFailed')
  } finally {
    importing.value = false
  }
}

const editSeasonOpen = ref(false)
const savingSeason = ref(false)
const deletingSeason = ref(false)
const editSeasonError = ref<string | null>(null)

function openEditSeason(): void {
  editSeasonError.value = null
  editSeasonOpen.value = true
}

async function submitEditSeason(payload: { number: number; title: string | null }): Promise<void> {
  if (!activeSeasonId.value) return
  savingSeason.value = true
  editSeasonError.value = null
  try {
    await api.updateSeason(activeSeasonId.value, payload)
    editSeasonOpen.value = false
    await seriesResource.retry()
  } catch (error: unknown) {
    editSeasonError.value =
      error instanceof ApiError ? error.message : t('library.updateSeasonFailed')
  } finally {
    savingSeason.value = false
  }
}

async function deleteActiveSeason(): Promise<void> {
  const id = activeSeasonId.value
  if (!id) return
  deletingSeason.value = true
  editSeasonError.value = null
  try {
    await api.deleteSeason(id)
    editSeasonOpen.value = false
    activeSeasonId.value = null
    await seriesResource.retry()
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      editSeasonError.value = error.status === 409 ? t('library.seasonHasEpisodes') : error.message
    } else {
      editSeasonError.value = t('library.deleteSeasonFailed')
    }
  } finally {
    deletingSeason.value = false
  }
}

const editEpisodeTarget = ref<EpisodeView | null>(null)
const savingEpisode = ref(false)
const editEpisodeError = ref<string | null>(null)

function openEditEpisode(episode: EpisodeView): void {
  editEpisodeError.value = null
  editEpisodeTarget.value = episode
}

async function submitEditEpisode(payload: { title: string | null }): Promise<void> {
  const target = editEpisodeTarget.value
  if (!target) return
  savingEpisode.value = true
  editEpisodeError.value = null
  try {
    await api.updateEpisode(target.id, { title: payload.title })
    editEpisodeTarget.value = null
    await episodesResource.retry()
  } catch (error: unknown) {
    editEpisodeError.value =
      error instanceof ApiError ? error.message : t('library.updateEpisodeFailed')
  } finally {
    savingEpisode.value = false
  }
}

function episodeQueryLabel(episode: EpisodeView): string {
  return `E${String(episode.number).padStart(2, '0')} · ${episode.title}`
}

function openEpisode(episode: EpisodeView): void {
  navigateTo({
    path: localePath('/'),
    query: {
      seriesId: seriesId.value,
      seriesTitle: anime.value?.title || undefined,
      seasonId: activeSeasonId.value || undefined,
      seasonLabel: activeSeason.value?.title || undefined,
      episodeId: episode.id,
      episodeLabel: episodeQueryLabel(episode),
    },
  })
}

const seoTitle = computed(() =>
  anime.value ? `${anime.value.title} — ${t('app.name')}` : t('seo.libraryTitle'),
)
useSeoMeta({
  title: () => seoTitle.value,
  description: () => t('seo.libraryDescription'),
})
</script>

<template>
  <main class="detail">
    <LAsyncState
      :status="seriesResource.status.value"
      :error="seriesResource.error.value"
      @retry="seriesResource.retry"
    >
      <template #loading>
        <LSkeleton class="detail__hero-skeleton" radius="0" />
        <section class="body">
          <div class="detail__tabs-skeleton">
            <LSkeleton width="96px" height="34px" radius="var(--radius-m)" />
            <LSkeleton width="96px" height="34px" radius="var(--radius-m)" />
          </div>
          <LSkeleton height="64px" radius="var(--radius-m)" class="detail__strip-skeleton" />
          <div class="episodes">
            <LSkeleton v-for="n in 8" :key="n" height="72px" radius="var(--radius-m)" />
          </div>
        </section>
      </template>

      <template v-if="anime">
        <section class="hero" :class="{ 'hero--on-dark-cover': heroOnDarkCover }">
          <div class="hero__media">
            <LImage variant="banner" :src="bannerUrl" :hue="anime.hue" :alt="anime.title" />
          </div>
          <div class="hero__scrim" aria-hidden="true" />

          <nav class="hero__crumb mono" :aria-label="t('library.yourAnime')">
            <NuxtLink :to="localePath('/library')" class="hero__crumb-link">
              {{ t('nav.library') }}
            </NuxtLink>
            <LIcon name="chevR" :size="11" />
            <span>{{ anime.title.toUpperCase() }}</span>
          </nav>

          <div class="hero__info">
            <div v-if="anime.titleSecondary" class="hero__copyright mono">
              {{ anime.titleSecondary }}
            </div>
            <h1 class="hero__title">{{ anime.title }}</h1>
            <div class="hero__meta">
              <span class="hero__rating">
                <LIcon name="star" :size="14" :stroke="0" class="hero__star" />
                <strong>{{ ratingText }}</strong>
              </span>
              <template v-if="anime.year">
                <span class="hero__sep" />
                <span>{{ anime.year }}</span>
              </template>
              <span class="hero__sep" />
              <span>{{
                t('library.seasonsCount', { n: anime.seasonsCount }, anime.seasonsCount)
              }}</span>
              <span class="hero__sep" />
              <span>{{
                t('library.episodesCount', { n: anime.episodesCount }, anime.episodesCount)
              }}</span>
              <template v-if="anime.isOngoing">
                <span class="hero__sep" />
                <span class="hero__status">
                  <span class="hero__dot" aria-hidden="true" />
                  {{ t('library.ongoing') }}
                </span>
              </template>
            </div>
          </div>
        </section>

        <section class="body">
          <div class="tabs">
            <button
              v-for="season in seasons"
              :key="season.id"
              type="button"
              class="tab"
              :class="{ 'tab--active': season.id === activeSeasonId }"
              :aria-current="season.id === activeSeasonId ? 'true' : undefined"
              @click="selectSeason(season.id)"
            >
              {{ season.title }}
            </button>
            <LButton
              v-if="canManageAnime"
              variant="ghost"
              size="sm"
              icon="plus"
              class="tabs__new"
              @click="openNewSeason"
            >
              {{ t('library.newSeason') }}
            </LButton>
            <span class="tabs__spacer" />
            <LButton
              v-if="canManageAnime"
              variant="outline"
              size="sm"
              icon="download"
              @click="openImport"
            >
              {{ t('library.importShikimori') }}
            </LButton>
          </div>

          <SeasonMetaStrip
            v-if="activeSeason"
            :season="activeSeason"
            :images-count="seasonImagesCount"
            :editable="canManageAnime"
            @edit="openEditSeason"
          />

          <LAsyncState
            :status="episodesResource.status.value"
            :error="episodesResource.error.value"
            @retry="episodesResource.retry"
          >
            <template #loading>
              <div class="episodes">
                <LSkeleton v-for="n in 8" :key="n" height="72px" radius="var(--radius-m)" />
              </div>
            </template>

            <div class="episodes">
              <EpisodeCard
                v-for="episode in episodesResource.data.value ?? []"
                :key="episode.id"
                v-reveal
                :episode="episode"
                :editable="canManageAnime"
                @select="openEpisode"
                @edit="openEditEpisode"
              />
            </div>
          </LAsyncState>
        </section>
      </template>
    </LAsyncState>

    <NewSeasonModal
      :open="newSeasonOpen"
      :default-number="nextSeasonNumber"
      :saving="creatingSeason"
      :error="newSeasonError"
      @submit="submitNewSeason"
      @close="newSeasonOpen = false"
    />
    <ImportShikimoriModal
      :open="importOpen"
      :title="t('library.importSeasonTitle')"
      :saving="importing"
      :error="importError"
      @submit="submitImport"
      @close="importOpen = false"
    />
    <SeasonEditModal
      :open="editSeasonOpen"
      :season="activeSeason"
      :saving="savingSeason"
      :deleting="deletingSeason"
      :error="editSeasonError"
      @submit="submitEditSeason"
      @delete="deleteActiveSeason"
      @close="editSeasonOpen = false"
    />
    <EpisodeEditModal
      :open="!!editEpisodeTarget"
      :episode="editEpisodeTarget"
      :saving="savingEpisode"
      :error="editEpisodeError"
      @submit="submitEditEpisode"
      @close="editEpisodeTarget = null"
    />
  </main>
</template>

<style scoped>
.hero {
  position: relative;
  height: clamp(360px, 40vh, 620px);
  overflow: hidden;
  border-bottom: 1px solid var(--color-border);
}
.detail__hero-skeleton {
  height: clamp(360px, 40vh, 620px);
  width: 100%;
}
.detail__tabs-skeleton {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-6);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--color-border);
}
.detail__strip-skeleton {
  margin-bottom: var(--space-6);
}
.hero__media {
  position: absolute;
  inset: 0;
}
.hero__scrim {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(to top, var(--color-bg) 0%, transparent 60%),
    linear-gradient(
      to right,
      color-mix(in srgb, var(--color-bg) 80%, transparent) 0%,
      transparent 50%
    );
}
.hero--on-dark-cover .hero__scrim {
  background:
    linear-gradient(to top, rgba(6, 7, 10, 0.92) 0%, transparent 62%),
    linear-gradient(to right, rgba(6, 7, 10, 0.6) 0%, transparent 55%);
}
.hero--on-dark-cover .hero__title,
.hero--on-dark-cover .hero__rating strong {
  color: #f4f6f9;
}
.hero--on-dark-cover .hero__meta {
  color: rgba(244, 246, 249, 0.82);
}
.hero--on-dark-cover .hero__crumb {
  color: rgba(244, 246, 249, 0.7);
}
.hero--on-dark-cover .hero__crumb-link {
  color: rgba(244, 246, 249, 0.6);
}
.hero--on-dark-cover .hero__crumb-link:hover {
  color: rgba(244, 246, 249, 0.92);
}
.hero--on-dark-cover .hero__sep {
  background: rgba(244, 246, 249, 0.25);
}
.hero__crumb {
  position: absolute;
  top: 18px;
  left: 22px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  letter-spacing: 0.8px;
  color: var(--color-text2);
}
.hero__crumb-link {
  color: var(--color-muted);
}
.hero__crumb-link:hover {
  color: var(--color-text2);
}
.hero__info {
  position: absolute;
  left: 32px;
  right: 32px;
  bottom: 24px;
}
.hero__copyright {
  font-size: 11px;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--color-accent);
  margin-bottom: 8px;
}
.hero__title {
  font-size: 52px;
  font-weight: 600;
  letter-spacing: -1.5px;
  line-height: 1;
  margin-bottom: 14px;
}
.hero__meta {
  display: flex;
  align-items: center;
  gap: 18px;
  font-size: 13.5px;
  color: var(--color-text2);
  flex-wrap: wrap;
}
.hero__rating {
  display: flex;
  align-items: center;
  gap: 6px;
}
.hero__rating strong {
  font-weight: 600;
  color: var(--color-text);
}
.hero__star {
  fill: var(--color-warn);
  color: var(--color-warn);
}
.hero__sep {
  width: 1px;
  height: 14px;
  background: var(--color-border);
}
.hero__status {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px;
  border-radius: var(--radius-pill);
  background: color-mix(in srgb, var(--color-ok) 13%, transparent);
  color: var(--color-ok);
  font-family: var(--font-mono);
  font-size: 10.5px;
  letter-spacing: 0.8px;
}
.hero__dot {
  width: 5px;
  height: 5px;
  border-radius: var(--radius-pill);
  background: var(--color-ok);
  animation: lumia-pulse 1.6s ease-in-out infinite;
}
.body {
  padding: var(--space-7) var(--space-8) var(--space-10);
}
.tabs {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-6);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--color-border);
  flex-wrap: wrap;
}
.tab {
  padding: 8px 16px;
  border-radius: var(--radius-m);
  font-size: 14px;
  font-weight: 600;
  color: var(--color-muted);
  background: transparent;
  border: 1px solid transparent;
  transition: background var(--dur-fast);
}
.tab:hover {
  color: var(--color-text2);
}
.tab--active {
  color: var(--color-text);
  background: var(--color-surface2);
  border-color: var(--color-border);
}
.tabs__new {
  margin-left: var(--space-1);
}
.tabs__spacer {
  flex: 1;
}
.episodes {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-3);
}

@media (max-width: 1024px) {
  .episodes {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 768px) {
  .hero {
    height: 280px;
  }
  .hero__title {
    font-size: 36px;
    letter-spacing: -1px;
  }
  .hero__info {
    left: 20px;
    right: 20px;
  }
  .body {
    padding: var(--space-5) var(--space-4) var(--space-8);
  }
  .episodes {
    grid-template-columns: 1fr;
  }
}
</style>
