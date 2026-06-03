<script setup lang="ts">
import { computed } from 'vue'
import type { TagCategory } from '~/types/tag'
import { TAG_CATEGORIES } from '~/types/tag'
import { categoryColorVar } from '~/utils/tags'

const props = defineProps<{
  name: string
  category: TagCategory
  color: string | null
  effectiveColor: string
  usageLabel: string
  presets: readonly string[]
}>()

const emit = defineEmits<{
  'update:name': [string]
  'update:category': [TagCategory]
  'update:color': [string | null]
  save: []
  delete: []
  close: []
}>()

const { t } = useI18n()
const categories = TAG_CATEGORIES

const isCustomColor = computed(() => !!props.color && !props.presets.includes(props.color))
const pickerValue = computed(() =>
  props.color && /^#[0-9a-fA-F]{6}$/.test(props.color) ? props.color : '#8b9cff',
)

function onHexInput(value: string): void {
  const trimmed = value.trim()
  if (!trimmed) {
    emit('update:color', null)
    return
  }
  const hex = trimmed.startsWith('#') ? trimmed : `#${trimmed}`
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex)) emit('update:color', hex)
}
</script>

<template>
  <div class="teb">
    <header class="teb__head">
      <span
        class="teb__dot"
        :style="{ background: effectiveColor, boxShadow: `0 0 8px ${effectiveColor}` }"
      />
      <span id="tageditor-title" class="teb__eyebrow mono" :style="{ color: effectiveColor }">
        {{ t('tagEdit.title') }}
      </span>
      <span class="teb__spacer" />
      <span class="teb__uses mono">{{ t('tagEdit.uses', { count: usageLabel }) }}</span>
      <button
        type="button"
        class="teb__close"
        :aria-label="t('common.close')"
        @click="emit('close')"
      >
        <LIcon name="x" :size="13" :stroke="2" />
      </button>
    </header>

    <LField :label="t('tagEdit.nameLabel')">
      <input
        class="teb__input mono"
        :value="name"
        :aria-label="t('tagEdit.nameLabel')"
        @input="emit('update:name', ($event.target as HTMLInputElement).value)"
      />
    </LField>

    <div class="teb__block">
      <span class="teb__label mono">{{ t('tagEdit.categoryLabel') }}</span>
      <div class="teb__cats">
        <button
          v-for="cat in categories"
          :key="cat"
          type="button"
          class="teb__cat mono"
          :class="{ 'teb__cat--active': cat === category }"
          :style="{
            '--cat-c': categoryColorVar(cat),
            background:
              cat === category
                ? `color-mix(in srgb, ${categoryColorVar(cat)} 13%, transparent)`
                : 'transparent',
            color: cat === category ? categoryColorVar(cat) : 'var(--color-muted)',
            borderColor:
              cat === category
                ? `color-mix(in srgb, ${categoryColorVar(cat)} 33%, transparent)`
                : 'var(--color-border)',
          }"
          @click="emit('update:category', cat)"
        >
          {{ t(`tagEdit.category.${cat}`) }}
        </button>
      </div>
    </div>

    <div class="teb__block">
      <div class="teb__color-head">
        <span class="teb__label mono">{{ t('tagEdit.colorLabel') }}</span>
        <button
          type="button"
          class="teb__default mono"
          :class="{ 'teb__default--on': color }"
          @click="emit('update:color', null)"
        >
          {{ t('tagEdit.useCategoryDefault') }}
        </button>
      </div>
      <div class="teb__swatches">
        <LColorSwatch
          :color="categoryColorVar(category)"
          :active="!color"
          :label="t('tagEdit.categoryDefault')"
          @select="emit('update:color', null)"
        />
        <LColorSwatch
          v-for="preset in presets"
          :key="preset"
          :color="preset"
          :active="color === preset"
          :label="preset"
          @select="emit('update:color', preset)"
        />
        <label
          class="teb__custom"
          :class="{ 'teb__custom--active': isCustomColor }"
          :title="t('tagEdit.customColor')"
          :aria-label="t('tagEdit.customColor')"
        >
          <input
            type="color"
            class="teb__custom-native"
            :value="pickerValue"
            @input="emit('update:color', ($event.target as HTMLInputElement).value)"
          />
          <span
            class="teb__custom-fill"
            :style="isCustomColor && color ? { background: color } : undefined"
          >
            <LIcon v-if="!isCustomColor" name="plus" :size="14" :stroke="2.5" />
          </span>
        </label>
      </div>
      <input
        class="teb__hex mono"
        :value="color ?? ''"
        :placeholder="t('tagEdit.hexPlaceholder')"
        :aria-label="t('tagEdit.customColor')"
        @input="onHexInput(($event.target as HTMLInputElement).value)"
      />
    </div>

    <div class="teb__preview">
      <span class="teb__label mono">{{ t('tagEdit.preview') }}</span>
      <LTagChip :category="category" :color="color ?? undefined" size="md">
        {{ name || '—' }}
      </LTagChip>
    </div>

    <div class="teb__actions">
      <LButton variant="ghost" size="sm" block @click="emit('close')">{{
        t('common.cancel')
      }}</LButton>
      <LButton variant="primary" size="sm" icon="check" block @click="emit('save')">{{
        t('common.save')
      }}</LButton>
    </div>

    <button type="button" class="teb__delete mono" @click="emit('delete')">
      <LIcon name="trash" :size="12" :stroke="2" />
      {{ t('tagEdit.deleteTag') }}
    </button>

    <p class="teb__footer mono">{{ t('tagEdit.affectsAll', { count: usageLabel }) }}</p>
  </div>
</template>

<style scoped>
.teb__head {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}
.teb__dot {
  width: 8px;
  height: 8px;
  border-radius: 4px;
  flex-shrink: 0;
}
.teb__eyebrow {
  font-size: 10.5px;
  letter-spacing: 1px;
  text-transform: uppercase;
}
.teb__spacer {
  flex: 1;
}
.teb__uses {
  font-size: 10.5px;
  color: var(--color-muted);
}
.teb__close {
  color: var(--color-muted);
  padding: 2px;
  border-radius: var(--radius-s);
}
.teb__close:hover {
  color: var(--color-text);
}
.teb__input {
  width: 100%;
  height: 34px;
  padding: 0 10px;
  background: var(--color-surface2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-s);
  color: var(--color-text);
  font-size: 13px;
}
.teb__input:focus {
  outline: none;
  border-color: var(--color-border-hi);
}
.teb__block {
  margin-top: var(--space-3);
}
.teb__label {
  display: block;
  font-size: 10px;
  color: var(--color-muted);
  letter-spacing: 0.8px;
  text-transform: uppercase;
  margin-bottom: 6px;
}
.teb__cats {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
}
.teb__cat {
  padding: 4px 9px;
  font-size: 11px;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  border-radius: var(--radius-pill);
  border: 1px solid;
}
.teb__color-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}
.teb__color-head .teb__label {
  margin-bottom: 0;
}
.teb__default {
  font-size: 10px;
  letter-spacing: 0.6px;
  color: var(--color-muted);
  text-transform: uppercase;
}
.teb__default--on {
  color: var(--color-accent-text);
}
.teb__swatches {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}
.teb__custom {
  position: relative;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-s);
  border: 1.5px dashed var(--color-border-hi);
  padding: 3px;
  display: inline-flex;
  cursor: pointer;
}
.teb__custom--active {
  border-style: solid;
}
.teb__custom-native {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  border: none;
  padding: 0;
}
.teb__custom-fill {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  border-radius: 4px;
  color: var(--color-muted);
}
.teb__hex {
  margin-top: 8px;
  width: 100%;
  height: 30px;
  padding: 0 10px;
  background: var(--color-surface2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-s);
  color: var(--color-text);
  font-size: 12px;
}
.teb__hex:focus {
  outline: none;
  border-color: var(--color-border-hi);
}
.teb__preview {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-4);
  padding: 10px 12px;
  border-radius: var(--radius-s);
  background: var(--color-surface);
  border: 1px dashed var(--color-border);
}
.teb__preview .teb__label {
  margin-bottom: 0;
}
.teb__actions {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-4);
}
.teb__delete {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-top: var(--space-3);
  font-size: 10.5px;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: var(--color-muted);
}
.teb__delete:hover {
  color: var(--color-err);
}
.teb__footer {
  margin-top: var(--space-3);
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-border);
  font-size: 10px;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: var(--color-mute2);
}
</style>
