<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { TAG_CATEGORIES } from '~/types/tag'
import { hueGradient } from '~/utils/hue'
import { formatCount, thumbUrlFromKey } from '~/utils/format'
import type { AnimeView, CharacterView, SeasonView, EpisodeView } from '~/types/view'
import type { UserResponseDto } from '~/types/user'
import type { GalleryFilters, SelectedTag } from '~/types/gallery-filters'
import { emptyFilters } from '~/types/gallery-filters'

const props = defineProps<{ modelValue: GalleryFilters }>()
const emit = defineEmits<{ 'update:modelValue': [GalleryFilters] }>()

const { t, locale } = useI18n()
const { api } = useApi()
const { toAnimeView, toCharacterView, toSeasonView, toEpisodeView } = useAdapters()
const config = useRuntimeConfig()
const baseCdnUrl = config.public.baseCdnUrl as string

function update(patch: Partial<GalleryFilters>): void {
  emit('update:modelValue', { ...props.modelValue, ...patch })
}

const hasAnyFilter = computed(
  () =>
    props.modelValue.tags.length > 0 ||
    !!props.modelValue.characterTag ||
    !!props.modelValue.authorId ||
    !!props.modelValue.seriesId ||
    !!props.modelValue.seasonId ||
    !!props.modelValue.episodeId ||
    props.modelValue.withoutEpisodeLink ||
    props.modelValue.onlyFavorites,
)

function clearAll(): void {
  emit('update:modelValue', emptyFilters())
}

const characters = ref<CharacterView[]>([])
const series = ref<AnimeView[]>([])
const seasons = ref<SeasonView[]>([])
const episodes = ref<EpisodeView[]>([])

const selectedChar = computed(
  () => characters.value.find((c) => c.tagName === props.modelValue.characterTag) ?? null,
)

async function resolveCharacterAvatars(views: CharacterView[]): Promise<void> {
  await Promise.all(
    views.map(async (v) => {
      if (!v.coverImageId) return
      try {
        const img = await api.getImage(v.coverImageId)
        v.avatarUrl = thumbUrlFromKey(img.storageKey, baseCdnUrl, true) || null
      } catch {}
    }),
  )
}

async function loadCharacters(): Promise<void> {
  const rows = await api.listCharacters()
  const views = rows.map((c) => toCharacterView(c))
  await resolveCharacterAvatars(views)
  characters.value = [...views]
}

const charSearch = ref('')
const charResults = ref<CharacterView[]>([])
const charSearching = ref(false)
let charSearchTimer: ReturnType<typeof setTimeout> | null = null

const characterOptions = computed(() =>
  charSearch.value.trim() ? charResults.value : characters.value,
)

async function runCharSearch(query: string): Promise<void> {
  try {
    const rows = await api.listCharacters({ name: query, limit: 50 })
    const views = rows.map((c) => toCharacterView(c))
    await resolveCharacterAvatars(views)
    if (charSearch.value.trim() === query) charResults.value = views
  } finally {
    if (charSearch.value.trim() === query) charSearching.value = false
  }
}

watch(charSearch, (value) => {
  if (charSearchTimer) clearTimeout(charSearchTimer)
  const query = value.trim()
  if (!query) {
    charResults.value = []
    charSearching.value = false
    return
  }
  charSearching.value = true
  charSearchTimer = setTimeout(() => void runCharSearch(query), 250)
})

const users = ref<UserResponseDto[]>([])
const authorSearch = ref('')
const authorResults = ref<UserResponseDto[]>([])
const authorSearching = ref(false)
let authorSearchTimer: ReturnType<typeof setTimeout> | null = null

const authorOptions = computed(() =>
  authorSearch.value.trim() ? authorResults.value : users.value,
)

const selectedUser = computed(
  () => users.value.find((u) => u.id === props.modelValue.authorId) ?? null,
)

function userHue(id: string): number {
  return Math.abs(id.split('').reduce((h, c) => h + c.charCodeAt(0), 0)) % 360
}

function userLabel(u: UserResponseDto): string {
  return u.username ? `@${u.username}` : u.name
}

async function loadUsers(): Promise<void> {
  users.value = await api.listUsers({ limit: 50 })
}

async function runAuthorSearch(query: string): Promise<void> {
  try {
    const rows = await api.listUsers({ search: query, limit: 50 })
    if (authorSearch.value.trim() === query) authorResults.value = rows
  } finally {
    if (authorSearch.value.trim() === query) authorSearching.value = false
  }
}

watch(authorSearch, (value) => {
  if (authorSearchTimer) clearTimeout(authorSearchTimer)
  const query = value.trim()
  if (!query) {
    authorResults.value = []
    authorSearching.value = false
    return
  }
  authorSearching.value = true
  authorSearchTimer = setTimeout(() => void runAuthorSearch(query), 250)
})

async function resolveSeriesCovers(views: AnimeView[]): Promise<AnimeView[]> {
  return Promise.all(
    views.map(async (view) => {
      if (!view.coverImageId) return view
      try {
        const img = await api.getImage(view.coverImageId)
        return { ...view, coverUrl: thumbUrlFromKey(img.storageKey, baseCdnUrl, true) || null }
      } catch {
        return view
      }
    }),
  )
}

async function loadSeries(): Promise<void> {
  const rows = await api.listSeries()
  series.value = await resolveSeriesCovers(rows.map((s) => toAnimeView(s)))
}

const animeSearch = ref('')
const animeResults = ref<AnimeView[]>([])
const animeSearching = ref(false)
let animeSearchTimer: ReturnType<typeof setTimeout> | null = null

const animeOptions = computed(() => (animeSearch.value.trim() ? animeResults.value : series.value))

async function runAnimeSearch(query: string): Promise<void> {
  try {
    const rows = await api.listSeries({ search: query, limit: 50 })
    const views = await resolveSeriesCovers(rows.map((s) => toAnimeView(s)))
    if (animeSearch.value.trim() === query) animeResults.value = views
  } finally {
    if (animeSearch.value.trim() === query) animeSearching.value = false
  }
}

watch(animeSearch, (value) => {
  if (animeSearchTimer) clearTimeout(animeSearchTimer)
  const query = value.trim()
  if (!query) {
    animeResults.value = []
    animeSearching.value = false
    return
  }
  animeSearching.value = true
  animeSearchTimer = setTimeout(() => void runAnimeSearch(query), 250)
})
async function loadSeasons(seriesId: string): Promise<void> {
  const rows = await api.listSeasons(seriesId)
  seasons.value = rows.map((s) => toSeasonView(s))
}
async function loadEpisodes(seasonId: string): Promise<void> {
  const rows = await api.listEpisodes(seasonId)
  episodes.value = rows.map((e) => toEpisodeView(e))
}

onMounted(() => {
  void loadCharacters()
  void loadSeries()
  void loadUsers()
})

watch(
  () => props.modelValue.seriesId,
  (id) => {
    if (id) void loadSeasons(id)
    else seasons.value = []
  },
  { immediate: true },
)
watch(
  () => props.modelValue.seasonId,
  (id) => {
    if (id) void loadEpisodes(id)
    else episodes.value = []
  },
  { immediate: true },
)

const tagModel = computed<SelectedTag[]>({
  get: () => props.modelValue.tags,
  set: (tags) => update({ tags }),
})

function toggleFlag(key: 'withoutEpisodeLink' | 'onlyFavorites'): void {
  update({ [key]: !props.modelValue[key] })
}

function pickCharacter(c: CharacterView | null): void {
  if (c && !characters.value.some((x) => x.id === c.id)) {
    characters.value = [c, ...characters.value]
  }
  charSearch.value = ''
  update({
    characterTag: c ? c.tagName : null,
    characterLabel: c ? c.displayName : null,
  })
}
function pickAuthor(u: UserResponseDto | null): void {
  if (u && !users.value.some((x) => x.id === u.id)) {
    users.value = [u, ...users.value]
  }
  authorSearch.value = ''
  update({
    authorId: u ? u.id : null,
    authorLabel: u ? userLabel(u) : null,
  })
}
function pickSeries(s: AnimeView | null): void {
  animeSearch.value = ''
  update({
    seriesId: s ? s.id : null,
    seriesTitle: s ? s.title : null,
    seasonId: null,
    seasonLabel: null,
    episodeId: null,
    episodeLabel: null,
  })
}
function pickSeason(s: SeasonView | null): void {
  update({
    seasonId: s ? s.id : null,
    seasonLabel: s ? s.title : null,
    episodeId: null,
    episodeLabel: null,
  })
}
function pickEpisode(e: EpisodeView | null): void {
  update({
    episodeId: e ? e.id : null,
    episodeLabel: e ? episodeOptionLabel(e) : null,
  })
}

function episodeOptionLabel(e: EpisodeView): string {
  return `E${String(e.number).padStart(2, '0')} · ${e.title}`
}

function avatarGradient(hue: number): string {
  return hueGradient(hue, 'avatar')
}
function animeGradient(hue: number): string {
  return `linear-gradient(120deg, oklch(0.55 0.22 ${hue}), oklch(0.25 0.12 ${hue + 40}))`
}
</script>

<template>
  <aside class="sidebar" aria-label="Gallery filters">
    <header class="sidebar__head">
      <span class="sidebar__title">{{ t('gallery.filters') }}</span>
      <button v-if="hasAnyFilter" type="button" class="sidebar__clear mono" @click="clearAll">
        {{ t('gallery.clearAll') }}
      </button>
    </header>

    <LField :label="t('gallery.tags')">
      <TagAutocomplete v-model="tagModel" />
    </LField>

    <LField :label="t('gallery.author')">
      <LDropdown>
        <template #trigger="{ open, toggle }">
          <button
            type="button"
            class="sel"
            :class="{ 'sel--open': open }"
            :aria-expanded="open"
            @click="toggle"
          >
            <span
              v-if="modelValue.authorLabel"
              class="sel__avatar"
              :style="
                selectedUser?.avatarUrl
                  ? undefined
                  : { background: avatarGradient(userHue(modelValue.authorId ?? '')) }
              "
            >
              <img
                v-if="selectedUser?.avatarUrl"
                :src="selectedUser.avatarUrl"
                alt=""
                class="avatar-img"
              />
              <template v-else>{{ modelValue.authorLabel.replace('@', '').charAt(0) }}</template>
            </span>
            <LIcon v-else name="user" :size="14" class="sel__prefix" />
            <span
              class="sel__value"
              :class="{ 'sel__value--placeholder': !modelValue.authorLabel }"
            >
              {{ modelValue.authorLabel || t('gallery.anyAuthor') }}
            </span>
            <button
              v-if="modelValue.authorLabel"
              type="button"
              class="sel__clear"
              :aria-label="t('common.clear')"
              @click.stop="pickAuthor(null)"
            >
              <LIcon name="x" :size="12" :stroke="2" />
            </button>
            <LIcon v-else name="chev" :size="14" class="sel__chev" />
          </button>
        </template>
        <template #menu="{ close }">
          <div class="charsearch">
            <LIcon name="search" :size="14" class="charsearch__icon" />
            <input
              v-model="authorSearch"
              type="text"
              class="charsearch__input"
              :placeholder="t('gallery.searchAuthor')"
              :aria-label="t('gallery.searchAuthor')"
            />
            <LSpinner v-if="authorSearching" :size="14" class="charsearch__spin" />
          </div>
          <p v-if="!authorSearching && !authorOptions.length" class="opt__empty">
            {{ t('gallery.noAuthors') }}
          </p>
          <button
            v-for="u in authorOptions"
            :key="u.id"
            type="button"
            class="opt"
            :class="{ 'opt--active': u.id === modelValue.authorId }"
            @click="(pickAuthor(u), close())"
          >
            <span
              class="opt__avatar"
              :style="u.avatarUrl ? undefined : { background: avatarGradient(userHue(u.id)) }"
            >
              <img v-if="u.avatarUrl" :src="u.avatarUrl" alt="" class="avatar-img" />
              <template v-else>{{ u.name.charAt(0) }}</template>
            </span>
            <span class="opt__label">{{ u.name }}</span>
            <span v-if="u.username" class="opt__hint mono">@{{ u.username }}</span>
          </button>
        </template>
      </LDropdown>
    </LField>

    <LField :label="t('gallery.character')">
      <LDropdown>
        <template #trigger="{ open, toggle }">
          <button
            type="button"
            class="sel"
            :class="{ 'sel--open': open }"
            :aria-expanded="open"
            @click="toggle"
          >
            <span
              v-if="modelValue.characterLabel"
              class="sel__avatar"
              :style="
                selectedChar?.avatarUrl
                  ? undefined
                  : { background: avatarGradient(selectedChar?.hue ?? 200) }
              "
            >
              <img
                v-if="selectedChar?.avatarUrl"
                :src="selectedChar.avatarUrl"
                alt=""
                class="avatar-img"
              />
              <template v-else>{{ modelValue.characterLabel.charAt(0) }}</template>
            </span>
            <LIcon v-else name="user" :size="14" class="sel__prefix" />
            <span
              class="sel__value"
              :class="{ 'sel__value--placeholder': !modelValue.characterLabel }"
            >
              {{ modelValue.characterLabel || t('gallery.anyCharacter') }}
            </span>
            <button
              v-if="modelValue.characterLabel"
              type="button"
              class="sel__clear"
              :aria-label="t('common.clear')"
              @click.stop="pickCharacter(null)"
            >
              <LIcon name="x" :size="12" :stroke="2" />
            </button>
            <LIcon v-else name="chev" :size="14" class="sel__chev" />
          </button>
        </template>
        <template #menu="{ close }">
          <div class="charsearch">
            <LIcon name="search" :size="14" class="charsearch__icon" />
            <input
              v-model="charSearch"
              type="text"
              class="charsearch__input"
              :placeholder="t('gallery.searchCharacter')"
              :aria-label="t('gallery.searchCharacter')"
            />
            <LSpinner v-if="charSearching" :size="14" class="charsearch__spin" />
          </div>
          <p v-if="!charSearching && !characterOptions.length" class="opt__empty">
            {{ t('gallery.noCharacters') }}
          </p>
          <button
            v-for="c in characterOptions"
            :key="c.id"
            type="button"
            class="opt"
            :class="{ 'opt--active': c.tagName === modelValue.characterTag }"
            @click="(pickCharacter(c), close())"
          >
            <span
              class="opt__avatar"
              :style="c.avatarUrl ? undefined : { background: avatarGradient(c.hue) }"
            >
              <img v-if="c.avatarUrl" :src="c.avatarUrl" alt="" class="avatar-img" />
              <template v-else>{{ c.displayName.charAt(0) }}</template>
            </span>
            <span class="opt__label">{{ c.displayName }}</span>
            <span class="opt__hint mono">{{ c.tagName }}</span>
          </button>
        </template>
      </LDropdown>
    </LField>

    <LField :label="t('gallery.anime')">
      <LDropdown>
        <template #trigger="{ open, toggle }">
          <button
            type="button"
            class="sel"
            :class="{ 'sel--open': open }"
            :aria-expanded="open"
            @click="toggle"
          >
            <LIcon name="film" :size="14" class="sel__prefix" />
            <span
              class="sel__value"
              :class="{ 'sel__value--placeholder': !modelValue.seriesTitle }"
            >
              {{ modelValue.seriesTitle || t('gallery.anyAnime') }}
            </span>
            <button
              v-if="modelValue.seriesTitle"
              type="button"
              class="sel__clear"
              :aria-label="t('common.clear')"
              @click.stop="pickSeries(null)"
            >
              <LIcon name="x" :size="12" :stroke="2" />
            </button>
            <LIcon v-else name="chev" :size="14" class="sel__chev" />
          </button>
        </template>
        <template #menu="{ close }">
          <div class="charsearch">
            <LIcon name="search" :size="14" class="charsearch__icon" />
            <input
              v-model="animeSearch"
              type="text"
              class="charsearch__input"
              :placeholder="t('gallery.searchAnime')"
              :aria-label="t('gallery.searchAnime')"
            />
            <LSpinner v-if="animeSearching" :size="14" class="charsearch__spin" />
          </div>
          <p v-if="!animeSearching && !animeOptions.length" class="opt__empty">
            {{ t('gallery.noAnime') }}
          </p>
          <button
            v-for="a in animeOptions"
            :key="a.id"
            type="button"
            class="opt opt--anime"
            :class="{ 'opt--active': a.id === modelValue.seriesId }"
            @click="(pickSeries(a), close())"
          >
            <span
              class="opt__bg"
              :class="{ 'opt__bg--image': a.coverUrl }"
              :style="
                a.coverUrl
                  ? { backgroundImage: `url(${a.coverUrl})` }
                  : { background: animeGradient(a.hue) }
              "
            />
            <span class="opt__anime-body">
              <span class="opt__anime-main">
                <span class="opt__anime-title">{{ a.title }}</span>
                <span class="opt__anime-meta mono">
                  {{
                    [
                      a.year,
                      a.seasonsCount ? `S${a.seasonsCount}` : null,
                      a.episodesCount ? `${a.episodesCount} EP` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')
                  }}
                </span>
              </span>
              <span v-if="a.isOngoing" class="opt__badge mono">{{ t('gallery.ongoing') }}</span>
            </span>
          </button>
        </template>
      </LDropdown>
    </LField>

    <LField :label="t('gallery.season')">
      <LDropdown :disabled="!modelValue.seriesId">
        <template #trigger="{ open, toggle }">
          <button
            type="button"
            class="sel"
            :class="{ 'sel--open': open, 'sel--disabled': !modelValue.seriesId }"
            :disabled="!modelValue.seriesId"
            :aria-expanded="open"
            @click="toggle"
          >
            <LIcon name="grid" :size="14" class="sel__prefix" />
            <span
              class="sel__value"
              :class="{ 'sel__value--placeholder': !modelValue.seasonLabel }"
            >
              {{
                modelValue.seasonLabel ||
                (modelValue.seriesId ? t('gallery.anySeason') : t('gallery.pickAnime'))
              }}
            </span>
            <button
              v-if="modelValue.seasonLabel"
              type="button"
              class="sel__clear"
              :aria-label="t('common.clear')"
              @click.stop="pickSeason(null)"
            >
              <LIcon name="x" :size="12" :stroke="2" />
            </button>
            <LIcon v-else name="chev" :size="14" class="sel__chev" />
          </button>
        </template>
        <template #menu="{ close }">
          <button
            v-for="s in seasons"
            :key="s.id"
            type="button"
            class="opt opt--simple"
            :class="{ 'opt--active': s.id === modelValue.seasonId }"
            @click="(pickSeason(s), close())"
          >
            <span class="opt__label">{{ s.title }}</span>
            <span v-if="s.episodesCount" class="opt__hint mono">{{ s.episodesCount }} EP</span>
          </button>
        </template>
      </LDropdown>
    </LField>

    <LField :label="t('gallery.episode')">
      <LDropdown :disabled="!modelValue.seasonId">
        <template #trigger="{ open, toggle }">
          <button
            type="button"
            class="sel"
            :class="{ 'sel--open': open, 'sel--disabled': !modelValue.seasonId }"
            :disabled="!modelValue.seasonId"
            :aria-expanded="open"
            @click="toggle"
          >
            <LIcon name="film" :size="14" class="sel__prefix" />
            <span
              class="sel__value"
              :class="{ 'sel__value--placeholder': !modelValue.episodeLabel }"
            >
              {{
                modelValue.episodeLabel ||
                (modelValue.seasonId ? t('gallery.anyEpisode') : t('gallery.pickSeason'))
              }}
            </span>
            <button
              v-if="modelValue.episodeLabel"
              type="button"
              class="sel__clear"
              :aria-label="t('common.clear')"
              @click.stop="pickEpisode(null)"
            >
              <LIcon name="x" :size="12" :stroke="2" />
            </button>
            <LIcon v-else name="chev" :size="14" class="sel__chev" />
          </button>
        </template>
        <template #menu="{ close }">
          <button
            v-for="e in episodes"
            :key="e.id"
            type="button"
            class="opt opt--simple"
            :class="{ 'opt--active': e.id === modelValue.episodeId }"
            @click="(pickEpisode(e), close())"
          >
            <span class="opt__label">{{ episodeOptionLabel(e) }}</span>
            <span class="opt__hint mono">{{ formatCount(e.imagesCount, locale) }} img</span>
          </button>
        </template>
      </LDropdown>
    </LField>

    <LField :label="t('gallery.quickFilters')">
      <div class="sidebar__quick">
        <button
          type="button"
          class="qf"
          :class="{ 'qf--on': modelValue.withoutEpisodeLink }"
          :aria-pressed="modelValue.withoutEpisodeLink"
          @click="toggleFlag('withoutEpisodeLink')"
        >
          <LIcon name="film" :size="12" :stroke="2" class="qf__icn" />
          {{ t('gallery.withoutEpisodeLink') }}
        </button>
        <button
          type="button"
          class="qf"
          :class="{ 'qf--on': modelValue.onlyFavorites }"
          :aria-pressed="modelValue.onlyFavorites"
          @click="toggleFlag('onlyFavorites')"
        >
          <LIcon name="star" :size="12" :stroke="2" class="qf__icn" />
          {{ t('gallery.onlyFavorites') }}
        </button>
      </div>
    </LField>

    <div class="sidebar__legend">
      <div class="sidebar__legend-title mono">{{ t('gallery.categories') }}</div>
      <div class="sidebar__legend-row">
        <span
          v-for="cat in TAG_CATEGORIES"
          :key="cat"
          class="legend-chip mono"
          :style="{ '--cc': `var(--cat-${cat})` }"
        >
          <span class="legend-chip__dot" />
          {{ t(`gallery.cat.${cat}`) }}
        </span>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: var(--sidebar-w);
  height: 100%;
  flex-shrink: 0;
  background: var(--color-bg2);
  border-right: 1px solid var(--color-border);
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  overflow: auto;
}
.sidebar__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 28px;
}
.sidebar__title {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.2px;
}
.sidebar__clear {
  font-size: 11.5px;
  color: var(--color-muted);
  letter-spacing: 0.6px;
  padding: 4px 8px;
  border-radius: var(--radius-s);
}
.sidebar__clear:hover {
  color: var(--color-text2);
  background: var(--color-surface2);
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
  transition:
    background var(--dur-fast),
    border-color var(--dur-fast);
}
.sel--open {
  background: var(--color-surface3);
  border-color: var(--color-border-hi);
}
.sel--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.sel__prefix {
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
.sel__value--placeholder {
  color: var(--color-muted);
}
.sel__chev {
  color: var(--color-muted);
  flex-shrink: 0;
}
.sel__clear {
  color: var(--color-muted);
  display: inline-flex;
  padding: 2px;
  border-radius: var(--radius-s);
  flex-shrink: 0;
}
.sel__clear:hover {
  color: var(--color-text);
}
.sel__avatar,
.opt__avatar {
  border-radius: 50%;
  flex-shrink: 0;
  overflow: hidden;
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}
.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.sel__avatar {
  width: 20px;
  height: 20px;
  font-size: 11px;
}
.opt__avatar {
  width: 26px;
  height: 26px;
  font-size: 12px;
}

.charsearch {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  margin-bottom: 4px;
  border-radius: var(--radius-s);
  background: var(--color-surface2);
  border: 1px solid var(--color-border);
}
.charsearch__icon {
  color: var(--color-muted);
  flex-shrink: 0;
}
.charsearch__input {
  flex: 1;
  min-width: 0;
  background: none;
  border: none;
  outline: none;
  color: var(--color-text);
  font-size: 13px;
}
.charsearch__input::placeholder {
  color: var(--color-muted);
}
.charsearch__spin {
  color: var(--color-muted);
  flex-shrink: 0;
}
.opt__empty {
  padding: 10px 8px;
  font-size: 12.5px;
  color: var(--color-muted);
  text-align: center;
}

.opt {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 10px;
  padding: 7px 8px;
  border-radius: var(--radius-s);
  text-align: left;
}
.opt:hover,
.opt--active {
  background: var(--color-surface2);
}
.opt--simple {
  padding: 7px 10px;
  font-size: 13px;
}
.opt__label {
  flex: 1 0 auto;
  font-size: 13px;
  white-space: nowrap;
}
.opt__hint {
  flex: 0 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11px;
  color: var(--color-muted);
}
.opt--anime {
  position: relative;
  padding: 10px 12px;
  overflow: hidden;
}
.opt--anime + .opt--anime {
  margin-top: 5px;
}
.opt__bg {
  position: absolute;
  inset: 0;
  opacity: 0.15;
}
.opt__bg--image {
  opacity: 0.2;
  background-size: cover;
  background-position: center;
  filter: blur(7px);
  transform: scale(1.15);
}
.opt:hover .opt__bg--image,
.opt--active .opt__bg--image {
  opacity: 0.3;
}
.opt__anime-body {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}
.opt__anime-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}
.opt__anime-title {
  font-size: 13px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.opt__anime-meta {
  font-size: 10.5px;
  color: var(--color-muted);
  letter-spacing: 0.5px;
}
.opt__badge {
  font-size: 9.5px;
  color: var(--color-ok);
  letter-spacing: 0.6px;
  padding: 2px 6px;
  border-radius: var(--radius-pill);
  background: color-mix(in srgb, var(--color-ok) 10%, transparent);
  flex-shrink: 0;
}

.sidebar__quick {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.qf {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 11px;
  border-radius: var(--radius-pill);
  font-size: 12.5px;
  font-weight: 500;
  color: var(--color-text2);
  background: transparent;
  border: 1px solid var(--color-border);
  transition:
    background var(--dur-fast),
    border-color var(--dur-fast),
    color var(--dur-fast);
}
.qf:hover:not(.qf--on) {
  background: var(--color-surface2);
  color: var(--color-text);
}
.qf--on {
  background: var(--color-accent);
  color: var(--color-accent-contrast);
  border-color: var(--color-accent);
  font-weight: 600;
}
.qf__icn {
  flex-shrink: 0;
}

.sidebar__legend {
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid var(--color-border);
}
.sidebar__legend-title {
  font-size: 10.5px;
  color: var(--color-muted);
  letter-spacing: 0.8px;
  margin-bottom: 6px;
}
.sidebar__legend-row {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}
.legend-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 7px;
  border-radius: var(--radius-pill);
  font-size: 10.5px;
  color: var(--cc);
  background: color-mix(in srgb, var(--cc) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--cc) 15%, transparent);
}
.legend-chip__dot {
  width: 5px;
  height: 5px;
  border-radius: 3px;
  background: var(--cc);
  box-shadow: 0 0 6px color-mix(in srgb, var(--cc) 60%, transparent);
}
</style>
