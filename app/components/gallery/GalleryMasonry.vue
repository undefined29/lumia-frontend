<script setup lang="ts">
import { computed } from 'vue'
import type { ImageView } from '~/types/view'
import type { GalleryDensity } from '~/components/gallery/GalleryHeader.vue'
import { balanceColumns } from '~/utils/masonry'
import { useBreakpoint } from '~/composables/useBreakpoint'

const props = withDefaults(
  defineProps<{
    images: ImageView[]
    density?: GalleryDensity
    selectable?: boolean
    selectedIds?: Set<string>
  }>(),
  { density: 'comfortable', selectable: false, selectedIds: () => new Set() },
)

const emit = defineEmits<{
  select: [id: string, modifiers: { shift: boolean; meta: boolean }]
}>()

const { isMobile, isTablet } = useBreakpoint()

const columnCount = computed(() => {
  if (isMobile.value) return 1
  if (isTablet.value) return 2
  return props.density === 'compact' ? 5 : 3
})

const columns = computed(() => balanceColumns(props.images, columnCount.value))
</script>

<template>
  <div class="masonry">
    <div v-for="(col, i) in columns" :key="i" class="masonry__col">
      <GalleryCard
        v-for="image in col"
        :key="image.id"
        v-reveal
        :image="image"
        :selectable="selectable"
        :selected="selectedIds.has(image.id)"
        @select="(id, mods) => emit('select', id, mods)"
      />
    </div>
  </div>
</template>

<style scoped>
.masonry {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.masonry__col {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
