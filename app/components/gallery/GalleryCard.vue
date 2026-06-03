<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ImageView } from '~/types/view'
import type { TagCategory } from '~/types/tag'
import { episodeLabel } from '~/utils/format'
import { useReducedMotion } from '~/composables/useReducedMotion'
import { useHearts } from '~/composables/useHearts'

const props = withDefaults(
  defineProps<{
    image: ImageView
    uniform?: boolean
    selectable?: boolean
    selected?: boolean
    contextEnabled?: boolean
  }>(),
  { uniform: false, selectable: false, selected: false, contextEnabled: false },
)

const emit = defineEmits<{
  select: [id: string, modifiers: { shift: boolean; meta: boolean }]
  contextmenu: [id: string, position: { x: number; y: number }]
  favorite: [id: string, next: boolean]
}>()

const { t } = useI18n()
const localePath = useLocalePath()
const reduced = useReducedMotion()
const { burst } = useHearts()

const maxTags = computed(() => (props.uniform ? 3 : 4))

const HOVER_CATEGORY_ORDER: readonly TagCategory[] = [
  'copyright',
  'character',
  'general',
  'rating',
  'meta',
  'year',
  'artist',
]
function categoryRank(category: TagCategory): number {
  const index = HOVER_CATEGORY_ORDER.indexOf(category)
  return index === -1 ? HOVER_CATEGORY_ORDER.length : index
}
const orderedTags = computed(() =>
  [...props.image.tags].sort((a, b) => categoryRank(a.category) - categoryRank(b.category)),
)
const visibleTags = computed(() => orderedTags.value.slice(0, maxTags.value))
const overflowCount = computed(() => Math.max(0, orderedTags.value.length - maxTags.value))

const aspectRatio = computed(() => (props.uniform ? 16 / 9 : props.image.aspectRatio))

const metaLabel = computed(() => {
  const img = props.image
  if (!img.seriesTitle) return t('gallery.untagged')
  const parts = [img.seriesTitle.toUpperCase()]
  if (img.seasonNumber != null && img.episodeNumber != null) {
    parts.push(`S${img.seasonNumber} ${episodeLabel(img.episodeNumber)}`)
  }
  return parts.join(' · ')
})

const to = computed(() => localePath(`/image/${props.image.id}`))

function onClickCapture(event: MouseEvent): void {
  const meta = event.metaKey || event.ctrlKey
  if (props.selectable || meta || event.shiftKey) {
    event.preventDefault()
    event.stopPropagation()
    emit('select', props.image.id, { shift: event.shiftKey, meta })
  }
}

function onCheckbox(event: MouseEvent): void {
  event.preventDefault()
  event.stopPropagation()
  emit('select', props.image.id, { shift: event.shiftKey, meta: event.metaKey || event.ctrlKey })
}

function onContextMenu(event: MouseEvent): void {
  if (!props.contextEnabled) return
  event.preventDefault()
  emit('contextmenu', props.image.id, { x: event.clientX, y: event.clientY })
}

const favBursting = ref(false)

function activateFavorite(originX: number, originY: number): void {
  const next = !props.image.favorite
  emit('favorite', props.image.id, next)
  if (next && !reduced.value) {
    favBursting.value = true
    window.setTimeout(() => {
      favBursting.value = false
    }, 600)
    burst(originX, originY)
  }
}

function onFavClick(event: MouseEvent): void {
  event.preventDefault()
  event.stopPropagation()
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  activateFavorite(rect.left + rect.width / 2, rect.top + rect.height / 2)
}

const DOUBLE_TAP_MS = 280
const TAP_MOVE_TOLERANCE = 10
let tapStartX = 0
let tapStartY = 0
let tapMoved = false
let lastTapTime = 0
let singleTapTimer: ReturnType<typeof setTimeout> | null = null

function onTouchStart(event: TouchEvent): void {
  if (event.touches.length !== 1) {
    tapMoved = true
    return
  }
  const touch = event.touches[0]!
  tapStartX = touch.clientX
  tapStartY = touch.clientY
  tapMoved = false
}

function onTouchMove(event: TouchEvent): void {
  const touch = event.touches[0]
  if (!touch) return
  if (Math.hypot(touch.clientX - tapStartX, touch.clientY - tapStartY) > TAP_MOVE_TOLERANCE) {
    tapMoved = true
  }
}

function onTouchEnd(event: TouchEvent): void {
  if (props.selectable || tapMoved || event.changedTouches.length !== 1) return
  event.preventDefault()
  const touch = event.changedTouches[0]!
  const now = Date.now()
  if (now - lastTapTime < DOUBLE_TAP_MS) {
    if (singleTapTimer) {
      clearTimeout(singleTapTimer)
      singleTapTimer = null
    }
    lastTapTime = 0
    activateFavorite(touch.clientX, touch.clientY)
  } else {
    lastTapTime = now
    singleTapTimer = setTimeout(() => {
      singleTapTimer = null
      void navigateTo(to.value)
    }, DOUBLE_TAP_MS)
  }
}
</script>

<template>
  <NuxtLink
    :to="to"
    class="gcard"
    :class="{
      'gcard--selectable': selectable,
      'gcard--selected': selected,
      'gcard--fav-burst': favBursting,
    }"
    :style="{ aspectRatio: String(aspectRatio) }"
    :data-image-id="image.id"
    @click.capture="onClickCapture"
    @contextmenu="onContextMenu"
    @touchstart.passive="onTouchStart"
    @touchmove.passive="onTouchMove"
    @touchend="onTouchEnd"
  >
    <LImage
      :src="image.thumbUrl || null"
      :hue="image.hue"
      :alt="metaLabel"
      :aspect-ratio="aspectRatio"
      variant="card"
      :cover="true"
    />

    <button
      type="button"
      class="gcard__check"
      :class="{ 'gcard__check--on': selected }"
      :aria-pressed="selected"
      :aria-label="t('gallery.selectImage')"
      tabindex="-1"
      @click="onCheckbox"
    >
      <LIcon v-if="selected" name="check" :size="13" :stroke="2.5" />
    </button>

    <button
      type="button"
      class="gcard__fav"
      :class="{ 'gcard__fav--on': image.favorite }"
      :aria-pressed="image.favorite"
      :aria-label="t('gallery.favorite')"
      tabindex="-1"
      @click="onFavClick"
    >
      <LIcon name="star" :size="15" :stroke="image.favorite ? 0 : 2" />
    </button>

    <span class="gcard__meta mono">{{ metaLabel }}</span>

    <div class="gcard__tags">
      <LTagChip
        v-for="tag in visibleTags"
        :key="tag.name"
        :category="tag.category"
        :color="tag.color"
        size="sm"
      >
        {{ tag.name }}
      </LTagChip>
      <span v-if="overflowCount > 0" class="gcard__more mono">+{{ overflowCount }}</span>
    </div>
  </NuxtLink>
</template>

<style scoped>
.gcard {
  position: relative;
  display: block;
  border-radius: var(--radius-m);
  overflow: hidden;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  transition:
    transform var(--dur-base) var(--ease-out),
    box-shadow var(--dur-base) var(--ease-out);
}
.gcard:hover,
.gcard:focus-visible {
  transform: translateY(-2px);
  box-shadow:
    var(--shadow-card),
    0 0 0 1px var(--color-border-hi);
}
.gcard--selected {
  box-shadow:
    var(--shadow-card),
    0 0 0 2px var(--color-accent);
}
.gcard--selected:hover {
  box-shadow:
    var(--shadow-card),
    0 0 0 2px var(--color-accent);
}

.gcard__check {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: var(--radius-s);
  border: 1.5px solid var(--color-border-hi);
  background: var(--glass-bg);
  backdrop-filter: blur(8px);
  color: var(--color-accent-contrast);
  opacity: 0;
  transition:
    opacity var(--dur-fast) var(--ease-out),
    background var(--dur-fast),
    border-color var(--dur-fast);
}
.gcard:hover .gcard__check,
.gcard--selectable .gcard__check,
.gcard--selected .gcard__check {
  opacity: 1;
}
.gcard__check--on {
  background: var(--color-accent);
  border-color: var(--color-accent);
}

.gcard__fav {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--color-border);
  background: var(--glass-bg);
  backdrop-filter: blur(8px);
  color: #fff;
  opacity: 0;
  transform: scale(0.85);
  transition:
    opacity var(--dur-fast) var(--ease-out),
    transform var(--dur-fast) var(--ease-out),
    color var(--dur-fast),
    background var(--dur-fast);
}
.gcard:hover .gcard__fav,
.gcard:focus-within .gcard__fav,
.gcard__fav--on {
  opacity: 1;
  transform: scale(1);
}
.gcard__fav:hover {
  background: var(--color-surface3);
  transform: scale(1.12);
}
.gcard__fav--on {
  color: var(--color-warn);
  border-color: color-mix(in srgb, var(--color-warn) 45%, transparent);
}
.gcard__fav--on :deep(svg) {
  fill: var(--color-warn);
  filter: drop-shadow(0 0 6px color-mix(in srgb, var(--color-warn) 60%, transparent));
}
.gcard--fav-burst :deep(.img) {
  animation: gcard-fav-pulse 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes gcard-fav-pulse {
  0% {
    transform: scale(1);
  }
  45% {
    transform: scale(1.045) rotate(0.5deg);
  }
  100% {
    transform: scale(1);
  }
}
.gcard--fav-burst .gcard__fav {
  animation: gcard-star-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes gcard-star-pop {
  0% {
    transform: scale(1);
  }
  35% {
    transform: scale(1.32);
  }
  100% {
    transform: scale(1);
  }
}
.gcard--selected .gcard__meta {
  opacity: 1;
}
.gcard__meta {
  position: absolute;
  top: 8px;
  left: 8px;
  display: inline-flex;
  align-items: center;
  padding: 3px 7px;
  border-radius: var(--radius-pill);
  background: var(--glass-bg);
  backdrop-filter: blur(8px);
  font-size: 9.5px;
  color: var(--color-text2);
  letter-spacing: 0.6px;
  border: 1px solid var(--color-border);
  transform: translateX(30px);
  max-width: calc(100% - 46px);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  opacity: 0;
  transition: opacity var(--dur-slow) var(--ease-out);
  pointer-events: none;
}
.gcard__tags {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 24px 10px 10px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.9), transparent);
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: flex-end;
  opacity: 0;
  transition: opacity var(--dur-slow) var(--ease-out);
  pointer-events: none;
}
.gcard:hover .gcard__meta,
.gcard:hover .gcard__tags,
.gcard:focus-visible .gcard__meta,
.gcard:focus-visible .gcard__tags {
  opacity: 1;
}
.gcard__more {
  padding: 2px 7px;
  border-radius: var(--radius-pill);
  font-size: 10.5px;
  background: var(--color-surface2);
  color: var(--color-muted);
  border: 1px solid var(--color-border);
}
</style>
