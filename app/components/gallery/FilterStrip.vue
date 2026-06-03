<script setup lang="ts">
import { computed } from 'vue'
import type { TagCategory } from '~/types/tag'
import { formatCount } from '~/utils/format'
import type { GalleryFilters } from '~/types/gallery-filters'

interface StripChip {
  key: string
  category: TagCategory
  label: string
  exclude?: boolean
  remove: () => void
}

const props = defineProps<{ modelValue: GalleryFilters; count: number }>()
const emit = defineEmits<{ 'update:modelValue': [GalleryFilters] }>()

const { t, locale } = useI18n()

function update(patch: Partial<GalleryFilters>): void {
  emit('update:modelValue', { ...props.modelValue, ...patch })
}

const chips = computed<StripChip[]>(() => {
  const f = props.modelValue
  const out: StripChip[] = f.tags.map((tag) => ({
    key: `t-${tag.name}`,
    category: tag.category,
    label: tag.name,
    exclude: tag.exclude,
    remove: () => update({ tags: f.tags.filter((x) => x.name !== tag.name) }),
  }))
  if (f.characterTag) {
    out.push({
      key: 'char',
      category: 'character',
      label: f.characterLabel ?? f.characterTag,
      remove: () => update({ characterTag: null, characterLabel: null }),
    })
  }
  if (f.authorId) {
    out.push({
      key: 'author',
      category: 'artist',
      label: f.authorLabel ?? f.authorId,
      remove: () => update({ authorId: null, authorLabel: null }),
    })
  }
  if (f.seriesId) {
    out.push({
      key: 'series',
      category: 'copyright',
      label: f.seriesTitle ?? f.seriesId,
      remove: () =>
        update({
          seriesId: null,
          seriesTitle: null,
          seasonId: null,
          seasonLabel: null,
          episodeId: null,
          episodeLabel: null,
        }),
    })
  }
  if (f.seasonId) {
    out.push({
      key: 'season',
      category: 'meta',
      label: f.seasonLabel ?? f.seasonId,
      remove: () =>
        update({ seasonId: null, seasonLabel: null, episodeId: null, episodeLabel: null }),
    })
  }
  if (f.episodeId) {
    out.push({
      key: 'episode',
      category: 'meta',
      label: f.episodeLabel ?? f.episodeId,
      remove: () => update({ episodeId: null, episodeLabel: null }),
    })
  }
  return out
})

const resultLabel = computed(() =>
  t('gallery.results', { n: formatCount(props.count, locale.value) }, props.count),
)
</script>

<template>
  <div class="strip">
    <span class="strip__count mono">{{ resultLabel }}</span>
    <span v-if="chips.length" class="strip__divider" />
    <LTagChip
      v-for="chip in chips"
      :key="chip.key"
      :category="chip.category"
      size="sm"
      removable
      :class="{ 'strip__chip--exclude': chip.exclude }"
      @remove="chip.remove()"
    >
      <span v-if="chip.exclude" class="strip__minus" aria-hidden="true">−</span>{{ chip.label }}
    </LTagChip>
  </div>
</template>

<style scoped>
.strip {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 18px;
  min-height: 30px;
  flex-wrap: wrap;
}
.strip__count {
  font-size: 11.5px;
  color: var(--color-muted);
  letter-spacing: 0.8px;
}
.strip__divider {
  width: 1px;
  height: 14px;
  background: var(--color-border);
}
</style>
