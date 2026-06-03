<script setup lang="ts">
import { ref, computed, watch, useId } from 'vue'
import type { TagCategory, AutocompleteTagResponseDto } from '~/types/tag'
import type { SelectedTag } from '~/types/gallery-filters'
import { narrowCategory } from '~/utils/tags'
import { formatCount } from '~/utils/format'

interface Suggestion {
  name: string
  category: TagCategory
  count: number
}

function parseQuery(raw: string): { term: string; exclude: boolean } {
  const trimmed = raw.trim()
  const exclude = trimmed.startsWith('-')
  return { term: exclude ? trimmed.slice(1).trim() : trimmed, exclude }
}

const props = withDefaults(
  defineProps<{
    modelValue: SelectedTag[]
    limit?: number
    placeholder?: string
  }>(),
  { limit: 5, placeholder: '' },
)

const emit = defineEmits<{ 'update:modelValue': [SelectedTag[]] }>()

const { api } = useApi()
const { t, locale } = useI18n()

const listboxId = useId()
const query = ref('')
const focused = ref(false)
const activeIndex = ref(-1)
const suggestions = ref<Suggestion[]>([])
const inputEl = ref<HTMLInputElement | null>(null)

const DEBOUNCE_MS = 160
let debounceTimer: ReturnType<typeof setTimeout> | undefined
let runToken = 0

const showPopover = computed(() => focused.value && suggestions.value.length > 0)
const placeholderText = computed(() =>
  props.modelValue.length ? '' : props.placeholder || t('gallery.tagSearchPlaceholder'),
)

function activeId(): string | undefined {
  if (activeIndex.value < 0) return undefined
  return `${listboxId}-opt-${activeIndex.value}`
}

const isExcludeQuery = computed(() => query.value.trim().startsWith('-'))

async function runSearch(q: string): Promise<void> {
  const { term } = parseQuery(q)
  if (!term) {
    suggestions.value = []
    activeIndex.value = -1
    return
  }
  const token = ++runToken
  try {
    const rows = await api.autocompleteTags({ q: term, limit: props.limit })
    if (token !== runToken) return
    suggestions.value = rows
      .filter((r: AutocompleteTagResponseDto) => !props.modelValue.some((s) => s.name === r.name))
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

function add(tag: Suggestion): void {
  if (props.modelValue.some((s) => s.name === tag.name)) return
  const exclude = isExcludeQuery.value
  const selected: SelectedTag = { name: tag.name, category: tag.category }
  if (exclude) selected.exclude = true
  emit('update:modelValue', [...props.modelValue, selected])
  query.value = ''
  suggestions.value = []
  activeIndex.value = -1
  inputEl.value?.focus()
}

function addFreeTerm(): void {
  const { term, exclude } = parseQuery(query.value)
  if (!term) return
  if (props.modelValue.some((s) => s.name === term)) return
  const selected: SelectedTag = { name: term, category: 'general' }
  if (exclude) selected.exclude = true
  emit('update:modelValue', [...props.modelValue, selected])
  query.value = ''
  suggestions.value = []
  activeIndex.value = -1
  inputEl.value?.focus()
}

function removeByName(name: string): void {
  emit(
    'update:modelValue',
    props.modelValue.filter((s) => s.name !== name),
  )
}

function focusInput(): void {
  inputEl.value?.focus()
}

function onFocus(): void {
  focused.value = true
}
function onBlur(): void {
  setTimeout(() => {
    focused.value = false
    activeIndex.value = -1
  }, 120)
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
      const pick = suggestions.value[activeIndex.value] ?? suggestions.value[0]
      if (pick) {
        add(pick)
      } else {
        addFreeTerm()
      }
      break
    }
    case 'Backspace':
      if (!query.value && props.modelValue.length) {
        removeByName(props.modelValue[props.modelValue.length - 1]!.name)
      }
      break
    case 'Escape':
      suggestions.value = []
      activeIndex.value = -1
      break
  }
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
</script>

<template>
  <div class="tagac">
    <div
      class="tagac__control"
      :class="{ 'tagac__control--focused': focused }"
      role="combobox"
      :aria-expanded="showPopover"
      aria-haspopup="listbox"
      :aria-controls="listboxId"
      @click="focusInput"
    >
      <LIcon name="search" :size="14" class="tagac__search" />
      <LTagChip
        v-for="tag in modelValue"
        :key="tag.name"
        :category="tag.category"
        size="sm"
        removable
        :class="{ 'tagac__chip--exclude': tag.exclude }"
        @remove="removeByName(tag.name)"
      >
        <span v-if="tag.exclude" class="tagac__minus" aria-hidden="true">−</span>{{ tag.name }}
      </LTagChip>
      <input
        ref="inputEl"
        v-model="query"
        type="text"
        class="tagac__input"
        :class="{ 'tagac__input--exclude': isExcludeQuery }"
        :placeholder="placeholderText"
        :aria-activedescendant="activeId()"
        aria-autocomplete="list"
        autocomplete="off"
        spellcheck="false"
        @focus="onFocus"
        @blur="onBlur"
        @keydown="onKeydown"
      />
    </div>

    <div class="tagac__layer">
      <Transition name="fade">
        <ul v-if="showPopover" :id="listboxId" class="tagac__popover" role="listbox">
          <li
            v-for="(s, i) in suggestions"
            :id="`${listboxId}-opt-${i}`"
            :key="s.name"
            class="tagac__option"
            :class="{ 'tagac__option--active': i === activeIndex }"
            role="option"
            :aria-selected="i === activeIndex"
            @mousedown.prevent="add(s)"
            @mouseenter="activeIndex = i"
          >
            <span
              class="tagac__dot"
              :style="{
                background: catColorVar(s.category),
                '--dot-color': catColorVar(s.category),
              }"
            />
            <span class="tagac__name mono">
              <span class="tagac__name-before">{{ highlight(s.name).before }}</span>
              <span class="tagac__name-match">{{ highlight(s.name).match }}</span>
              <span class="tagac__name-after">{{ highlight(s.name).after }}</span>
            </span>
            <span class="tagac__count mono">{{ formatCount(s.count, locale) }}</span>
          </li>
        </ul>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.tagac {
  position: relative;
}
.tagac__control {
  min-height: 38px;
  padding: 6px 8px 6px 12px;
  background: var(--color-surface2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-m);
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  cursor: text;
  transition: border-color var(--dur-fast);
}
.tagac__control--focused {
  border-color: var(--color-border-hi);
}
.tagac__search {
  color: var(--color-muted);
  flex-shrink: 0;
}
.tagac__input {
  flex: 1;
  min-width: 80px;
  padding: 4px 0;
  font-size: 13px;
  background: transparent;
  border: 0;
  color: var(--color-text);
}
.tagac__input::placeholder {
  color: var(--color-muted);
}
.tagac__input:focus {
  outline: none;
}
.tagac__input--exclude {
  color: var(--color-err);
  caret-color: var(--color-err);
}
.tagac__chip--exclude {
  filter: grayscale(0.4);
  opacity: 0.85;
  text-decoration: line-through;
  text-decoration-color: color-mix(in srgb, var(--color-err) 70%, transparent);
}
.tagac__minus {
  color: var(--color-err);
  font-weight: 700;
  margin-right: 1px;
  text-decoration: none;
  display: inline-block;
}
.tagac__layer {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: var(--z-popover);
}
.tagac__popover {
  list-style: none;
  margin: 0;
  padding: 4px;
  background: var(--color-surface);
  border: 1px solid var(--color-border-hi);
  border-radius: var(--radius-m);
  box-shadow: var(--shadow-card);
  max-height: 280px;
  overflow-y: auto;
}
.tagac__option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 10px;
  border-radius: var(--radius-s);
  font-size: 12.5px;
  cursor: pointer;
}
.tagac__option--active {
  background: var(--color-surface2);
}
.tagac__dot {
  width: 6px;
  height: 6px;
  border-radius: 3px;
  flex-shrink: 0;
  box-shadow: 0 0 6px color-mix(in srgb, var(--dot-color) 67%, transparent);
}
.tagac__name {
  flex: 1;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tagac__name-before {
  color: var(--color-muted);
}
.tagac__name-match {
  color: var(--color-accent-text);
  font-weight: 600;
}
.tagac__name-after {
  color: var(--color-text);
}
.tagac__count {
  font-size: 11px;
  color: var(--color-muted);
  flex-shrink: 0;
}
</style>
