<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import type { CharacterView } from '~/types/view'
import type { TagResponseDto, UpdateTagDto } from '~/types/tag'
import { useInfiniteList } from '~/composables/useInfiniteList'
import { useSelection } from '~/composables/useSelection'
import { thumbUrlFromKey } from '~/utils/format'

definePageMeta({ layout: 'default' })

const { t } = useI18n()
const { api } = useApi()
const { toCharacterView } = useAdapters()
const { canManageAnime } = usePermissions()
const config = useRuntimeConfig()
const baseCdnUrl = config.public.baseCdnUrl as string

useSeoMeta({
  title: () => t('seo.settingsTitle'),
  description: () => t('seo.settingsDescription'),
})

const PAGE_SIZE = 50

const editing = ref<CharacterView | null>(null)
const editorOpen = ref(false)

let tagById: Map<string, TagResponseDto> | null = null
async function tagMap(): Promise<Map<string, TagResponseDto>> {
  if (!tagById) {
    const tags = await api.listTags()
    tagById = new Map(tags.map((tag) => [String(tag.id), tag]))
  }
  return tagById
}

async function resolveAvatar(view: CharacterView): Promise<void> {
  if (!view.coverImageId) return
  try {
    const img = await api.getImage(view.coverImageId)
    view.avatarUrl = thumbUrlFromKey(img.storageKey, baseCdnUrl, true) || null
  } catch {}
}

const list = useInfiniteList<CharacterView>({
  limit: PAGE_SIZE,
  getId: (character) => character.id,
  fetchPage: async ({ lastSeenId, limit }) => {
    const [chars, tags] = await Promise.all([
      api.listCharacters({ limit, ...(lastSeenId ? { lastSeenId } : {}) }),
      tagMap(),
    ])
    const views = chars.map((char) => toCharacterView(char, tags.get(char.tagId) ?? null))
    await Promise.all(views.map(resolveAvatar))
    return { items: views }
  },
})

function onNew(): void {
  editing.value = null
  editorOpen.value = true
}

async function onOpen(character: CharacterView): Promise<void> {
  if (!canManageAnime.value) return
  editing.value = character
  editorOpen.value = true
  try {
    const tags = await api.listTags({ search: character.tagName })
    const tag = tags.find((entry) => entry.name === character.tagName)
    if (tag && editing.value?.id === character.id) {
      editing.value = {
        ...editing.value,
        tagId: String(tag.id),
        color: tag.colorOverride ?? null,
      }
    }
  } catch {}
}

function onClose(): void {
  editorOpen.value = false
}

async function onSave(payload: {
  displayName: string
  tagName: string
  color: string | null
}): Promise<void> {
  const target = editing.value
  if (!target) return
  const prev = list.items.value
  list.items.value = prev.map((char) =>
    char.id === target.id
      ? {
          ...char,
          displayName: payload.displayName,
          tagName: payload.tagName,
          color: payload.color,
        }
      : char,
  )
  onClose()
  try {
    const tasks: Promise<unknown>[] = []
    if (payload.displayName !== target.displayName) {
      tasks.push(api.updateCharacter(target.id, { name: payload.displayName }))
    }
    const tagPatch: UpdateTagDto = {}
    if (payload.tagName !== target.tagName) tagPatch.name = payload.tagName
    if (payload.color !== target.color) tagPatch.colorOverride = payload.color
    if (target.tagId && (tagPatch.name !== undefined || tagPatch.colorOverride !== undefined)) {
      tasks.push(api.updateTag(target.tagId, tagPatch))
    }
    await Promise.all(tasks)
  } catch {
    list.items.value = prev
  }
}

async function onDelete(): Promise<void> {
  const target = editing.value
  if (!target) return
  const prev = list.items.value
  list.items.value = prev.filter((char) => char.id !== target.id)
  onClose()
  try {
    await api.deleteCharacter(target.id)
  } catch {
    list.items.value = prev
  }
}

const selection = useSelection('characters-selection')
const orderedIds = computed(() => list.items.value.map((char) => char.id))

watch(orderedIds, (ids) => selection.prune(ids))

function onSelect(id: string, mods: { shift: boolean; meta: boolean }): void {
  if (!canManageAnime.value) return
  if (mods.shift) selection.selectRange(id, orderedIds.value)
  else selection.toggle(id)
}

function onSelectAll(): void {
  selection.selectAll(orderedIds.value)
}

function onKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape' && selection.count.value > 0 && !confirmOpen.value) {
    selection.clear()
  }
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  selection.clear()
})

const hostRef = ref<HTMLElement | null>(null)
const marquee = ref<{ x: number; y: number; w: number; h: number } | null>(null)
let dragStart: { x: number; y: number; additive: boolean; baseline: Set<string> } | null = null
const DRAG_THRESHOLD = 6

function onBodyPointerDown(e: PointerEvent): void {
  if (e.button !== 0 || !canManageAnime.value) return
  const target = e.target as HTMLElement
  if (target.closest('.char-card') || target.closest('button') || target.closest('a')) return
  const host = hostRef.value
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
  const host = hostRef.value
  if (!host) return
  const hostRect = host.getBoundingClientRect()
  const left = Math.min(dragStart.x, e.clientX)
  const top = Math.min(dragStart.y, e.clientY)
  const right = Math.max(dragStart.x, e.clientX)
  const bottom = Math.max(dragStart.y, e.clientY)
  marquee.value = {
    x: left - hostRect.left,
    y: top - hostRect.top,
    w: right - left,
    h: bottom - top,
  }
  const hits: string[] = []
  host.querySelectorAll<HTMLElement>('.char-card[data-character-id]').forEach((el) => {
    const r = el.getBoundingClientRect()
    const intersects = r.left < right && r.right > left && r.top < bottom && r.bottom > top
    if (intersects) hits.push(el.dataset.characterId!)
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

const confirmOpen = ref(false)
const deleting = ref(false)

async function onConfirmDelete(): Promise<void> {
  const ids = [...selection.selected.value]
  if (!ids.length) {
    confirmOpen.value = false
    return
  }
  deleting.value = true
  const prev = list.items.value
  const removing = new Set(ids)
  list.items.value = prev.filter((char) => !removing.has(char.id))
  try {
    const results = await Promise.allSettled(ids.map((id) => api.deleteCharacter(id)))
    if (results.every((r) => r.status === 'rejected')) {
      list.items.value = prev
    }
    selection.clear()
  } finally {
    deleting.value = false
    confirmOpen.value = false
  }
}
</script>

<template>
  <SettingsShell :characters-count="list.items.value.length">
    <div
      ref="hostRef"
      class="chars"
      :class="{ 'chars--selecting': marquee }"
      @pointerdown="onBodyPointerDown"
      @pointermove="onBodyPointerMove"
      @pointerup="onBodyPointerUp"
      @pointerleave="onBodyPointerUp"
    >
      <header class="chars__header">
        <div class="chars__heading">
          <div class="chars__eyebrow mono">
            {{ t('settings.charactersTotal', { n: list.items.value.length }) }}
          </div>
          <h1 class="chars__title">{{ t('settings.charactersTitle') }}</h1>
        </div>
        <LButton v-if="canManageAnime" variant="primary" icon="plus" size="md" @click="onNew">
          {{ t('settings.newCharacter') }}
        </LButton>
      </header>

      <LAsyncState :status="list.status.value" :error="list.error.value" @retry="list.retry()">
        <CharacterVirtual
          :characters="list.items.value"
          :loading-more="list.loadingMore.value"
          :has-more="list.hasMore.value"
          :selectable="canManageAnime && selection.active.value"
          :selected-ids="selection.selected.value"
          @open="onOpen"
          @select="onSelect"
          @load-more="list.loadMore()"
        />
        <div v-if="list.loadingMore.value" class="chars__more" role="status">
          <LSpinner :size="20" />
        </div>
      </LAsyncState>

      <div
        v-if="marquee"
        class="chars__marquee"
        :style="{
          left: `${marquee.x}px`,
          top: `${marquee.y}px`,
          width: `${marquee.w}px`,
          height: `${marquee.h}px`,
        }"
      />
    </div>

    <CharacterSelectionBar
      v-if="canManageAnime"
      :count="selection.count.value"
      :total="list.items.value.length"
      @select-all="onSelectAll"
      @clear="selection.clear()"
      @delete="confirmOpen = true"
    />

    <CharacterEditModal
      v-if="canManageAnime"
      :character="editing"
      :open="editorOpen"
      @save="onSave"
      @delete="onDelete"
      @close="onClose"
    />

    <LModal
      v-if="canManageAnime"
      :open="confirmOpen"
      :max-width="420"
      labelled-by="chars-delete-title"
      @close="confirmOpen = false"
    >
      <div class="chars__confirm">
        <h2 id="chars-delete-title" class="chars__confirm-title">
          {{ t('settings.deleteSelectedTitle') }}
        </h2>
        <p class="chars__confirm-body">
          {{
            t('settings.deleteSelectedBody', { n: selection.count.value }, selection.count.value)
          }}
        </p>
        <div class="chars__confirm-actions">
          <LButton variant="ghost" :disabled="deleting" @click="confirmOpen = false">
            {{ t('common.cancel') }}
          </LButton>
          <LButton variant="danger" icon="trash" :loading="deleting" @click="onConfirmDelete">
            {{ t('common.delete') }}
          </LButton>
        </div>
      </div>
    </LModal>
  </SettingsShell>
</template>

<style scoped>
.chars {
  position: relative;
}
.chars--selecting {
  user-select: none;
}
.chars__marquee {
  position: absolute;
  z-index: var(--z-sticky);
  border: 1px solid var(--color-accent);
  background: var(--color-accent-dim);
  border-radius: var(--radius-s);
  pointer-events: none;
}
.chars__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}
.chars__eyebrow {
  font-size: 11px;
  color: var(--color-muted);
  letter-spacing: 1.4px;
  margin-bottom: 6px;
}
.chars__title {
  margin: 0;
  font-size: 26px;
  font-weight: 600;
  letter-spacing: -0.6px;
}
.chars__more {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 0;
}
.chars__confirm {
  padding: 22px;
}
.chars__confirm-title {
  margin: 0 0 8px;
  font-size: 17px;
  font-weight: 600;
}
.chars__confirm-body {
  margin: 0 0 20px;
  font-size: 13.5px;
  line-height: 1.5;
  color: var(--color-text2);
}
.chars__confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
