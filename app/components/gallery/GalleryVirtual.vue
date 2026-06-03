<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import type { ImageView } from '~/types/view'
import type { GalleryView, GalleryDensity } from '~/components/gallery/GalleryHeader.vue'
import { useBreakpoint } from '~/composables/useBreakpoint'

const props = withDefaults(
  defineProps<{
    images: ImageView[]
    view: GalleryView
    density?: GalleryDensity
    selectable?: boolean
    selectedIds?: Set<string>
    scrollEl?: HTMLElement | null
    loadingMore?: boolean
    hasMore?: boolean
    contextEnabled?: boolean
  }>(),
  {
    density: 'comfortable',
    selectable: false,
    selectedIds: () => new Set(),
    scrollEl: null,
    loadingMore: false,
    hasMore: false,
    contextEnabled: false,
  },
)

const emit = defineEmits<{
  select: [id: string, modifiers: { shift: boolean; meta: boolean }]
  contextmenu: [id: string, position: { x: number; y: number }]
  loadMore: []
  favorite: [id: string, next: boolean]
}>()

const GAP = 12
const OVERSCAN = 600
const COL_EPSILON = 1

const { isMobile, isTablet } = useBreakpoint()

const root = ref<HTMLElement | null>(null)
const width = ref(0)
const scrollTop = ref(0)
const viewportH = ref(0)
const offsetTop = ref(0)

const columnCount = computed(() => {
  if (isMobile.value) return 1
  if (isTablet.value) return 2
  if (props.view === 'uniform') {
    const min = props.density === 'compact' ? 180 : 260
    return Math.max(1, Math.floor((width.value + GAP) / (min + GAP)))
  }
  return props.density === 'compact' ? 5 : 3
})

const colWidth = computed(() => {
  const cols = columnCount.value
  return cols > 0 ? (width.value - GAP * (cols - 1)) / cols : width.value
})

const layout = computed(() => {
  const cols = columnCount.value
  const cw = colWidth.value
  if (cw <= 0)
    return { items: [] as Array<{ image: ImageView; x: number; y: number; h: number }>, height: 0 }
  const heights = new Array(cols).fill(0)
  const items = props.images.map((image) => {
    let shortest = 0
    for (let i = 1; i < cols; i++) if (heights[i] < heights[shortest] - COL_EPSILON) shortest = i
    const ratio = props.view === 'uniform' ? 1 : image.aspectRatio > 0 ? image.aspectRatio : 1
    const h = cw / ratio
    const x = shortest * (cw + GAP)
    const y = heights[shortest]
    heights[shortest] = y + h + GAP
    return { image, x, y, h }
  })
  return { items, height: Math.max(0, ...heights) - GAP }
})

const visible = computed(() => {
  const top = scrollTop.value - offsetTop.value - OVERSCAN
  const bottom = scrollTop.value - offsetTop.value + viewportH.value + OVERSCAN
  return layout.value.items.filter((it) => it.y + it.h >= top && it.y <= bottom)
})

const REVEAL_STAGGER_MS = 35
const REVEAL_MAX_STEPS = 14
const revealed = ref<Set<string>>(new Set())
const revealDelays = ref<Map<string, number>>(new Map())

watch(
  visible,
  (items) => {
    const fresh = items.filter((it) => !revealed.value.has(it.image.id))
    if (!fresh.length) return
    const delays = new Map(revealDelays.value)
    fresh.forEach((it, i) => {
      delays.set(it.image.id, Math.min(i, REVEAL_MAX_STEPS) * REVEAL_STAGGER_MS)
    })
    revealDelays.value = delays
    const ids = fresh.map((it) => it.image.id)
    window.setTimeout(() => {
      const next = new Set(revealed.value)
      for (const id of ids) next.add(id)
      revealed.value = next
    }, 600)
  },
  { immediate: true },
)

function isRevealing(id: string): boolean {
  return !revealed.value.has(id)
}
function revealDelay(id: string): string {
  return `${revealDelays.value.get(id) ?? 0}ms`
}

function measure(): void {
  if (root.value) width.value = root.value.clientWidth
  const sc = props.scrollEl
  if (sc && root.value) {
    viewportH.value = sc.clientHeight
    offsetTop.value = root.value.offsetTop
  }
}

function onScroll(): void {
  const sc = props.scrollEl
  if (!sc) return
  scrollTop.value = sc.scrollTop
  if (props.hasMore && !props.loadingMore) {
    const remaining = sc.scrollHeight - (sc.scrollTop + sc.clientHeight)
    if (remaining < sc.clientHeight * 1.5) emit('loadMore')
  }
}

let ro: ResizeObserver | null = null

function attachScroll(el: HTMLElement | null): void {
  el?.addEventListener('scroll', onScroll, { passive: true })
}
function detachScroll(el: HTMLElement | null): void {
  el?.removeEventListener('scroll', onScroll)
}

watch(
  () => props.scrollEl,
  (el, prev) => {
    detachScroll(prev ?? null)
    attachScroll(el ?? null)
    nextTick(measure)
  },
)

watch([() => props.view, () => props.density, () => props.images.length], () => nextTick(measure))

onMounted(() => {
  measure()
  attachScroll(props.scrollEl ?? null)
  if (root.value) {
    ro = new ResizeObserver(() => measure())
    ro.observe(root.value)
  }
})
onUnmounted(() => {
  detachScroll(props.scrollEl ?? null)
  ro?.disconnect()
})
</script>

<template>
  <div ref="root" class="vgrid" :style="{ height: `${layout.height}px` }">
    <div
      v-for="it in visible"
      :key="it.image.id"
      class="vgrid__cell"
      :style="{
        transform: `translate(${it.x}px, ${it.y}px)`,
        width: `${colWidth}px`,
        height: `${it.h}px`,
      }"
    >
      <GalleryCard
        :image="it.image"
        :uniform="view === 'uniform'"
        :selectable="selectable"
        :context-enabled="contextEnabled"
        :selected="selectedIds.has(it.image.id)"
        :class="{ reveal: isRevealing(it.image.id) }"
        :style="{ '--reveal-delay': revealDelay(it.image.id) }"
        @select="(id, mods) => emit('select', id, mods)"
        @contextmenu="(id, pos) => emit('contextmenu', id, pos)"
        @favorite="(id, next) => emit('favorite', id, next)"
      />
    </div>
  </div>
</template>

<style scoped>
.vgrid {
  position: relative;
  width: 100%;
}
.vgrid__cell {
  position: absolute;
  top: 0;
  left: 0;
  will-change: transform;
}
.vgrid__cell :deep(.gcard) {
  width: 100%;
  height: 100%;
}
</style>
