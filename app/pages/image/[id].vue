<script setup lang="ts">
import { ref, computed, watch, onMounted, defineAsyncComponent } from 'vue'
import type { TagCategory } from '~/types/tag'
import type { TagView, CharacterView } from '~/types/view'
import type { PatchTagAdd } from '~/types/image'
import { orderedTagGroups } from '~/utils/tags'
import { hueStageBackdrop, hueGradient, hueFromId } from '~/utils/hue'
import type { UserResponseDto } from '~/types/user'
import {
  formatDate,
  formatDateTime,
  truncateHash,
  padId,
  formatCount,
  thumbUrlFromKey,
} from '~/utils/format'
import { splitTimecode } from '~/utils/timecode'

const TagEditPopover = defineAsyncComponent(() => import('~/components/image/TagEditPopover.vue'))
const CharacterEditModal = defineAsyncComponent(
  () => import('~/components/image/CharacterEditModal.vue'),
)
const ImageTagsEditModal = defineAsyncComponent(
  () => import('~/components/image/ImageTagsEditModal.vue'),
)

const route = useRoute()
const router = useRouter()
const localePath = useLocalePath()
const { t, locale } = useI18n()
const { api } = useApi()
const { toImageView, toCharacterView } = useAdapters()
const { isMobile } = useBreakpoint()
const { burst } = useHearts()
const reducedMotion = useReducedMotion()
const config = useRuntimeConfig()
const baseCdnUrl = config.public.baseCdnUrl as string

const id = computed(() => String(route.params.id))

const fullEl = ref<HTMLImageElement | null>(null)
const fullLoaded = ref(false)
watch(id, () => {
  fullLoaded.value = false
})
onMounted(() => {
  if (fullEl.value?.complete && fullEl.value.naturalWidth > 0) fullLoaded.value = true
})

const { status, data, error, refresh, retry } = useAsyncResource(
  async () => {
    const dto = await api.getImage(id.value)
    return toImageView(dto)
  },
  { watch: [id] },
)

const view = computed(() => data.value)

const { canEditOthersTags, canManageAnime, canAssignOthersEpisodes, canDeleteOthersImages } =
  usePermissions()
const userStore = useUserStore()
const isOwnImage = computed(
  () => !!view.value && !!userStore.currentUser && view.value.authorId === userStore.currentUser.id,
)
const canDelete = computed(() => {
  if (!view.value) return false
  return isOwnImage.value || canDeleteOthersImages.value
})
const canEditTags = computed(() => {
  if (!view.value) return false
  return isOwnImage.value || canEditOthersTags.value
})
const canSetSource = computed(() => {
  if (!view.value) return false
  return isOwnImage.value || canAssignOthersEpisodes.value
})

const groups = computed(() => (view.value ? orderedTagGroups(view.value.tagGroups) : []))

const aspectLabel = computed(() => {
  if (!view.value) return '—'
  return `${Math.round(view.value.aspectRatio * 100) / 100} : 1`
})

const dimensionsLabel = computed(() => {
  if (!view.value) return ''
  return `${view.value.width} × ${view.value.height}`
})

const sourceLabel = computed(() => {
  if (!view.value) return ''
  if (view.value.seasonNumber == null && view.value.episodeNumber == null) return ''
  return t('image.seasonEpisode', {
    season: view.value.seasonNumber ?? '—',
    episode: String(view.value.episodeNumber ?? 0).padStart(2, '0'),
  })
})

const timecodeLabel = computed(() => {
  const total = view.value?.timestampSeconds
  if (total == null) return ''
  const { hours, minutes, seconds } = splitTimecode(total)
  const parts: string[] = []
  if (hours) parts.push(t('image.hoursPart', { n: hours }, hours))
  if (minutes) parts.push(t('image.minutesPart', { n: minutes }, minutes))
  if (seconds || !parts.length) parts.push(t('image.secondsPart', { n: seconds }, seconds))
  return parts.join(' ')
})

const author = ref<UserResponseDto | null>(null)
watch(
  () => view.value?.authorId,
  async (authorId) => {
    author.value = null
    if (!authorId) return
    try {
      author.value = await api.getUser(authorId)
    } catch {}
  },
  { immediate: true },
)
const authorName = computed(() => {
  const a = author.value
  if (!a) return view.value ? padId(view.value.authorId) : ''
  return a.username ? `@${a.username}` : a.name
})
const authorHue = computed(() => hueFromId(view.value?.authorId ?? ''))
const authorLink = computed(() => ({
  path: localePath('/'),
  query: { authorId: view.value?.authorId ?? '', authorLabel: authorName.value },
}))

const popoverTag = ref<TagView | null>(null)
const popoverOpen = ref(false)
const popoverPos = ref<{ left: number; top: number }>({ left: 0, top: 0 })
const stageRef = ref<HTMLElement | null>(null)

function openTagPopover(tag: TagView, target: HTMLElement): void {
  const rect = target.getBoundingClientRect()
  popoverPos.value = {
    left: Math.min(rect.left, window.innerWidth - 336),
    top: rect.bottom + 8,
  }
  popoverTag.value = tag
  popoverOpen.value = true
}

function closeTagPopover(): void {
  popoverOpen.value = false
  popoverTag.value = null
}

async function saveTag(next: {
  name: string
  category: TagCategory
  color: string | null
}): Promise<void> {
  const original = popoverTag.value
  closeTagPopover()
  if (!original || !view.value) return
  if (next.name !== original.name) {
    await api.patchImageTags(view.value.id, {
      remove: [original.name],
      add: [{ name: next.name, category: next.category }],
    })
    await refresh()
  }
}

async function deleteTag(): Promise<void> {
  const original = popoverTag.value
  closeTagPopover()
  if (!original || !view.value) return
  await api.patchImageTags(view.value.id, { remove: [original.name] })
  await refresh()
}

const character = ref<CharacterView | null>(null)
const characterOpen = ref(false)

async function openCharacter(tag: TagView): Promise<void> {
  characterOpen.value = true
  character.value = null
  try {
    const [charDto, tags] = await Promise.all([
      api.getCharacterByTag(tag.name).catch(() => null),
      api.listTags({ search: tag.name }),
    ])
    const tagDto = tags.find((entry) => entry.name === tag.name) ?? null
    if (charDto) {
      const charView = toCharacterView(charDto, tagDto)
      if (charView.coverImageId) {
        try {
          const img = await api.getImage(charView.coverImageId)
          charView.avatarUrl = thumbUrlFromKey(img.storageKey, baseCdnUrl, true) || null
        } catch {}
      }
      character.value = charView
    } else {
      character.value = {
        id: '',
        tagId: tagDto ? String(tagDto.id) : '',
        tagName: tag.name,
        displayName: tag.name,
        hue: 200,
        avatarUrl: null,
        coverImageId: null,
        usedInCount: tagDto?.usageCount ?? tag.count ?? 0,
        color: tagDto?.colorOverride ?? tag.color ?? null,
      }
    }
  } catch {
    character.value = null
    characterOpen.value = false
  }
}

function closeCharacter(): void {
  characterOpen.value = false
  character.value = null
}

async function saveCharacter(payload: {
  displayName: string
  tagName: string
  color: string | null
}): Promise<void> {
  const target = character.value
  closeCharacter()
  if (!target) return
  try {
    const tasks: Promise<unknown>[] = []
    if (target.id && payload.displayName !== target.displayName) {
      tasks.push(api.updateCharacter(target.id, { name: payload.displayName }))
    }
    const tagPatch: { name?: string; colorOverride?: string | null } = {}
    if (payload.tagName !== target.tagName) tagPatch.name = payload.tagName
    if (payload.color !== target.color) tagPatch.colorOverride = payload.color
    if (target.tagId && (tagPatch.name !== undefined || tagPatch.colorOverride !== undefined)) {
      tasks.push(api.updateTag(target.tagId, tagPatch))
    }
    if (tasks.length) {
      await Promise.all(tasks)
      await refresh()
    }
  } catch {}
}

function deleteCharacter(): void {
  closeCharacter()
}

function onTagClick(tag: TagView, event: MouseEvent): void {
  if (!canEditTags.value) return
  if (tag.category === 'character') {
    if (!canManageAnime.value) return
    void openCharacter(tag)
  } else {
    openTagPopover(tag, event.currentTarget as HTMLElement)
  }
}

const editOpen = ref(false)
const editSaving = ref(false)

function openEdit(): void {
  editOpen.value = true
}

const assignModals = ref<{
  openSetAvatar: (image: NonNullable<typeof view.value>) => void
  openSetCover: (image: NonNullable<typeof view.value>) => void
} | null>(null)

function moreSetAvatar(close: () => void): void {
  if (view.value) assignModals.value?.openSetAvatar(view.value)
  close()
}
function moreSetCover(close: () => void): void {
  if (view.value) assignModals.value?.openSetCover(view.value)
  close()
}

const assignEpisodeOpen = ref(false)
const assignEpisodeSaving = ref(false)

function moreSetSource(close: () => void): void {
  assignEpisodeOpen.value = true
  close()
}

async function onAssignSource(payload: { episodeId: string }): Promise<void> {
  if (!view.value) return
  assignEpisodeSaving.value = true
  try {
    await api.updateImage(view.value.id, { episodeId: payload.episodeId, sourceType: 'screenshot' })
    await refresh()
    assignEpisodeOpen.value = false
  } finally {
    assignEpisodeSaving.value = false
  }
}

async function saveTags(payload: { add: PatchTagAdd[]; remove: string[] }): Promise<void> {
  if (!view.value) return
  if (!payload.add.length && !payload.remove.length) {
    editOpen.value = false
    return
  }
  editSaving.value = true
  try {
    await api.patchImageTags(view.value.id, payload)
    await refresh()
    editOpen.value = false
  } finally {
    editSaving.value = false
  }
}

const favoriting = ref(false)
async function toggleFavorite(event: MouseEvent): Promise<void> {
  const current = view.value
  if (!current || favoriting.value) return
  const next = !current.favorite
  favoriting.value = true
  data.value = { ...current, favorite: next }
  if (next && !reducedMotion.value) {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
    burst(rect.left + rect.width / 2, rect.top + rect.height / 2)
  }
  try {
    await api.setFavorite(current.id, next)
  } catch {
    if (data.value) data.value = { ...data.value, favorite: current.favorite }
  } finally {
    favoriting.value = false
  }
}

const downloading = ref(false)
async function downloadImage(): Promise<void> {
  const current = view.value
  if (!current?.url || downloading.value) return
  downloading.value = true
  const filename = `lumia-${id.value}.${current.format}`
  try {
    const res = await fetch(current.url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const blob = await res.blob()
    const objectUrl = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = objectUrl
    anchor.download = filename
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(objectUrl)
  } catch {
    window.open(current.url, '_blank', 'noopener')
  } finally {
    downloading.value = false
  }
}

const deleteOpen = ref(false)
const deleting = ref(false)

function moreDelete(close: () => void): void {
  deleteOpen.value = true
  close()
}

async function confirmDelete(): Promise<void> {
  if (!view.value || deleting.value) return
  deleting.value = true
  try {
    await api.deleteImage(view.value.id)
    deleteOpen.value = false
    void router.push(localePath('/'))
  } finally {
    deleting.value = false
  }
}

function goBack(): void {
  const hasInAppHistory = router.options.history.state.back != null
  if (hasInAppHistory) router.back()
  else void router.push(localePath('/'))
}

useSeoMeta({
  title: () => t('seo.imageTitle', { id: id.value }),
  description: () => t('seo.imageDescription'),
})
</script>

<template>
  <main class="ip">
    <header class="ip__bar">
      <LButton variant="secondary" size="sm" icon="chevL" @click="goBack">{{
        t('common.back')
      }}</LButton>
      <nav class="ip__crumb mono" :aria-label="t('image.breadcrumb')">
        <span>{{ t('nav.gallery').toUpperCase() }}</span>
        <LIcon name="chevR" :size="11" />
        <template v-if="view?.seriesTitle">
          <span>{{ view.seriesTitle.toUpperCase() }}</span>
          <LIcon name="chevR" :size="11" />
        </template>
        <span class="ip__crumb-current">{{ t('image.crumbImage', { id: padId(id) }) }}</span>
      </nav>
      <span class="ip__spacer" />
      <button
        v-if="view"
        type="button"
        class="ip__fav"
        :class="{ 'ip__fav--on': view.favorite }"
        :aria-pressed="view.favorite"
        :disabled="favoriting"
        @click="toggleFavorite"
      >
        <LIcon name="star" :size="15" :stroke="view.favorite ? 0 : 2" />
        <span>{{ view.favorite ? t('image.favorited') : t('image.favorite') }}</span>
      </button>
      <LButton
        v-if="view"
        variant="ghost"
        size="sm"
        icon="download"
        :loading="downloading"
        @click="downloadImage"
        >{{ t('image.download') }}</LButton
      >
      <LDropdown v-if="view && (canManageAnime || canSetSource || canDelete)" align="right">
        <template #trigger="{ toggle }">
          <LButton variant="ghost" size="sm" icon="more" @click="toggle">{{
            t('image.more')
          }}</LButton>
        </template>
        <template #menu="{ close }">
          <LMenuItem v-if="canSetSource" icon="film" @select="moreSetSource(close)">{{
            t('image.setSource')
          }}</LMenuItem>
          <LMenuItem v-if="canManageAnime" icon="user" @select="moreSetAvatar(close)">{{
            t('selection.setAvatar')
          }}</LMenuItem>
          <LMenuItem v-if="canManageAnime" icon="picture" @select="moreSetCover(close)">{{
            t('selection.setCover')
          }}</LMenuItem>
          <LMenuItem v-if="canDelete" icon="trash" danger @select="moreDelete(close)">{{
            t('common.delete')
          }}</LMenuItem>
        </template>
      </LDropdown>
    </header>

    <LAsyncState :status="status" :error="error" @retry="retry">
      <template #loading>
        <div class="ip__body">
          <section class="ip__stage ip__stage--skeleton">
            <LSkeleton class="ip__img-skeleton" radius="var(--radius-m)" />
          </section>
          <aside class="ip__rail">
            <div class="ip__source">
              <LSkeleton width="56px" height="11px" />
              <LSkeleton width="70%" height="20px" radius="var(--radius-s)" />
              <LSkeleton width="40%" height="13px" />
            </div>
            <div class="ip__author">
              <LSkeleton width="48px" height="11px" />
              <LSkeleton width="60%" height="28px" radius="var(--radius-s)" />
            </div>
            <div class="ip__stats">
              <LSkeleton v-for="n in 4" :key="n" height="34px" radius="var(--radius-s)" />
            </div>
            <div class="ip__tags">
              <LSkeleton width="50%" height="14px" />
              <div class="ip__chips">
                <LSkeleton
                  v-for="w in [54, 72, 48, 64, 58]"
                  :key="w"
                  :width="`${w}px`"
                  height="24px"
                  radius="var(--radius-pill)"
                />
              </div>
            </div>
          </aside>
        </div>
      </template>

      <div v-if="view" class="ip__body">
        <section
          ref="stageRef"
          class="ip__stage"
          :style="{ background: hueStageBackdrop(view.hue) }"
        >
          <template v-if="view.url">
            <img
              v-if="view.thumbUrl"
              :src="view.thumbUrl"
              :width="view.width"
              :height="view.height"
              alt=""
              aria-hidden="true"
              class="ip__img ip__img--ph"
              :class="{ 'ip__img--ph-hidden': fullLoaded }"
            />
            <img
              ref="fullEl"
              :src="view.url"
              :width="view.width"
              :height="view.height"
              :alt="view.seriesTitle ?? ''"
              class="ip__img ip__img--full"
              :class="{ 'ip__img--in': fullLoaded }"
              loading="lazy"
              decoding="async"
              :draggable="false"
              @load="fullLoaded = true"
            />
          </template>
          <div
            v-else
            class="ip__frame"
            :style="{ aspectRatio: String(view.aspectRatio), background: hueGradient(view.hue) }"
          />

          <div class="ip__pill mono">
            <span>{{ padId(id) }}</span>
            <span class="ip__pill-sep">·</span>
            <span>{{ dimensionsLabel }}</span>
            <span class="ip__pill-sep">·</span>
            <span>{{ view.format.toUpperCase() }}</span>
          </div>
        </section>

        <aside class="ip__rail">
          <div class="ip__source">
            <span class="ip__eyebrow mono">{{ t('image.source') }}</span>
            <template v-if="view.seriesTitle">
              <div class="ip__title">{{ view.seriesTitle }}</div>
              <div v-if="sourceLabel" class="ip__sub">{{ sourceLabel }}</div>
            </template>
            <div v-else class="ip__unassigned">{{ t('image.unassigned') }}</div>
            <div v-if="timecodeLabel" class="ip__timecode">
              <span class="ip__eyebrow mono">{{ t('image.timecode') }}</span>
              <div class="ip__sub">{{ timecodeLabel }}</div>
            </div>
          </div>

          <div class="ip__author">
            <span class="ip__eyebrow mono">{{ t('image.author') }}</span>
            <NuxtLink :to="authorLink" class="ip__author-link" :title="t('image.filterByAuthor')">
              <LAvatar :name="authorName" :src="author?.avatarUrl" :hue="authorHue" :size="28" />
              <span class="ip__author-name">{{ authorName }}</span>
            </NuxtLink>
          </div>

          <div class="ip__stats">
            <div class="ip__stat">
              <span class="ip__stat-key mono">{{ t('image.uploaded') }}</span>
              <span class="ip__stat-val mono" :title="formatDateTime(view.createdAt, locale)">{{
                formatDate(view.createdAt, locale)
              }}</span>
            </div>
            <div class="ip__stat">
              <span class="ip__stat-key mono">{{ t('image.aspect') }}</span>
              <span class="ip__stat-val mono">{{ aspectLabel }}</span>
            </div>
            <div class="ip__stat">
              <span class="ip__stat-key mono">{{ t('image.tags') }}</span>
              <span class="ip__stat-val mono">{{ formatCount(view.tags.length, locale) }}</span>
            </div>
            <div class="ip__stat">
              <span class="ip__stat-key mono">{{ t('image.hash') }}</span>
              <span class="ip__stat-val mono">{{ truncateHash(view.contentHash) }}</span>
            </div>
          </div>

          <div class="ip__tags">
            <div class="ip__tags-head">
              <span class="ip__tags-title">{{ t('image.tagsHeading') }}</span>
              <button v-if="canEditTags" type="button" class="ip__edit mono" @click="openEdit">
                <LIcon name="edit" :size="11" /> {{ t('common.edit') }}
              </button>
            </div>

            <div v-if="!groups.length" class="ip__empty">
              {{ t('image.noTags') }}
              <button v-if="canEditTags" type="button" class="ip__empty-add" @click="openEdit">
                {{ t('image.addSome') }}
              </button>
            </div>

            <div v-for="group in groups" :key="group.category" class="ip__group">
              <div class="ip__group-head">
                <span
                  class="ip__group-dot"
                  :style="{
                    background: `var(--cat-${group.category})`,
                    boxShadow: `0 0 8px var(--cat-${group.category})`,
                  }"
                />
                <span class="ip__group-cat mono" :style="{ color: `var(--cat-${group.category})` }">
                  {{ t(`tagEdit.category.${group.category}`) }}
                </span>
                <span class="ip__group-count mono">{{ group.tags.length }}</span>
              </div>
              <div class="ip__chips">
                <LTagChip
                  v-for="tag in group.tags"
                  :key="tag.name"
                  :category="group.category"
                  :color="tag.color"
                  size="md"
                  :clickable="canEditTags"
                  @click="onTagClick(tag, $event)"
                >
                  {{ tag.name }}
                </LTagChip>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </LAsyncState>

    <TagEditPopover
      v-if="popoverTag"
      :model-tag="{
        name: popoverTag.name,
        category: popoverTag.category,
        color: popoverTag.color,
        count: popoverTag.count,
      }"
      :open="popoverOpen"
      :centered="isMobile"
      :style="isMobile ? undefined : { left: `${popoverPos.left}px`, top: `${popoverPos.top}px` }"
      @save="saveTag"
      @delete="deleteTag"
      @close="closeTagPopover"
    />

    <CharacterEditModal
      :character="character"
      :open="characterOpen"
      @save="saveCharacter"
      @delete="deleteCharacter"
      @close="closeCharacter"
    />

    <ImageTagsEditModal
      v-if="view"
      :open="editOpen"
      :tags="view.tags"
      :saving="editSaving"
      @save="saveTags"
      @close="editOpen = false"
    />

    <ImageAssignModals ref="assignModals" />

    <AssignEpisodeModal
      :open="assignEpisodeOpen"
      :count="1"
      :saving="assignEpisodeSaving"
      @save="onAssignSource"
      @close="assignEpisodeOpen = false"
    />

    <LConfirm
      :open="deleteOpen"
      :title="t('selection.deleteTitle', { n: 1 }, 1)"
      :body="t('selection.deleteBody')"
      :confirm-label="t('common.delete')"
      danger
      :loading="deleting"
      @confirm="confirmDelete"
      @cancel="deleteOpen = false"
    />
  </main>
</template>

<style scoped>
.ip {
  display: flex;
  flex-direction: column;
  height: calc(100dvh - var(--topnav-h));
  background: var(--color-bg);
}
.ip__bar {
  display: flex;
  align-items: center;
  gap: 14px;
  height: 56px;
  padding: 0 22px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg);
  position: relative;
  z-index: 2;
  flex-shrink: 0;
}
.ip__crumb {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--color-muted);
  letter-spacing: 0.8px;
  min-width: 0;
  overflow: hidden;
}
.ip__crumb span {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ip__crumb-current {
  color: var(--color-text2);
}
.ip__spacer {
  flex: 1;
}
.ip__fav {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  height: 30px;
  padding: 0 12px;
  border-radius: var(--radius-m);
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text2);
  background: transparent;
  transition:
    background var(--dur-fast),
    color var(--dur-fast);
}
.ip__fav:hover:not(:disabled) {
  background: var(--color-surface2);
  color: var(--color-text);
}
.ip__fav:disabled {
  opacity: 0.6;
  cursor: default;
}
.ip__fav--on {
  color: var(--color-warn);
}
.ip__fav--on :deep(svg) {
  fill: var(--color-warn);
  filter: drop-shadow(0 0 6px color-mix(in srgb, var(--color-warn) 55%, transparent));
}
.ip__divider {
  width: 1px;
  height: 22px;
  background: var(--color-border);
  margin: 0 4px;
}
.ip > .async-state {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.ip__body {
  display: grid;
  grid-template-columns: 1fr var(--rail-w);
  flex: 1;
  min-height: 0;
}

.ip__stage {
  position: relative;
  display: grid;
  place-items: center;
  padding: 28px;
  overflow: hidden;
}
.ip__stage--skeleton {
  background: var(--color-bg2);
}
.ip__img-skeleton {
  width: min(100%, 70vh);
  height: min(70%, 60vh);
}
.ip__tags .ip__chips {
  margin-top: 12px;
}
.ip__img {
  grid-area: 1 / 1;
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  min-width: 0;
  min-height: 0;
  object-fit: contain;
  border-radius: var(--radius-m);
}
.ip__img--full {
  box-shadow: var(--shadow-modal);
  opacity: 0;
  transition: opacity 0.5s var(--ease-out);
}
.ip__img--in {
  opacity: 1;
}
.ip__img--ph {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: blur(14px);
  transition: opacity 0.25s var(--ease-out);
  /* Decorative low-res preview: never intercept the native "Copy image"
     context menu, which would otherwise copy the thumbnail. */
  pointer-events: none;
}
.ip__img--ph-hidden {
  opacity: 0;
  transition: opacity 0.4s var(--ease-out) 0.45s;
}
.ip__frame {
  position: relative;
  width: min(100%, 70vh);
  max-width: 100%;
  max-height: 100%;
  border-radius: var(--radius-m);
  overflow: hidden;
  box-shadow: var(--shadow-modal);
}
.ip__pill {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: max-content;
  max-width: calc(100% - 32px);
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 12px;
  border-radius: var(--radius-pill);
  background: var(--glass-bg);
  backdrop-filter: blur(8px);
  border: 1px solid var(--color-border);
  color: var(--color-text2);
  font-size: 11px;
  letter-spacing: 0.6px;
}
.ip__pill-sep {
  color: var(--color-mute2);
}

.ip__rail {
  background: var(--color-bg2);
  border-left: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}
.ip__source {
  padding: 22px;
  border-bottom: 1px solid var(--color-border);
}
.ip__eyebrow {
  display: block;
  font-size: 10.5px;
  color: var(--color-muted);
  letter-spacing: 1.2px;
  margin-bottom: 8px;
}
.ip__title {
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.3px;
  margin-bottom: 4px;
}
.ip__sub {
  font-size: 12.5px;
  color: var(--color-text2);
}
.ip__unassigned {
  font-size: 15px;
  font-weight: 500;
  color: var(--color-muted);
}
.ip__timecode {
  margin-top: 12px;
}
.ip__timecode .ip__eyebrow {
  margin-bottom: 4px;
}
.ip__author {
  padding: 18px 22px;
  border-bottom: 1px solid var(--color-border);
}
.ip__author-link {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  max-width: 100%;
  padding: 4px 8px 4px 4px;
  margin: -4px;
  border-radius: var(--radius-pill);
  transition: background var(--dur-fast);
}
.ip__author-link:hover {
  background: var(--color-surface2);
}
.ip__author-name {
  font-size: 13.5px;
  font-weight: 500;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ip__stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 18px;
  padding: 16px 22px;
  border-bottom: 1px solid var(--color-border);
}
.ip__stat-key {
  display: block;
  font-size: 10px;
  color: var(--color-muted);
  letter-spacing: 1px;
  margin-bottom: 2px;
}
.ip__stat-val {
  font-size: 12.5px;
  color: var(--color-text);
}
.ip__tags {
  flex: 1;
  padding: 18px 22px 22px;
}
.ip__tags-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.ip__tags-title {
  font-size: 13.5px;
  font-weight: 600;
}
.ip__edit {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11.5px;
  color: var(--color-accent-text);
  padding: 4px 8px;
  border-radius: var(--radius-s);
  border: 1px solid color-mix(in srgb, var(--color-accent) 20%, transparent);
  background: var(--color-accent-dim);
}
.ip__empty {
  padding: 20px 14px;
  text-align: center;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-m);
  color: var(--color-muted);
  font-size: 12.5px;
}
.ip__empty-add {
  color: var(--color-accent-text);
}
.ip__group {
  margin-bottom: 16px;
}
.ip__group-head {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 7px;
}
.ip__group-dot {
  width: 6px;
  height: 6px;
  border-radius: 3px;
}
.ip__group-cat {
  font-size: 10.5px;
  letter-spacing: 1px;
  text-transform: uppercase;
}
.ip__group-count {
  margin-left: auto;
  font-size: 10.5px;
  color: var(--color-muted);
}
.ip__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

@media (max-width: 768px) {
  .ip {
    height: auto;
    min-height: calc(100dvh - var(--topnav-h));
  }
  .ip__bar {
    flex-wrap: wrap;
    height: auto;
    padding: 12px 16px;
    gap: 8px;
  }
  .ip__crumb {
    order: 3;
    width: 100%;
  }
  .ip__body {
    display: flex;
    flex-direction: column;
  }
  .ip__stage {
    min-height: 50vh;
    padding: 16px;
  }
  .ip__rail {
    border-left: none;
    border-top: 1px solid var(--color-border);
  }
}
</style>
