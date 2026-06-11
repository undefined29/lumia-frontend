<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ImageSortType, ImageSortDirection } from '~/types/image'
import { useUpload } from '~/composables/useUpload'
import { formatCount } from '~/utils/format'

export type GalleryView = 'masonry' | 'uniform'
export type GalleryDensity = 'comfortable' | 'compact'

const props = defineProps<{
  count: number
  view: GalleryView
  density: GalleryDensity
  sortType: ImageSortType
  sortDirection: ImageSortDirection
}>()
const emit = defineEmits<{
  'update:view': [GalleryView]
  'update:density': [GalleryDensity]
  'update:sortType': [ImageSortType]
  'update:sortDirection': [ImageSortDirection]
  toggleSidebar: []
  refresh: []
}>()

const { t, locale } = useI18n()
const { isMobile } = useBreakpoint()
const { pickFiles } = useUpload()
const { canUpload } = usePermissions()

const countLabel = computed(() =>
  t('gallery.imagesCount', { n: formatCount(props.count, locale.value) }, props.count),
)

function setView(view: GalleryView): void {
  emit('update:view', view)
}
function cycleDensity(): void {
  emit('update:density', props.density === 'comfortable' ? 'compact' : 'comfortable')
}

const refreshSpin = ref(false)
function onRefresh(): void {
  emit('refresh')
  refreshSpin.value = true
  window.setTimeout(() => {
    refreshSpin.value = false
  }, 600)
}

interface SortOption {
  key: string
  type: ImageSortType
  direction: ImageSortDirection
}
const SORT_OPTIONS: SortOption[] = [
  { key: 'newest', type: 'createdAt', direction: 'desc' },
  { key: 'oldest', type: 'createdAt', direction: 'asc' },
  { key: 'timecodeDesc', type: 'timestampSeconds', direction: 'desc' },
  { key: 'timecodeAsc', type: 'timestampSeconds', direction: 'asc' },
]
const activeSortKey = computed(
  () =>
    SORT_OPTIONS.find((o) => o.type === props.sortType && o.direction === props.sortDirection)
      ?.key ?? 'newest',
)
function selectSort(option: SortOption, close: () => void): void {
  emit('update:sortType', option.type)
  emit('update:sortDirection', option.direction)
  close()
}
</script>

<template>
  <header class="ghead">
    <button
      v-if="isMobile"
      type="button"
      class="ghead__filter-btn"
      :aria-label="t('gallery.filters')"
      @click="emit('toggleSidebar')"
    >
      <LIcon name="filter" :size="18" />
    </button>

    <div class="ghead__titles">
      <h1 class="ghead__title">{{ t('gallery.title') }}</h1>
      <p class="ghead__sub mono">{{ countLabel }}</p>
    </div>

    <span class="ghead__spacer" />

    <LDropdown align="right">
      <template #trigger="{ open, toggle }">
        <button
          type="button"
          class="ghead__sort"
          :class="{ 'ghead__sort--open': open }"
          :aria-label="t('gallery.sortLabel')"
          @click="toggle"
        >
          <LIcon name="sort" :size="15" class="ghead__sort-icn" />
          <span v-if="!isMobile" class="ghead__sort-label">{{
            t(`gallery.sort_${activeSortKey}`)
          }}</span>
          <LIcon name="chev" :size="13" class="ghead__sort-chev" />
        </button>
      </template>
      <template #menu="{ close }">
        <button
          v-for="option in SORT_OPTIONS"
          :key="option.key"
          type="button"
          class="ghead__sort-item"
          :class="{ 'ghead__sort-item--active': option.key === activeSortKey }"
          @click="selectSort(option, close)"
        >
          {{ t(`gallery.sort_${option.key}`) }}
        </button>
      </template>
    </LDropdown>

    <div class="ghead__toggle" role="group" :aria-label="t('gallery.view')">
      <button
        type="button"
        class="ghead__toggle-btn"
        :class="{ 'ghead__toggle-btn--active': view === 'masonry' }"
        :aria-pressed="view === 'masonry'"
        :aria-label="t('gallery.viewMasonry')"
        @click="setView('masonry')"
      >
        <LIcon name="grid" :size="14" />
      </button>
      <button
        type="button"
        class="ghead__toggle-btn"
        :class="{ 'ghead__toggle-btn--active': view === 'uniform' }"
        :aria-pressed="view === 'uniform'"
        :aria-label="t('gallery.viewUniform')"
        @click="setView('uniform')"
      >
        <LIcon name="picture" :size="14" />
      </button>
    </div>

    <LButton
      variant="ghost"
      size="md"
      icon="refresh"
      class="ghead__refresh"
      :class="{ 'ghead__refresh--spin': refreshSpin }"
      :aria-label="t('gallery.refresh')"
      @click="onRefresh"
    />

    <LButton
      variant="ghost"
      size="md"
      icon="sliders"
      :aria-label="t('gallery.density')"
      @click="cycleDensity"
    >
      <span v-if="!isMobile">{{ t('gallery.density') }}</span>
    </LButton>

    <GalleryImageSearch />

    <LButton v-if="canUpload" variant="primary" size="md" icon="upload" @click="pickFiles">
      <span v-if="!isMobile">{{ t('nav.upload') }}</span>
    </LButton>
  </header>
</template>

<style scoped>
.ghead {
  display: flex;
  align-items: center;
  gap: 16px;
  height: 60px;
  padding: 0 24px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg);
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
}
.ghead__filter-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: var(--radius-m);
  color: var(--color-text2);
  flex-shrink: 0;
}
.ghead__filter-btn:hover {
  background: var(--color-surface2);
}
.ghead__titles {
  min-width: 0;
}
.ghead__title {
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.3px;
  margin: 0;
}
.ghead__sub {
  font-size: 10.5px;
  color: var(--color-muted);
  letter-spacing: 0.8px;
  margin: 1px 0 0;
}
.ghead__spacer {
  flex: 1;
}
.ghead__toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  background: var(--color-surface2);
  border-radius: var(--radius-m);
  border: 1px solid var(--color-border);
}
.ghead__toggle-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 5px 9px;
  border-radius: var(--radius-s);
  color: var(--color-muted);
  transition:
    background var(--dur-fast),
    color var(--dur-fast);
}
.ghead__toggle-btn--active {
  background: var(--color-surface3);
  color: var(--color-text);
}

.ghead__sort {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 38px;
  padding: 0 12px;
  border-radius: var(--radius-m);
  color: var(--color-text2);
  background: transparent;
  border: 1px solid var(--color-border);
  font-size: 13px;
  font-weight: 500;
  transition:
    background var(--dur-fast),
    border-color var(--dur-fast),
    color var(--dur-fast);
}
.ghead__sort:hover,
.ghead__sort--open {
  background: var(--color-surface2);
  color: var(--color-text);
  border-color: var(--color-border-hi);
}
.ghead__sort-icn,
.ghead__sort-chev {
  color: var(--color-muted);
  flex-shrink: 0;
}
.ghead__sort-label {
  white-space: nowrap;
}
.ghead__sort-item {
  display: block;
  width: 100%;
  text-align: left;
  padding: 8px 10px;
  border-radius: var(--radius-s);
  font-size: 13px;
  color: var(--color-text2);
  white-space: nowrap;
}
.ghead__sort-item:hover {
  background: var(--color-surface2);
  color: var(--color-text);
}
.ghead__sort-item--active {
  background: var(--color-surface2);
  color: var(--color-accent-text);
}

.ghead__refresh--spin :deep(svg) {
  animation: ghead-refresh-spin 0.6s var(--ease-out);
}
@keyframes ghead-refresh-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .ghead {
    gap: 8px;
    padding: 0 14px;
  }
  .ghead__title {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .ghead__sub {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
