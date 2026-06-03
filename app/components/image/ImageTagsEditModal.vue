<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { TagCategory } from '~/types/tag'
import { TAG_CATEGORIES } from '~/types/tag'
import type { TagView } from '~/types/view'
import type { PatchTagAdd } from '~/types/image'
import { categoryColorVar } from '~/utils/tags'

const props = defineProps<{
  open: boolean
  tags: TagView[]
  saving?: boolean
}>()

const emit = defineEmits<{
  save: [{ add: PatchTagAdd[]; remove: string[] }]
  close: []
}>()

const { t } = useI18n()
const categories = TAG_CATEGORIES

const working = ref<TagView[]>([])
const addingFor = ref<TagCategory | null>(null)

watch(
  () => [props.open, props.tags] as const,
  ([isOpen]) => {
    if (!isOpen) return
    working.value = props.tags.map((tag) => ({ ...tag }))
    addingFor.value = null
  },
  { immediate: true },
)

const grouped = computed<Record<TagCategory, TagView[]>>(() => {
  const out = {} as Record<TagCategory, TagView[]>
  for (const cat of categories) out[cat] = []
  for (const tag of working.value) out[tag.category].push(tag)
  return out
})

const workingNames = computed(() => working.value.map((tag) => tag.name))

function removeTag(name: string): void {
  working.value = working.value.filter((tag) => tag.name !== name)
}

function startAdd(cat: TagCategory): void {
  addingFor.value = cat
}

function commitAdd(cat: TagCategory, raw: string): void {
  const name = raw.trim().toLowerCase().replace(/\s+/g, '_')
  if (name && !working.value.some((tag) => tag.name === name)) {
    working.value = [...working.value, { name, category: cat }]
  }
  addingFor.value = null
}

function onSave(): void {
  const originalNames = new Set(props.tags.map((tag) => tag.name))
  const nextNames = new Set(working.value.map((tag) => tag.name))
  const add: PatchTagAdd[] = working.value
    .filter((tag) => !originalNames.has(tag.name))
    .map((tag) => ({ name: tag.name, category: tag.category }))
  const remove = props.tags.map((tag) => tag.name).filter((name) => !nextNames.has(name))
  emit('save', { add, remove })
}
</script>

<template>
  <LModal :open="open" :max-width="460" labelled-by="imgtags-title" @close="emit('close')">
    <header class="it__head">
      <span id="imgtags-title" class="it__title">{{ t('image.editTagsTitle') }}</span>
      <button
        type="button"
        class="it__close"
        :aria-label="t('common.close')"
        @click="emit('close')"
      >
        <LIcon name="x" :size="18" :stroke="2" />
      </button>
    </header>

    <div class="it__body">
      <div v-for="cat in categories" :key="cat" class="it__group">
        <div class="it__group-head">
          <span
            class="it__dot"
            :style="{
              background: categoryColorVar(cat),
              boxShadow: `0 0 8px ${categoryColorVar(cat)}`,
            }"
          />
          <span class="it__cat mono" :style="{ color: categoryColorVar(cat) }">{{
            t(`tagEdit.category.${cat}`)
          }}</span>
          <span class="it__count mono">{{ grouped[cat].length }}</span>
        </div>

        <div v-if="grouped[cat].length" class="it__chips">
          <LTagChip
            v-for="tag in grouped[cat]"
            :key="tag.name"
            :category="cat"
            :color="tag.color"
            size="md"
            removable
            @remove="removeTag(tag.name)"
          >
            {{ tag.name }}
          </LTagChip>
          <TagAutocompleteInput
            v-if="addingFor === cat"
            :exclude-names="workingNames"
            :placeholder="t('image.addTagPlaceholder')"
            @commit="commitAdd(cat, $event)"
            @cancel="addingFor = null"
          />
          <button v-else type="button" class="it__add-chip mono" @click="startAdd(cat)">
            <LIcon name="plus" :size="11" :stroke="2" /> {{ t('common.add') }}
          </button>
        </div>

        <div v-else-if="addingFor === cat" class="it__add-row it__add-row--input">
          <TagAutocompleteInput
            full
            :exclude-names="workingNames"
            :placeholder="t('image.addTagPlaceholder')"
            @commit="commitAdd(cat, $event)"
            @cancel="addingFor = null"
          />
        </div>
        <button v-else type="button" class="it__add-row mono" @click="startAdd(cat)">
          <LIcon name="plus" :size="12" :stroke="2" />
          {{ t('image.addCategoryTag', { category: t(`tagEdit.category.${cat}`) }) }}
        </button>
      </div>
    </div>

    <footer class="it__footer">
      <LButton variant="ghost" block @click="emit('close')">{{ t('common.discard') }}</LButton>
      <LButton variant="primary" icon="check" block :loading="saving" @click="onSave">
        {{ t('image.saveTags') }}
      </LButton>
    </footer>
  </LModal>
</template>

<style scoped>
.it__head {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 18px 22px;
  border-bottom: 1px solid var(--color-border);
}
.it__title {
  flex: 1;
  font-size: 16px;
  font-weight: 600;
}
.it__close {
  color: var(--color-muted);
  padding: 6px;
  border-radius: var(--radius-s);
}
.it__close:hover {
  color: var(--color-text);
}
.it__body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}
.it__group {
  margin-bottom: 18px;
}
.it__group:last-child {
  margin-bottom: 0;
}
.it__group-head {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: var(--space-2);
}
.it__dot {
  width: 6px;
  height: 6px;
  border-radius: 3px;
}
.it__cat {
  font-size: 10.5px;
  letter-spacing: 1px;
  text-transform: uppercase;
}
.it__count {
  margin-left: auto;
  font-size: 10.5px;
  color: var(--color-muted);
}
.it__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}
.it__add-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 9px;
  border-radius: var(--radius-pill);
  font-size: 11.5px;
  color: var(--color-muted);
  border: 1px dashed var(--color-border);
}
.it__add-chip:hover {
  color: var(--color-text);
  border-color: var(--color-border-hi);
}
.it__add-row {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 8px 10px;
  border-radius: var(--radius-s);
  border: 1px dashed var(--color-border);
  color: var(--color-muted);
  font-size: 12px;
  text-align: left;
}
.it__add-row:hover {
  color: var(--color-text);
  border-color: var(--color-border-hi);
}
.it__add-row--input {
  border: none;
  padding: 0;
}
.it__footer {
  display: flex;
  gap: var(--space-2);
  padding: 16px;
  border-top: 1px solid var(--color-border);
}
</style>
