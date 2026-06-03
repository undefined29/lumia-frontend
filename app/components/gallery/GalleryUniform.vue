<script setup lang="ts">
import { computed } from 'vue'
import type { ImageView } from '~/types/view'
import type { GalleryDensity } from '~/components/gallery/GalleryHeader.vue'

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

const minTile = computed(() => (props.density === 'compact' ? '180px' : '260px'))
</script>

<template>
  <div class="uniform" :style="{ '--min-tile': minTile }">
    <GalleryCard
      v-for="image in images"
      :key="image.id"
      v-reveal
      :image="image"
      uniform
      :selectable="selectable"
      :selected="selectedIds.has(image.id)"
      @select="(id, mods) => emit('select', id, mods)"
    />
  </div>
</template>

<style scoped>
.uniform {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(var(--min-tile, 260px), 1fr));
  gap: 12px;
}
@media (max-width: 768px) {
  .uniform {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
