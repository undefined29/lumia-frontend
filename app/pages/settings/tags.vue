<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { TagView } from '~/types/view'
import type { TagCategory, TagResponseDto } from '~/types/tag'
import { TAG_CATEGORIES } from '~/types/tag'
import { narrowCategory, categoryColorVar } from '~/utils/tags'

definePageMeta({ layout: 'default' })

const { t } = useI18n()
const { api } = useApi()
const { canManageAnime } = usePermissions()

useSeoMeta({
  title: () => t('seo.settingsTitle'),
  description: () => t('seo.settingsDescription'),
})

type TagRow = TagView & { id: number; count: number }

const search = ref('')
const categoryFilter = ref<TagCategory | null>(null)
const tags = ref<TagRow[]>([])
const editing = ref<TagRow | null>(null)
const editorOpen = ref(false)

function mapRows(dtos: TagResponseDto[]): TagRow[] {
  return dtos.map((dto) => ({
    id: dto.id,
    name: dto.name,
    category: narrowCategory(dto.category),
    color: dto.colorOverride ?? undefined,
    count: dto.usageCount,
  }))
}

const resource = useAsyncResource(async () => {
  tags.value = mapRows(await api.listTags())
  return tags.value
})

const SEARCH_DEBOUNCE_MS = 250
let searchTimer: ReturnType<typeof setTimeout> | null = null

async function fetchTags(): Promise<void> {
  tags.value = mapRows(
    await api.listTags({
      search: search.value.trim() || undefined,
      category: categoryFilter.value ?? undefined,
    }),
  )
}

watch([search, categoryFilter], () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => void fetchTags(), SEARCH_DEBOUNCE_MS)
})

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return tags.value
    .filter((tag) => !categoryFilter.value || tag.category === categoryFilter.value)
    .filter((tag) => !q || tag.name.toLowerCase().includes(q))
    .slice()
    .sort((a, b) => b.count - a.count)
})

function colorVarFor(category: TagCategory): string {
  return categoryColorVar(category)
}

function onEdit(tag: TagRow): void {
  editing.value = tag
  editorOpen.value = true
}

function onClose(): void {
  editorOpen.value = false
}

async function onSave(payload: {
  name: string
  category: TagCategory
  color: string | null
}): Promise<void> {
  const target = editing.value
  if (!target) return
  const prev = tags.value
  tags.value = tags.value.map((tag) =>
    tag.id === target.id
      ? {
          ...tag,
          name: payload.name,
          category: payload.category,
          color: payload.color ?? undefined,
        }
      : tag,
  )
  onClose()
  try {
    await api.updateTag(target.id, {
      name: payload.name,
      category: payload.category,
      colorOverride: payload.color,
    })
  } catch {
    tags.value = prev
  }
}

function onDelete(): void {
  const target = editing.value
  if (!target) return
  tags.value = tags.value.filter((tag) => tag.name !== target.name)
  onClose()
}
</script>

<template>
  <SettingsShell :tags-count="tags.length">
    <div class="tags">
      <header class="tags__header">
        <div class="tags__eyebrow mono">{{ t('settings.tagsTotal', { n: tags.length }) }}</div>
        <h1 class="tags__title">{{ t('settings.tagsTitle') }}</h1>
        <p class="tags__desc">{{ t('settings.tagsDesc') }}</p>
      </header>

      <div class="tags__toolbar">
        <div class="tags__search">
          <LIcon name="search" :size="14" class="tags__search-icon" />
          <input
            v-model="search"
            type="search"
            class="tags__search-input"
            :placeholder="t('settings.findTag')"
            :aria-label="t('settings.findTag')"
          />
        </div>
        <button
          type="button"
          class="tags__pill"
          :class="{ 'tags__pill--active': categoryFilter === null }"
          @click="categoryFilter = null"
        >
          {{ t('settings.all') }}
        </button>
        <button
          v-for="cat in TAG_CATEGORIES"
          :key="cat"
          type="button"
          class="tags__pill tags__pill--cat mono"
          :class="{ 'tags__pill--cat-active': categoryFilter === cat }"
          :style="{
            '--cat-color': colorVarFor(cat),
            background:
              categoryFilter === cat
                ? `color-mix(in srgb, ${colorVarFor(cat)} 13%, transparent)`
                : 'transparent',
            color: categoryFilter === cat ? colorVarFor(cat) : 'var(--color-muted)',
            borderColor:
              categoryFilter === cat
                ? `color-mix(in srgb, ${colorVarFor(cat)} 33%, transparent)`
                : 'var(--color-border)',
          }"
          @click="categoryFilter = cat"
        >
          <span class="tags__pill-dot" :style="{ background: colorVarFor(cat) }" />
          {{ cat }}
        </button>
      </div>

      <LAsyncState
        :status="resource.status.value"
        :error="resource.error.value"
        @retry="resource.retry"
      >
        <TagsTable :tags="filtered" :editable="canManageAnime" @edit="onEdit" />
      </LAsyncState>
    </div>

    <TagEditPopover
      v-if="editing && canManageAnime"
      :model-tag="editing"
      :open="editorOpen"
      :centered="true"
      @save="onSave"
      @delete="onDelete"
      @close="onClose"
    />
  </SettingsShell>
</template>

<style scoped>
.tags__header {
  margin-bottom: var(--space-6);
}
.tags__eyebrow {
  font-size: 11px;
  color: var(--color-muted);
  letter-spacing: 1.4px;
  margin-bottom: 6px;
}
.tags__title {
  margin: 0;
  font-size: 26px;
  font-weight: 600;
  letter-spacing: -0.6px;
}
.tags__desc {
  margin: 6px 0 0;
  color: var(--color-muted);
  font-size: 13.5px;
}
.tags__toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 18px;
  align-items: center;
  flex-wrap: wrap;
}
.tags__search {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 0 12px;
  background: var(--color-surface2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-m);
  height: 36px;
  width: 240px;
  max-width: 100%;
}
.tags__search-icon {
  color: var(--color-muted);
  flex-shrink: 0;
}
.tags__search-input {
  flex: 1;
  min-width: 0;
  background: transparent;
  border: 0;
  color: var(--color-text);
  font-size: 13px;
}
.tags__search-input:focus {
  outline: none;
}
.tags__pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 11px;
  font-size: 12px;
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--color-text2);
  font-weight: 500;
  border: 1px solid var(--color-border);
  transition: background var(--dur-fast);
}
.tags__pill--active {
  background: var(--color-accent);
  color: var(--color-accent-contrast);
  font-weight: 600;
  border-color: var(--color-accent);
}
.tags__pill--cat {
  font-size: 11.5px;
  letter-spacing: 0.4px;
  text-transform: uppercase;
}
.tags__pill-dot {
  width: 5px;
  height: 5px;
  border-radius: 3px;
}

@media (max-width: 768px) {
  .tags__search {
    width: 100%;
  }
}
</style>
