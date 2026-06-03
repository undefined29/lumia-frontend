<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { CharacterView } from '~/types/view'
import { formatCount } from '~/utils/format'
import { categoryColorVar } from '~/utils/tags'

const props = defineProps<{
  character: CharacterView | null
  open: boolean
}>()

const emit = defineEmits<{
  save: [{ displayName: string; tagName: string; color: string | null }]
  delete: []
  close: []
}>()

const { t, locale } = useI18n()

const COLOR_PRESETS: readonly string[] = [
  '#ff5d8a',
  '#ffa657',
  '#fbbf24',
  '#9affad',
  '#5eead4',
  '#4ecbff',
  '#c084fc',
  '#f472b6',
]

const displayName = ref('')
const tagName = ref('')
const color = ref<string | null>(null)

watch(
  () => [props.open, props.character] as const,
  ([isOpen]) => {
    if (!isOpen || !props.character) return
    displayName.value = props.character.displayName
    tagName.value = props.character.tagName
    color.value = props.character.color ?? null
  },
  { immediate: true },
)

const defaultColor = categoryColorVar('character')
const usedInCount = computed(() => props.character?.usedInCount ?? 0)
const usedInLabel = computed(() => formatCount(usedInCount.value, locale.value))

function onSave(): void {
  const display = displayName.value.trim()
  const tag = tagName.value.trim()
  if (!display || !tag) return
  emit('save', { displayName: display, tagName: tag, color: color.value })
}
</script>

<template>
  <LModal :open="open" :max-width="560" labelled-by="chareditor-title" @close="emit('close')">
    <header class="ce__head">
      <span class="ce__dot" />
      <span id="chareditor-title" class="ce__eyebrow mono">{{ t('charEdit.title') }}</span>
      <span class="ce__spacer" />
      <button
        type="button"
        class="ce__close"
        :aria-label="t('common.close')"
        @click="emit('close')"
      >
        <LIcon name="x" :size="16" :stroke="2" />
      </button>
    </header>

    <div class="ce__body">
      <div class="ce__avatar-col">
        <span class="ce__label mono">{{ t('charEdit.avatar') }}</span>
        <div class="ce__avatar">
          <LImage
            :src="character?.avatarUrl"
            :hue="character?.hue ?? 200"
            :alt="character?.displayName ?? ''"
            variant="avatar"
            :aspect-ratio="1"
          />
        </div>
        <span class="ce__avatar-hint mono">{{ t('charEdit.avatarHint') }}</span>
      </div>

      <div class="ce__fields">
        <LField :label="t('charEdit.displayName')" :hint="t('charEdit.displayNameHint')">
          <input v-model="displayName" class="ce__input" :aria-label="t('charEdit.displayName')" />
        </LField>

        <LField :label="t('charEdit.tagName')" :hint="t('charEdit.tagNameHint')">
          <input v-model="tagName" class="ce__input mono" :aria-label="t('charEdit.tagName')" />
        </LField>

        <div class="ce__color">
          <div class="ce__color-head">
            <span class="ce__label mono">{{ t('tagEdit.colorLabel') }}</span>
            <button
              type="button"
              class="ce__default mono"
              :class="{ 'ce__default--on': color }"
              @click="color = null"
            >
              {{ t('tagEdit.useCategoryDefault') }}
            </button>
          </div>
          <div class="ce__swatches">
            <LColorSwatch
              :color="defaultColor"
              :active="!color"
              :label="t('tagEdit.categoryDefault')"
              @select="color = null"
            />
            <LColorSwatch
              v-for="preset in COLOR_PRESETS"
              :key="preset"
              :color="preset"
              :active="color === preset"
              :label="preset"
              @select="color = preset"
            />
          </div>
        </div>

        <div class="ce__usage">
          <span class="ce__usage-badge mono">{{ usedInLabel }}</span>
          <div class="ce__usage-text">
            <span class="ce__usage-title">{{ t('charEdit.usedIn', { count: usedInCount }) }}</span>
            <span class="ce__usage-sub mono">{{ t('charEdit.usedInSub') }}</span>
          </div>
        </div>
      </div>
    </div>

    <footer class="ce__footer">
      <LButton variant="danger" size="sm" icon="trash" @click="emit('delete')">
        {{ t('charEdit.deleteCharacter') }}
      </LButton>
      <span class="ce__spacer" />
      <LButton variant="ghost" @click="emit('close')">{{ t('common.cancel') }}</LButton>
      <LButton variant="primary" icon="check" @click="onSave">{{ t('common.save') }}</LButton>
    </footer>
  </LModal>
</template>

<style scoped>
.ce__head {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 16px 22px;
  border-bottom: 1px solid var(--color-border);
}
.ce__dot {
  width: 8px;
  height: 8px;
  border-radius: 4px;
  background: var(--cat-character);
  box-shadow: 0 0 8px var(--cat-character);
}
.ce__eyebrow {
  font-size: 10.5px;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: var(--cat-character);
}
.ce__spacer {
  flex: 1;
}
.ce__close {
  color: var(--color-muted);
  padding: 6px;
  border-radius: var(--radius-s);
}
.ce__close:hover {
  color: var(--color-text);
}
.ce__body {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 22px;
  padding: 22px;
  overflow-y: auto;
}
.ce__avatar-col {
  display: flex;
  flex-direction: column;
}
.ce__label {
  font-size: 10px;
  color: var(--color-muted);
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-bottom: var(--space-2);
}
.ce__avatar {
  width: 120px;
  height: 120px;
  border-radius: var(--radius-m);
  border: 1px solid var(--color-border);
  overflow: hidden;
}
.ce__avatar-hint {
  margin-top: var(--space-2);
  font-size: 10px;
  color: var(--color-mute2);
  letter-spacing: 0.6px;
}
.ce__fields {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  min-width: 0;
}
.ce__input {
  width: 100%;
  height: 38px;
  padding: 0 12px;
  background: var(--color-surface2);
  border: 1px solid var(--color-border-hi);
  border-radius: var(--radius-m);
  color: var(--color-text);
  font-size: 14px;
}
.ce__input:focus {
  outline: none;
  border-color: var(--color-accent-text);
}
.ce__color-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}
.ce__label {
  display: block;
  font-size: 10px;
  color: var(--color-muted);
  letter-spacing: 0.8px;
  text-transform: uppercase;
}
.ce__default {
  font-size: 10px;
  letter-spacing: 0.6px;
  color: var(--color-muted);
  text-transform: uppercase;
}
.ce__default--on {
  color: var(--color-accent-text);
}
.ce__swatches {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}
.ce__usage {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: var(--radius-s);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}
.ce__usage-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 13px;
  background: color-mix(in srgb, var(--cat-character) 13%, transparent);
  color: var(--cat-character);
  font-weight: 700;
  font-size: 11px;
  flex-shrink: 0;
}
.ce__usage-text {
  display: flex;
  flex-direction: column;
}
.ce__usage-title {
  font-size: 12.5px;
}
.ce__usage-sub {
  font-size: 10.5px;
  color: var(--color-muted);
  letter-spacing: 0.4px;
}
.ce__footer {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 22px;
  border-top: 1px solid var(--color-border);
}
@media (max-width: 768px) {
  .ce__body {
    grid-template-columns: 1fr;
  }
}
</style>
