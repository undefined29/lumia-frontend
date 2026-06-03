<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { TagCategory } from '~/types/tag'
import { categoryColorVar } from '~/utils/tags'
import { formatCount } from '~/utils/format'

interface ModelTag {
  name: string
  category: TagCategory
  color?: string
  count?: number
}

const props = withDefaults(
  defineProps<{
    modelTag: ModelTag
    open: boolean
    centered?: boolean
  }>(),
  { centered: false },
)

const emit = defineEmits<{
  save: [{ name: string; category: TagCategory; color: string | null }]
  delete: []
  close: []
}>()

const { locale } = useI18n()

const TAG_PRESETS: readonly string[] = [
  '#ff5d8a',
  '#ffa657',
  '#fbbf24',
  '#9affad',
  '#5eead4',
  '#4ecbff',
  '#c084fc',
  '#f472b6',
]

const name = ref(props.modelTag.name)
const category = ref<TagCategory>(props.modelTag.category)
const color = ref<string | null>(props.modelTag.color ?? null)

watch(
  () => [props.open, props.modelTag] as const,
  ([isOpen]) => {
    if (!isOpen) return
    name.value = props.modelTag.name
    category.value = props.modelTag.category
    color.value = props.modelTag.color ?? null
  },
  { immediate: true, deep: true },
)

const effectiveColor = computed(() => color.value || categoryColorVar(category.value))
const usageCount = computed(() => props.modelTag.count ?? 0)
const usageLabel = computed(() => formatCount(usageCount.value, locale.value))

const card = ref<HTMLElement | null>(null)
const openRef = computed(() => props.open && !props.centered)
useFocusTrap(card, { active: openRef, onEscape: () => emit('close') })

function onSave(): void {
  const trimmed = name.value.trim()
  if (!trimmed) return
  emit('save', { name: trimmed, category: category.value, color: color.value })
}
</script>

<template>
  <LModal
    v-if="centered"
    :open="open"
    :max-width="360"
    labelled-by="tageditor-title"
    @close="emit('close')"
  >
    <div class="te te--modal">
      <TagEditBody
        :name="name"
        :category="category"
        :color="color"
        :effective-color="effectiveColor"
        :usage-label="usageLabel"
        :presets="TAG_PRESETS"
        @update:name="name = $event"
        @update:category="category = $event"
        @update:color="color = $event"
        @save="onSave"
        @delete="emit('delete')"
        @close="emit('close')"
      />
    </div>
  </LModal>

  <Transition v-else name="fade">
    <div
      v-if="open"
      ref="card"
      class="te te--popover"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tageditor-title"
      tabindex="-1"
    >
      <TagEditBody
        :name="name"
        :category="category"
        :color="color"
        :effective-color="effectiveColor"
        :usage-label="usageLabel"
        :presets="TAG_PRESETS"
        @update:name="name = $event"
        @update:category="category = $event"
        @update:color="color = $event"
        @save="onSave"
        @delete="emit('delete')"
        @close="emit('close')"
      />
    </div>
  </Transition>
</template>

<style scoped>
.te--popover {
  position: absolute;
  z-index: var(--z-popover);
  width: 320px;
  padding: var(--space-4);
  border-radius: var(--radius-m);
  background: var(--color-bg2);
  border: 1px solid var(--color-border-hi);
  box-shadow: var(--shadow-modal);
}
.te--modal {
  padding: var(--space-4);
}
</style>
