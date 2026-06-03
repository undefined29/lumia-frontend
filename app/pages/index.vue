<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, defineAsyncComponent } from 'vue'
import { useInfiniteList } from '~/composables/useInfiniteList'
import { useBreakpoint } from '~/composables/useBreakpoint'
import { useGallerySelection } from '~/composables/useGallerySelection'
import type { GalleryFilters, SelectedTag } from '~/types/gallery-filters'
import { emptyFilters } from '~/types/gallery-filters'
import type { GalleryView, GalleryDensity } from '~/components/gallery/GalleryHeader.vue'
import type {
  GalleryQuery,
  ImageResponseDto,
  PatchTagAdd,
  ImageSortType,
  ImageSortDirection,
} from '~/types/image'
import type { ImageView, TagView } from '~/types/view'

const GalleryVirtual = defineAsyncComponent(() => import('~/components/gallery/GalleryVirtual.vue'))
const PAGE_SIZE = 60

const BatchTagsModal = defineAsyncComponent(() => import('~/components/gallery/BatchTagsModal.vue'))
const AssignEpisodeModal = defineAsyncComponent(
  () => import('~/components/gallery/AssignEpisodeModal.vue'),
)

const { t } = useI18n()
const { api } = useApi()
const { toImageView } = useAdapters()
const { isMobile } = useBreakpoint()
const route = useRoute()
const selection = useGallerySelection()

useSeoMeta({
  title: () => t('seo.galleryTitle'),
  description: () => t('seo.galleryDescription'),
})

function queryString(value: unknown): string | null {
  return typeof value === 'string' && value.length ? value : null
}
function queryList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean)
  if (typeof value === 'string' && value.length) return value.split(',').filter(Boolean)
  return []
}
function filtersFromQuery(): GalleryFilters {
  const base = emptyFilters()
  const q = route.query
  const tagFromName =
    (exclude: boolean) =>
    (name: string): SelectedTag => ({ name, category: 'general', exclude })
  base.tags = [
    ...queryList(q.tags).map(tagFromName(false)),
    ...queryList(q.excludeTags).map(tagFromName(true)),
  ]
  base.seriesId = queryString(q.seriesId)
  base.seriesTitle = queryString(q.seriesTitle)
  base.seasonId = queryString(q.seasonId)
  base.seasonLabel = queryString(q.seasonLabel)
  base.episodeId = queryString(q.episodeId)
  base.episodeLabel = queryString(q.episodeLabel)
  base.characterTag = queryString(q.characterTag)
  base.characterLabel = queryString(q.characterLabel)
  base.authorId = queryString(q.authorId)
  base.authorLabel = queryString(q.authorLabel)
  base.withoutEpisodeLink = q.withoutEpisodeLink === 'true'
  base.onlyFavorites = q.onlyFavorites === 'true'
  return base
}

const filters = ref<GalleryFilters>(filtersFromQuery())
const view = ref<GalleryView>('masonry')
const density = ref<GalleryDensity>('comfortable')
function parseSortType(value: unknown): ImageSortType {
  return value === 'timestampSeconds' ? 'timestampSeconds' : 'createdAt'
}
function parseSortDirection(value: unknown): ImageSortDirection {
  return value === 'asc' ? 'asc' : 'desc'
}
const sortType = ref<ImageSortType>(parseSortType(route.query.sortType))
const sortDirection = ref<ImageSortDirection>(parseSortDirection(route.query.sortDirection))
const drawerOpen = ref(false)

const router = useRouter()
function filtersToQuery(f: GalleryFilters): Record<string, string | string[]> {
  const q: Record<string, string | string[]> = {}
  const include = f.tags.filter((tg) => !tg.exclude).map((tg) => tg.name)
  const exclude = f.tags.filter((tg) => tg.exclude).map((tg) => tg.name)
  if (include.length) q.tags = include
  if (exclude.length) q.excludeTags = exclude
  if (f.characterTag) q.characterTag = f.characterTag
  if (f.characterLabel) q.characterLabel = f.characterLabel
  if (f.authorId) q.authorId = f.authorId
  if (f.authorLabel) q.authorLabel = f.authorLabel
  if (f.seriesId) q.seriesId = f.seriesId
  if (f.seriesTitle) q.seriesTitle = f.seriesTitle
  if (f.seasonId) q.seasonId = f.seasonId
  if (f.seasonLabel) q.seasonLabel = f.seasonLabel
  if (f.episodeId) q.episodeId = f.episodeId
  if (f.episodeLabel) q.episodeLabel = f.episodeLabel
  if (f.withoutEpisodeLink) q.withoutEpisodeLink = 'true'
  if (f.onlyFavorites) q.onlyFavorites = 'true'
  return q
}
function buildUrlQuery(): Record<string, string | string[]> {
  const q = filtersToQuery(filters.value)
  if (sortType.value !== 'createdAt') q.sortType = sortType.value
  if (sortDirection.value !== 'desc') q.sortDirection = sortDirection.value
  return q
}
watch(
  [filters, sortType, sortDirection],
  () => {
    void router.replace({ query: buildUrlQuery() }).catch(() => {})
  },
  { deep: true },
)

const skeletonHeights = [220, 300, 180, 260, 200, 340, 240, 190, 280, 210, 320, 230]

const query = computed<GalleryQuery>(() => {
  const f = filters.value
  const include = [
    ...f.tags.filter((tag) => !tag.exclude).map((tag) => tag.name),
    ...(f.characterTag ? [f.characterTag] : []),
  ]
  const exclude = f.tags.filter((tag) => tag.exclude).map((tag) => tag.name)
  const q: GalleryQuery = {}
  if (include.length) q.tags = include
  if (exclude.length) q.excludeTags = exclude
  if (f.authorId) q.authorId = f.authorId
  if (f.seriesId) q.seriesId = f.seriesId
  if (f.seasonId) q.seasonId = f.seasonId
  if (f.episodeId) q.episodeId = f.episodeId
  if (f.withoutEpisodeLink) q.withoutEpisodeLink = true
  if (f.onlyFavorites) q.onlyFavorites = true
  q.sortType = sortType.value
  q.sortDirection = sortDirection.value
  return q
})

const list = useInfiniteList<ImageResponseDto>({
  limit: PAGE_SIZE,
  getId: (img) => img.id,
  fetchPage: async ({ lastSeenId, limit }) => {
    const res = await api.gallery({
      ...query.value,
      limit,
      ...(lastSeenId ? { lastSeenId } : {}),
    })
    return { items: res.images, total: res.afterFilter }
  },
  watch: [query],
})

const totalImages = ref(0)
async function refreshTotalImages(): Promise<void> {
  try {
    const { total } = await api.galleryTotal()
    totalImages.value = total
  } catch {}
}

const { completedTick } = useUpload()
watch(completedTick, () => {
  void list.refresh()
  void refreshTotalImages()
})
onMounted(() => void refreshTotalImages())

function onRefresh(): void {
  void list.refresh()
  void refreshTotalImages()
}

const images = computed<ImageView[]>(() => list.items.value.map((img) => toImageView(img)))
const resultCount = computed(() => list.total.value || images.value.length)
const headerCount = computed(() => totalImages.value || resultCount.value)
const orderedIds = computed(() => images.value.map((img) => img.id))

function closeDrawer(): void {
  drawerOpen.value = false
}

watch(orderedIds, (ids) => selection.prune(ids))

function onSelect(id: string, mods: { shift: boolean; meta: boolean }): void {
  if (mods.shift) selection.selectRange(id, orderedIds.value)
  else selection.toggle(id)
}

function onSelectAll(): void {
  selection.selectAll(orderedIds.value)
}

function onKeydown(e: KeyboardEvent): void {
  if (
    e.key === 'Escape' &&
    selection.count.value > 0 &&
    !batchTagsOpen.value &&
    !assignEpisodeOpen.value
  ) {
    selection.clear()
  }
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  selection.clear()
})

const bodyRef = ref<HTMLElement | null>(null)
const marquee = ref<{ x: number; y: number; w: number; h: number } | null>(null)
let dragStart: { x: number; y: number; additive: boolean; baseline: Set<string> } | null = null
const DRAG_THRESHOLD = 6

function onBodyPointerDown(e: PointerEvent): void {
  if (e.button !== 0) return
  const target = e.target as HTMLElement
  if (target.closest('.gcard') || target.closest('button') || target.closest('a')) return
  const host = bodyRef.value
  if (!host) return
  dragStart = {
    x: e.clientX,
    y: e.clientY,
    additive: e.metaKey || e.ctrlKey || e.shiftKey,
    baseline: new Set(selection.selected.value),
  }
}

function onBodyPointerMove(e: PointerEvent): void {
  if (!dragStart) return
  const dx = e.clientX - dragStart.x
  const dy = e.clientY - dragStart.y
  if (!marquee.value && Math.hypot(dx, dy) < DRAG_THRESHOLD) return
  const host = bodyRef.value
  if (!host) return
  const hostRect = host.getBoundingClientRect()
  const left = Math.min(dragStart.x, e.clientX)
  const top = Math.min(dragStart.y, e.clientY)
  const right = Math.max(dragStart.x, e.clientX)
  const bottom = Math.max(dragStart.y, e.clientY)
  marquee.value = {
    x: left - hostRect.left + host.scrollLeft,
    y: top - hostRect.top + host.scrollTop,
    w: right - left,
    h: bottom - top,
  }
  const hits: string[] = []
  host.querySelectorAll<HTMLElement>('.gcard[data-image-id]').forEach((el) => {
    const r = el.getBoundingClientRect()
    const intersects = r.left < right && r.right > left && r.top < bottom && r.bottom > top
    if (intersects) hits.push(el.dataset.imageId!)
  })
  const next = new Set(dragStart.additive ? dragStart.baseline : [])
  for (const id of hits) next.add(id)
  selection.setSelection([...next])
}

function endDrag(): void {
  dragStart = null
  marquee.value = null
}
function onBodyPointerUp(): void {
  endDrag()
}

const SCROLL_TOP_THRESHOLD = 600
const showToTop = ref(false)
const reducedMotion = useReducedMotion()

function onBodyScroll(): void {
  const el = bodyRef.value
  if (el) showToTop.value = el.scrollTop > SCROLL_TOP_THRESHOLD
}

function scrollToTop(): void {
  bodyRef.value?.scrollTo({ top: 0, behavior: reducedMotion.value ? 'auto' : 'smooth' })
}

const batchTagsOpen = ref(false)
const assignEpisodeOpen = ref(false)
const batchSaving = ref(false)

const selectedIdList = computed(() => [...selection.selected.value])

const selectedImages = computed<ImageView[]>(() =>
  images.value.filter((img) => selection.selected.value.has(img.id)),
)

const commonSelectedTags = computed<TagView[]>(() => {
  const [first, ...rest] = selectedImages.value
  if (!first) return []
  return first.tags.filter((tag) =>
    rest.every((img) => img.tags.some((other) => other.name === tag.name)),
  )
})

async function onBatchTags(payload: { add: PatchTagAdd[]; remove: string[] }): Promise<void> {
  if (!payload.add.length && !payload.remove.length) {
    batchTagsOpen.value = false
    return
  }
  batchSaving.value = true
  try {
    await Promise.allSettled(selectedIdList.value.map((id) => api.patchImageTags(id, payload)))
    await list.refresh()
    batchTagsOpen.value = false
    selection.clear()
  } finally {
    batchSaving.value = false
  }
}

async function onAssignEpisode(payload: { episodeId: string }): Promise<void> {
  batchSaving.value = true
  try {
    await Promise.allSettled(
      selectedIdList.value.map((id) =>
        api.updateImage(id, { episodeId: payload.episodeId, sourceType: 'screenshot' }),
      ),
    )
    await list.refresh()
    assignEpisodeOpen.value = false
    selection.clear()
  } finally {
    batchSaving.value = false
  }
}

async function onToggleFavorite(id: string, next: boolean): Promise<void> {
  const items = list.items.value
  const target = items.find((img) => img.id === id)
  if (!target) return
  const prev = target.favorite ?? false
  list.items.value = items.map((img) => (img.id === id ? { ...img, favorite: next } : img))
  try {
    await api.setFavorite(id, next)
  } catch {
    list.items.value = list.items.value.map((img) =>
      img.id === id ? { ...img, favorite: prev } : img,
    )
  }
}

const { canManageAnime } = usePermissions()
const assignModals = ref<{
  openSetAvatar: (image: ImageView) => void
  openSetCover: (image: ImageView) => void
} | null>(null)
const ctxMenu = ref<{ open: boolean; x: number; y: number; image: ImageView | null }>({
  open: false,
  x: 0,
  y: 0,
  image: null,
})

function onContextMenu(id: string, pos: { x: number; y: number }): void {
  const image = images.value.find((img) => img.id === id) ?? null
  if (!image) return
  ctxMenu.value = { open: true, x: pos.x, y: pos.y, image }
}
function closeCtxMenu(): void {
  ctxMenu.value = { ...ctxMenu.value, open: false }
}
function ctxSetAvatar(): void {
  if (ctxMenu.value.image) assignModals.value?.openSetAvatar(ctxMenu.value.image)
  closeCtxMenu()
}
function ctxSetCover(): void {
  if (ctxMenu.value.image) assignModals.value?.openSetCover(ctxMenu.value.image)
  closeCtxMenu()
}

const deleteIds = ref<string[]>([])
const deleteConfirmOpen = ref(false)
const deleting = ref(false)

function askDeleteSelected(): void {
  deleteIds.value = [...selection.selected.value]
  if (deleteIds.value.length) deleteConfirmOpen.value = true
}
function ctxDelete(): void {
  if (ctxMenu.value.image) {
    deleteIds.value = [ctxMenu.value.image.id]
    deleteConfirmOpen.value = true
  }
  closeCtxMenu()
}
async function confirmDelete(): Promise<void> {
  const ids = deleteIds.value
  if (!ids.length) return
  deleting.value = true
  try {
    const results = await Promise.allSettled(ids.map((id) => api.deleteImage(id)))
    const deleted = new Set(ids.filter((_, i) => results[i]!.status === 'fulfilled'))
    list.items.value = list.items.value.filter((img) => !deleted.has(img.id))
    selection.clear()
    deleteConfirmOpen.value = false
    void refreshTotalImages()
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div class="gallery">
    <GallerySidebar v-if="!isMobile" v-model="filters" class="gallery__sidebar" />

    <Transition v-else name="fade">
      <div v-if="drawerOpen" class="gallery__drawer" @click.self="closeDrawer">
        <GallerySidebar v-model="filters" class="gallery__drawer-panel" />
      </div>
    </Transition>

    <div class="gallery__main">
      <GalleryHeader
        v-model:view="view"
        v-model:density="density"
        v-model:sort-type="sortType"
        v-model:sort-direction="sortDirection"
        :count="headerCount"
        @toggle-sidebar="drawerOpen = !drawerOpen"
        @refresh="onRefresh"
      />

      <div
        ref="bodyRef"
        class="gallery__body"
        :class="[`gallery__body--${density}`, { 'gallery__body--selecting': marquee }]"
        @scroll.passive="onBodyScroll"
        @pointerdown="onBodyPointerDown"
        @pointermove="onBodyPointerMove"
        @pointerup="onBodyPointerUp"
        @pointerleave="onBodyPointerUp"
      >
        <FilterStrip v-model="filters" :count="resultCount" />

        <LAsyncState :status="list.status.value" :error="list.error.value" @retry="list.retry()">
          <template #loading>
            <div class="gallery__skeleton">
              <LSkeleton
                v-for="(h, n) in skeletonHeights"
                :key="n"
                :height="`${h}px`"
                radius="var(--radius-m)"
                class="gallery__skeleton-item"
              />
            </div>
          </template>

          <template #empty>
            <div class="gallery__empty">
              <p class="gallery__empty-text">{{ t('gallery.empty') }}</p>
              <LButton variant="secondary" size="sm" @click="filters = emptyFilters()">
                {{ t('gallery.clearFilters') }}
              </LButton>
            </div>
          </template>

          <GalleryVirtual
            :images="images"
            :view="view"
            :density="density"
            :selectable="selection.active.value"
            :selected-ids="selection.selected.value"
            :scroll-el="bodyRef"
            :loading-more="list.loadingMore.value"
            :has-more="list.hasMore.value"
            :context-enabled="canManageAnime"
            @select="onSelect"
            @contextmenu="onContextMenu"
            @load-more="list.loadMore()"
            @favorite="onToggleFavorite"
          />

          <div v-if="list.loadingMore.value" class="gallery__more" role="status">
            <LSpinner :size="20" />
          </div>
        </LAsyncState>

        <div
          v-if="marquee"
          class="gallery__marquee"
          :style="{
            left: `${marquee.x}px`,
            top: `${marquee.y}px`,
            width: `${marquee.w}px`,
            height: `${marquee.h}px`,
          }"
        />
      </div>

      <GallerySelectionBar
        :count="selection.count.value"
        :total="images.length"
        @select-all="onSelectAll"
        @clear="selection.clear()"
        @assign-tags="batchTagsOpen = true"
        @assign-episode="assignEpisodeOpen = true"
        @delete="askDeleteSelected"
      />

      <LContextMenu :open="ctxMenu.open" :x="ctxMenu.x" :y="ctxMenu.y" @close="closeCtxMenu">
        <LMenuItem icon="user" @select="ctxSetAvatar">{{ t('selection.setAvatar') }}</LMenuItem>
        <LMenuItem icon="picture" @select="ctxSetCover">{{ t('selection.setCover') }}</LMenuItem>
        <LMenuItem icon="trash" @select="ctxDelete">{{ t('selection.delete') }}</LMenuItem>
      </LContextMenu>

      <Transition name="fade">
        <button
          v-if="showToTop"
          type="button"
          class="gallery__totop"
          :aria-label="t('gallery.scrollTop')"
          :title="t('gallery.scrollTop')"
          @click="scrollToTop"
        >
          <LIcon name="chev" :size="20" :stroke="2" class="gallery__totop-icn" />
        </button>
      </Transition>
    </div>

    <BatchTagsModal
      :open="batchTagsOpen"
      :count="selection.count.value"
      :common-tags="commonSelectedTags"
      :saving="batchSaving"
      @save="onBatchTags"
      @close="batchTagsOpen = false"
    />
    <AssignEpisodeModal
      :open="assignEpisodeOpen"
      :count="selection.count.value"
      :saving="batchSaving"
      @save="onAssignEpisode"
      @close="assignEpisodeOpen = false"
    />
    <ImageAssignModals ref="assignModals" />

    <LConfirm
      :open="deleteConfirmOpen"
      :title="t('selection.deleteTitle', { n: deleteIds.length }, deleteIds.length)"
      :body="t('selection.deleteBody')"
      :confirm-label="t('common.delete')"
      danger
      :loading="deleting"
      @confirm="confirmDelete"
      @cancel="deleteConfirmOpen = false"
    />
  </div>
</template>

<style scoped>
.gallery {
  display: flex;
  height: calc(100dvh - var(--topnav-h));
}
.gallery__sidebar {
  height: 100%;
}
.gallery__drawer {
  position: fixed;
  inset: var(--topnav-h) 0 0;
  z-index: var(--z-overlay);
  background: var(--scrim);
}
.gallery__drawer-panel {
  height: 100%;
  box-shadow: var(--shadow-modal);
}
.gallery__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  position: relative;
}
.gallery__body {
  position: relative;
  flex: 1;
  overflow: auto;
  padding: 22px;
}
.gallery__body--compact {
  padding: 12px;
}
.gallery__body--selecting {
  user-select: none;
}
.gallery__marquee {
  position: absolute;
  z-index: var(--z-sticky);
  border: 1px solid var(--color-accent);
  background: var(--color-accent-dim);
  border-radius: var(--radius-s);
  pointer-events: none;
}
.gallery__more {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 0;
}
.gallery__totop {
  position: absolute;
  right: 22px;
  bottom: 22px;
  z-index: var(--z-sticky);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: var(--radius-pill);
  background: var(--glass-bg);
  backdrop-filter: blur(8px);
  border: 1px solid var(--color-border-hi);
  color: var(--color-text);
  box-shadow: var(--shadow-card);
  transition:
    background var(--dur-fast),
    transform var(--dur-fast) var(--ease-out);
}
.gallery__totop:hover {
  background: var(--color-surface3);
  transform: translateY(-2px);
}
.gallery__totop-icn {
  transform: rotate(180deg);
}
.gallery__skeleton {
  column-count: 3;
  column-gap: 12px;
}
.gallery__skeleton-item {
  break-inside: avoid;
  margin-bottom: 12px;
}
@media (max-width: 1024px) {
  .gallery__skeleton {
    column-count: 2;
  }
}
@media (max-width: 768px) {
  .gallery__skeleton {
    column-count: 1;
  }
}
.gallery__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  padding: 60px 20px;
  text-align: center;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-m);
}
.gallery__empty-text {
  font-size: 14px;
  color: var(--color-muted);
  margin: 0;
}
</style>
