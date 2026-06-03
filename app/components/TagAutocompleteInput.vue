<script setup lang="ts">
import { ref, computed, watch, onMounted, useId } from 'vue'
import type { TagCategory, AutocompleteTagResponseDto } from '~/types/tag'
import { narrowCategory } from '~/utils/tags'
import { formatCount } from '~/utils/format'

interface Suggestion {
  name: string
  category: TagCategory
  count: number
}

const props = withDefaults(
  defineProps<{
    excludeNames?: string[]
    placeholder?: string
    limit?: number
    full?: boolean
    autofocus?: boolean
  }>(),
  { excludeNames: () => [], placeholder: '', limit: 6, full: false, autofocus: true },
)

const emit = defineEmits<{ commit: [name: string]; cancel: [] }>()

const { api } = useApi()
const { locale } = useI18n()

const listboxId = useId()
const query = ref('')
const activeIndex = ref(-1)
const suggestions = ref<Suggestion[]>([])
const inputEl = ref<HTMLInputElement | null>(null)

const DEBOUNCE_MS = 160
let debounceTimer: ReturnType<typeof setTimeout> | undefined
let runToken = 0

const showPopover = computed(() => suggestions.value.length > 0)

async function runSearch(term: string): Promise<void> {
  const q = term.trim()
  if (!q) {
    suggestions.value = []
    activeIndex.value = -1
    return
  }
  const token = ++runToken
  try {
    const rows = await api.autocompleteTags({ q, limit: props.limit })
    if (token !== runToken) return
    const exclude = new Set(props.excludeNames)
    suggestions.value = rows
      .filter((r: AutocompleteTagResponseDto) => !exclude.has(r.name))
      .map((r) => ({ name: r.name, category: narrowCategory(r.category), count: r.usageCount }))
    activeIndex.value = suggestions.value.length ? 0 : -1
  } catch {
    if (token !== runToken) return
    suggestions.value = []
    activeIndex.value = -1
  }
}

watch(query, (q) => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => void runSearch(q), DEBOUNCE_MS)
})

function reset(): void {
  query.value = ''
  suggestions.value = []
  activeIndex.value = -1
}

function pick(s: Suggestion): void {
  emit('commit', s.name)
  reset()
}

function commitTyped(): void {
  const term = query.value.trim()
  reset()
  if (term) emit('commit', term)
  else emit('cancel')
}

function move(delta: number): void {
  if (!suggestions.value.length) return
  const count = suggestions.value.length
  activeIndex.value = (activeIndex.value + delta + count) % count
}

function onKeydown(e: KeyboardEvent): void {
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      move(1)
      break
    case 'ArrowUp':
      e.preventDefault()
      move(-1)
      break
    case 'Enter': {
      e.preventDefault()
      const picked = suggestions.value[activeIndex.value] ?? suggestions.value[0]
      if (picked) pick(picked)
      else commitTyped()
      break
    }
    case 'Escape':
      e.preventDefault()
      reset()
      emit('cancel')
      break
  }
}

function onBlur(): void {
  setTimeout(() => commitTyped(), 120)
}

interface MatchParts {
  before: string
  match: string
  after: string
}
function highlight(name: string): MatchParts {
  const q = query.value.trim().toLowerCase()
  const idx = q ? name.toLowerCase().indexOf(q) : -1
  if (idx < 0) return { before: name, match: '', after: '' }
  return {
    before: name.slice(0, idx),
    match: name.slice(idx, idx + q.length),
    after: name.slice(idx + q.length),
  }
}

function catColorVar(category: TagCategory): string {
  return `var(--cat-${category})`
}

function activeId(): string | undefined {
  if (activeIndex.value < 0) return undefined
  return `${listboxId}-opt-${activeIndex.value}`
}

onMounted(() => {
  if (props.autofocus) inputEl.value?.focus()
})
</script>

<template>
  <div class="taci" :class="{ 'taci--full': full }">
    <input
      ref="inputEl"
      v-model="query"
      type="text"
      class="taci__input mono"
      :class="{ 'taci__input--full': full }"
      :placeholder="placeholder"
      :aria-controls="listboxId"
      :aria-activedescendant="activeId()"
      role="combobox"
      :aria-expanded="showPopover"
      aria-autocomplete="list"
      aria-haspopup="listbox"
      autocomplete="off"
      spellcheck="false"
      @blur="onBlur"
      @keydown="onKeydown"
    />

    <div class="taci__layer">
      <Transition name="fade">
        <ul v-if="showPopover" :id="listboxId" class="taci__popover" role="listbox">
          <li
            v-for="(s, i) in suggestions"
            :id="`${listboxId}-opt-${i}`"
            :key="s.name"
            class="taci__option"
            :class="{ 'taci__option--active': i === activeIndex }"
            role="option"
            :aria-selected="i === activeIndex"
            @mousedown.prevent="pick(s)"
            @mouseenter="activeIndex = i"
          >
            <span
              class="taci__dot"
              :style="{
                background: catColorVar(s.category),
                '--dot-color': catColorVar(s.category),
              }"
            />
            <span class="taci__name mono">
              <span class="taci__name-before">{{ highlight(s.name).before }}</span>
              <span class="taci__name-match">{{ highlight(s.name).match }}</span>
              <span class="taci__name-after">{{ highlight(s.name).after }}</span>
            </span>
            <span class="taci__count mono">{{ formatCount(s.count, locale) }}</span>
          </li>
        </ul>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.taci {
  position: relative;
  display: inline-flex;
}
.taci--full {
  display: block;
  width: 100%;
}
.taci__input {
  height: 26px;
  padding: 0 8px;
  background: var(--color-surface2);
  border: 1px solid var(--color-border-hi);
  border-radius: var(--radius-pill);
  color: var(--color-text);
  font-size: 11.5px;
  min-width: 120px;
}
.taci__input--full {
  width: 100%;
  border-radius: var(--radius-s);
}
.taci__input:focus {
  outline: none;
  border-color: var(--color-accent-text);
}
.taci__layer {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  min-width: 220px;
  z-index: var(--z-popover);
}
.taci--full .taci__layer {
  right: 0;
}
.taci__popover {
  list-style: none;
  margin: 0;
  padding: 4px;
  background: var(--color-surface);
  border: 1px solid var(--color-border-hi);
  border-radius: var(--radius-m);
  box-shadow: var(--shadow-card);
  max-height: 240px;
  overflow-y: auto;
}
.taci__option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 10px;
  border-radius: var(--radius-s);
  font-size: 12.5px;
  cursor: pointer;
}
.taci__option--active {
  background: var(--color-surface2);
}
.taci__dot {
  width: 6px;
  height: 6px;
  border-radius: 3px;
  flex-shrink: 0;
  box-shadow: 0 0 6px color-mix(in srgb, var(--dot-color) 67%, transparent);
}
.taci__name {
  flex: 1;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.taci__name-before {
  color: var(--color-muted);
}
.taci__name-match {
  color: var(--color-accent-text);
  font-weight: 600;
}
.taci__name-after {
  color: var(--color-text);
}
.taci__count {
  font-size: 11px;
  color: var(--color-muted);
  flex-shrink: 0;
}
</style>
