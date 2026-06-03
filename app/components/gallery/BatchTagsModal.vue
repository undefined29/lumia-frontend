<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { SelectedTag } from '~/types/gallery-filters'
import type { TagView, TagGroups } from '~/types/view'
import type { PatchTagAdd } from '~/types/image'
import { categoryColorVar, orderedTagGroups } from '~/utils/tags'

const props = withDefaults(
  defineProps<{ open: boolean; count: number; commonTags: TagView[]; saving?: boolean }>(),
  { saving: false },
)

const emit = defineEmits<{
  save: [payload: { add: PatchTagAdd[]; remove: string[] }]
  close: []
}>()

const { t } = useI18n()

const additions = ref<SelectedTag[]>([])
const working = ref<TagView[]>([])

watch(
  () => props.open,
  (open) => {
    if (open) {
      additions.value = []
      working.value = props.commonTags.map((tag) => ({ ...tag }))
    }
  },
)

const groups = computed(() => {
  const map: TagGroups = {}
  for (const tag of working.value) {
    ;(map[tag.category] ??= []).push(tag)
  }
  return orderedTagGroups(map)
})

const removedCount = computed(() => props.commonTags.length - working.value.length)

const canSave = computed(
  () => !props.saving && (additions.value.length > 0 || removedCount.value > 0),
)

function removeTag(name: string): void {
  working.value = working.value.filter((tag) => tag.name !== name)
}

function onSave(): void {
  if (!canSave.value) return
  const kept = new Set(working.value.map((tag) => tag.name))
  const remove = props.commonTags.map((tag) => tag.name).filter((name) => !kept.has(name))
  emit('save', {
    add: additions.value.map((tag) => ({ name: tag.name, category: tag.category })),
    remove,
  })
}
</script>

<template>
  <LModal :open="open" :max-width="520" labelled-by="batch-tags-title" @close="emit('close')">
    <header class="bt__header">
      <div>
        <h2 id="batch-tags-title" class="bt__title">{{ t('selection.tagsTitle') }}</h2>
        <p class="bt__sub mono">{{ t('selection.appliesTo', { n: count }, count) }}</p>
      </div>
      <button type="button" class="bt__icon" :aria-label="t('common.close')" @click="emit('close')">
        <LIcon name="x" :size="18" :stroke="2" />
      </button>
    </header>

    <div class="bt__body">
      <section class="bt__section">
        <div class="bt__section-head">
          <span class="bt__section-title">{{ t('selection.commonTags') }}</span>
          <span class="bt__hint">{{ t('selection.commonTagsHint') }}</span>
        </div>

        <div v-if="groups.length" class="bt__groups">
          <div v-for="group in groups" :key="group.category" class="bt__group">
            <div class="bt__group-head">
              <span
                class="bt__dot"
                :style="{
                  background: categoryColorVar(group.category),
                  boxShadow: `0 0 8px ${categoryColorVar(group.category)}`,
                }"
              />
              <span class="bt__cat mono" :style="{ color: categoryColorVar(group.category) }">{{
                t(`tagEdit.category.${group.category}`)
              }}</span>
            </div>
            <div class="bt__chips">
              <LTagChip
                v-for="tag in group.tags"
                :key="tag.name"
                :category="group.category"
                :color="tag.color"
                size="md"
                removable
                @remove="removeTag(tag.name)"
              >
                {{ tag.name }}
              </LTagChip>
            </div>
          </div>
        </div>
        <p v-else class="bt__empty mono">{{ t('selection.noCommonTags') }}</p>
      </section>

      <LField :label="t('selection.addTags')" :hint="t('selection.addTagsHint')">
        <TagAutocomplete v-model="additions" :placeholder="t('selection.addTagsPlaceholder')" />
      </LField>
    </div>

    <footer class="bt__footer">
      <LButton variant="ghost" @click="emit('close')">{{ t('common.cancel') }}</LButton>
      <LButton
        variant="primary"
        icon="check"
        :disabled="!canSave"
        :loading="saving"
        @click="onSave"
      >
        {{ t('selection.apply') }}
      </LButton>
    </footer>
  </LModal>
</template>

<style scoped>
.bt__header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 18px 22px;
  border-bottom: 1px solid var(--color-border);
}
.bt__title {
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.2px;
}
.bt__sub {
  font-size: 11px;
  color: var(--color-muted);
  letter-spacing: 0.6px;
  margin-top: 3px;
}
.bt__icon {
  margin-left: auto;
  display: inline-flex;
  padding: 8px;
  border-radius: var(--radius-s);
  color: var(--color-muted);
}
.bt__icon:hover {
  background: var(--color-surface2);
  color: var(--color-text);
}
.bt__body {
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.bt__section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.bt__section-head {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.bt__section-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text);
}
.bt__hint {
  font-size: 11px;
  color: var(--color-muted);
}
.bt__groups {
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-height: 260px;
  overflow-y: auto;
}
.bt__group-head {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: var(--space-2);
}
.bt__dot {
  width: 6px;
  height: 6px;
  border-radius: 3px;
}
.bt__cat {
  font-size: 10.5px;
  letter-spacing: 1px;
  text-transform: uppercase;
}
.bt__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}
.bt__empty {
  font-size: 11.5px;
  color: var(--color-muted);
  padding: 6px 0;
}
.bt__footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 22px;
  border-top: 1px solid var(--color-border);
}
</style>
