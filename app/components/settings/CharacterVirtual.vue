<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import type { CharacterView } from '~/types/view'
import { useBreakpoint } from '~/composables/useBreakpoint'

const props = withDefaults(
  defineProps<{
    characters: CharacterView[]
    loadingMore?: boolean
    hasMore?: boolean
    selectable?: boolean
    selectedIds?: Set<string>
  }>(),
  { loadingMore: false, hasMore: false, selectable: false, selectedIds: () => new Set() },
)

const emit = defineEmits<{
  open: [character: CharacterView]
  select: [id: string, modifiers: { shift: boolean; meta: boolean }]
  loadMore: []
}>()

const GAP = 12
const CARD_H = 86
const OVERSCAN = 600

const { width: viewportW } = useBreakpoint()

const columnCount = computed(() => {
  if (viewportW.value <= 640) return 1
  if (viewportW.value <= 1024) return 2
  return 3
})

const root = ref<HTMLElement | null>(null)
const gridWidth = ref(0)
const gridTop = ref(0)
const scrollY = ref(0)
const viewportH = ref(0)

const colWidth = computed(() => {
  const cols = columnCount.value
  return cols > 0 ? (gridWidth.value - GAP * (cols - 1)) / cols : gridWidth.value
})

const rowStride = CARD_H + GAP
const rowCount = computed(() => Math.ceil(props.characters.length / columnCount.value))
const totalHeight = computed(() =>
  rowCount.value > 0 ? rowCount.value * CARD_H + (rowCount.value - 1) * GAP : 0,
)

const visible = computed(() => {
  const cols = columnCount.value
  const cw = colWidth.value
  if (cw <= 0 || !props.characters.length) {
    return [] as Array<{ character: CharacterView; x: number; y: number }>
  }
  const top = scrollY.value - gridTop.value - OVERSCAN
  const bottom = scrollY.value - gridTop.value + viewportH.value + OVERSCAN
  const firstRow = Math.max(0, Math.floor(top / rowStride))
  const lastRow = Math.min(rowCount.value - 1, Math.ceil(bottom / rowStride))
  const cells: Array<{ character: CharacterView; x: number; y: number }> = []
  for (let row = firstRow; row <= lastRow; row++) {
    for (let col = 0; col < cols; col++) {
      const index = row * cols + col
      const character = props.characters[index]
      if (!character) break
      cells.push({ character, x: col * (cw + GAP), y: row * rowStride })
    }
  }
  return cells
})

function measure(): void {
  if (!root.value) return
  const rect = root.value.getBoundingClientRect()
  gridWidth.value = root.value.clientWidth
  gridTop.value = rect.top + window.scrollY
  viewportH.value = window.innerHeight
}

function onScroll(): void {
  scrollY.value = window.scrollY
  if (!props.hasMore || props.loadingMore) return
  const gridBottom = gridTop.value + totalHeight.value
  const remaining = gridBottom - (window.scrollY + window.innerHeight)
  if (remaining < window.innerHeight * 1.2) emit('loadMore')
}

let ro: ResizeObserver | null = null

watch(rowCount, () => nextTick(measure))

onMounted(() => {
  measure()
  scrollY.value = window.scrollY
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', measure, { passive: true })
  if (root.value) {
    ro = new ResizeObserver(() => measure())
    ro.observe(root.value)
  }
})
onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', measure)
  ro?.disconnect()
})
</script>

<template>
  <div ref="root" class="cvgrid" :style="{ height: `${totalHeight}px` }">
    <div
      v-for="cell in visible"
      :key="cell.character.id"
      class="cvgrid__cell"
      :style="{
        transform: `translate(${cell.x}px, ${cell.y}px)`,
        width: `${colWidth}px`,
        height: `${CARD_H}px`,
      }"
    >
      <CharacterCard
        :character="cell.character"
        :selectable="selectable"
        :selected="selectedIds.has(cell.character.id)"
        @open="emit('open', cell.character)"
        @select="(id, mods) => emit('select', id, mods)"
      />
    </div>
  </div>
</template>

<style scoped>
.cvgrid {
  position: relative;
  width: 100%;
}
.cvgrid__cell {
  position: absolute;
  top: 0;
  left: 0;
  will-change: transform;
}
.cvgrid__cell :deep(.char-card) {
  height: 100%;
}
</style>
