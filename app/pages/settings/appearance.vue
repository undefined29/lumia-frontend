<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAccent } from '~/composables/useAccent'
import { normalizeHex } from '~/stores/accent'

definePageMeta({ layout: 'default' })

const { t } = useI18n()
const { color, isCustom, presets, defaultAccent, setAccent, reset } = useAccent()

useSeoMeta({
  title: () => t('seo.settingsTitle'),
  description: () => t('seo.settingsDescription'),
})

const customHex = ref(color.value)
watch(color, (next) => {
  customHex.value = next
})

const isValidCustom = computed(() => normalizeHex(customHex.value) !== null)

function onCustomInput(value: string): void {
  customHex.value = value
  const hex = normalizeHex(value)
  if (hex) setAccent(hex)
}

const canReset = computed(() => color.value !== defaultAccent)
</script>

<template>
  <SettingsShell>
    <div class="appr">
      <header class="appr__header">
        <div class="appr__eyebrow mono">{{ t('settings.appearanceTotal') }}</div>
        <h1 class="appr__title">{{ t('settings.appearanceTitle') }}</h1>
        <p class="appr__desc">{{ t('settings.appearanceDesc') }}</p>
      </header>

      <section class="appr__section">
        <div class="appr__row">
          <h2 class="appr__label">{{ t('settings.accentPresets') }}</h2>
          <button v-if="canReset" type="button" class="appr__reset" @click="reset">
            <LIcon name="x" :size="13" />
            {{ t('settings.accentReset') }}
          </button>
        </div>

        <div class="appr__swatches" role="radiogroup" :aria-label="t('settings.accentPresets')">
          <button
            v-for="preset in presets"
            :key="preset.key"
            type="button"
            class="appr__swatch"
            :class="{ 'appr__swatch--active': color === preset.color }"
            :style="{ '--swatch': preset.color }"
            role="radio"
            :aria-checked="color === preset.color"
            :aria-label="t(`settings.accent.${preset.key}`)"
            :title="t(`settings.accent.${preset.key}`)"
            @click="setAccent(preset.color)"
          >
            <LIcon
              v-if="color === preset.color"
              name="check"
              :size="16"
              class="appr__swatch-check"
            />
          </button>
        </div>
      </section>

      <section class="appr__section">
        <h2 class="appr__label">
          {{ t('settings.accentCustom') }}
          <span v-if="isCustom" class="appr__badge mono">{{
            t('settings.accentCustomActive')
          }}</span>
        </h2>
        <p class="appr__hint">{{ t('settings.accentCustomHint') }}</p>

        <div class="appr__custom">
          <input
            type="color"
            class="appr__picker"
            :value="isValidCustom ? customHex : color"
            :aria-label="t('settings.accentCustom')"
            @input="onCustomInput(($event.target as HTMLInputElement).value)"
          />
          <div class="appr__hexfield" :class="{ 'appr__hexfield--invalid': !isValidCustom }">
            <span class="appr__hash mono">#</span>
            <input
              :value="customHex.replace(/^#/, '')"
              type="text"
              inputmode="text"
              maxlength="6"
              spellcheck="false"
              autocapitalize="off"
              class="appr__hexinput mono"
              :aria-label="t('settings.accentHex')"
              @input="onCustomInput('#' + ($event.target as HTMLInputElement).value)"
            />
          </div>
        </div>
      </section>

      <section class="appr__section">
        <h2 class="appr__label">{{ t('settings.accentPreview') }}</h2>
        <div class="appr__preview">
          <button type="button" class="appr__demo-fill">{{ t('settings.accentSample') }}</button>
          <button type="button" class="appr__demo-outline">{{ t('settings.accentSample') }}</button>
          <span class="appr__demo-text">{{ t('settings.accentSample') }}</span>
          <span class="appr__demo-chip mono">#{{ color.replace(/^#/, '') }}</span>
        </div>
      </section>
    </div>
  </SettingsShell>
</template>

<style scoped>
.appr {
  max-width: 720px;
}
.appr__header {
  margin-bottom: var(--space-7);
}
.appr__eyebrow {
  font-size: 11px;
  color: var(--color-muted);
  letter-spacing: 1.4px;
  margin-bottom: 6px;
}
.appr__title {
  margin: 0;
  font-size: 26px;
  font-weight: 600;
  letter-spacing: -0.6px;
}
.appr__desc {
  margin: 6px 0 0;
  color: var(--color-muted);
  font-size: 13.5px;
}

.appr__section {
  margin-bottom: var(--space-8);
}
.appr__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}
.appr__label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin: 0 0 var(--space-3);
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
}
.appr__badge {
  font-size: 10px;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: var(--color-accent-text);
  padding: 2px 7px;
  border-radius: var(--radius-pill);
  background: var(--color-accent-dim);
}
.appr__hint {
  margin: -6px 0 var(--space-3);
  font-size: 12.5px;
  color: var(--color-muted);
}
.appr__reset {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 11px;
  font-size: 12px;
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--color-text2);
  border: 1px solid var(--color-border);
  transition: background var(--dur-fast);
}
.appr__reset:hover {
  background: var(--color-surface2);
  color: var(--color-text);
}

.appr__swatches {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}
.appr__swatch {
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-pill);
  background: var(--swatch);
  border: 2px solid var(--color-border);
  cursor: pointer;
  transition:
    transform var(--dur-fast),
    box-shadow var(--dur-fast);
}
.appr__swatch:hover {
  transform: scale(1.08);
}
.appr__swatch--active {
  border-color: var(--color-text);
  box-shadow:
    0 0 0 2px var(--color-bg),
    0 0 0 4px var(--swatch);
}
.appr__swatch-check {
  position: absolute;
  inset: 0;
  margin: auto;
  color: #0a0b0e;
}

.appr__custom {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}
.appr__picker {
  width: 44px;
  height: 44px;
  padding: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-m);
  background: var(--color-surface2);
  cursor: pointer;
}
.appr__picker::-webkit-color-swatch-wrapper {
  padding: 4px;
}
.appr__picker::-webkit-color-swatch {
  border: none;
  border-radius: var(--radius-s);
}
.appr__hexfield {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 0 12px;
  height: 44px;
  background: var(--color-surface2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-m);
}
.appr__hexfield--invalid {
  border-color: var(--color-err);
}
.appr__hash {
  color: var(--color-muted);
  font-size: 14px;
}
.appr__hexinput {
  width: 80px;
  background: transparent;
  border: 0;
  color: var(--color-text);
  font-size: 14px;
  letter-spacing: 0.5px;
  text-transform: lowercase;
}
.appr__hexinput:focus {
  outline: none;
}

.appr__preview {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-3);
  padding: var(--space-5);
  border-radius: var(--radius-l);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}
.appr__demo-fill {
  padding: 8px 16px;
  border-radius: var(--radius-m);
  background: var(--color-accent);
  color: var(--color-accent-contrast);
  font-weight: 600;
  font-size: 13px;
  box-shadow: var(--glow-accent);
}
.appr__demo-outline {
  padding: 8px 16px;
  border-radius: var(--radius-m);
  background: var(--color-accent-dim);
  color: var(--color-accent-text);
  border: 1px solid var(--color-accent-text);
  font-weight: 600;
  font-size: 13px;
}
.appr__demo-text {
  color: var(--color-accent-text);
  font-weight: 600;
  font-size: 14px;
}
.appr__demo-chip {
  margin-left: auto;
  font-size: 12px;
  color: var(--color-muted);
}

@media (max-width: 768px) {
  .appr__demo-chip {
    margin-left: 0;
  }
}
</style>
