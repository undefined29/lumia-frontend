<script setup lang="ts">
import { computed } from 'vue'
import { isAdministrator } from '~/utils/bitmask'
import { PERM_FLAGS } from './perms'

const props = defineProps<{ mask: number }>()
const { t } = useI18n()

type Tone = 'admin' | 'full' | 'partial' | 'none'

const tone = computed<Tone>(() => {
  if (isAdministrator(props.mask)) return 'admin'
  const on = PERM_FLAGS.filter((f) => (props.mask & f.bit) !== 0).length
  if (on === 0) return 'none'
  if (on === PERM_FLAGS.length) return 'full'
  return 'partial'
})

const onCount = computed(() => PERM_FLAGS.filter((f) => (props.mask & f.bit) !== 0).length)

const label = computed(() => {
  switch (tone.value) {
    case 'admin':
      return t('settings.administrator')
    case 'full':
      return t('settings.allFlags')
    case 'none':
      return t('settings.noPermissions')
    default:
      return t('settings.nOfFour', { n: onCount.value, total: PERM_FLAGS.length })
  }
})

const colorVar = computed(() => {
  switch (tone.value) {
    case 'admin':
      return 'var(--color-warn)'
    case 'full':
      return 'var(--color-accent-text)'
    case 'partial':
      return 'var(--cat-character)'
    default:
      return 'var(--color-muted)'
  }
})
</script>

<template>
  <span
    class="perm-summary"
    :style="{
      '--ps-color': colorVar,
      background: `color-mix(in srgb, ${colorVar} 10%, transparent)`,
      borderColor: `color-mix(in srgb, ${colorVar} 20%, transparent)`,
      color: colorVar,
    }"
  >
    <LIcon v-if="tone === 'admin'" name="star" :size="10" :stroke="1.6" />
    <span v-else class="perm-summary__dot" :style="{ background: colorVar }" />
    {{ label }}
  </span>
</template>

<style scoped>
.perm-summary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 9px;
  border-radius: var(--radius-pill);
  border: 1px solid;
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.6px;
  font-weight: 500;
}
.perm-summary__dot {
  width: 5px;
  height: 5px;
  border-radius: 3px;
  box-shadow: 0 0 6px color-mix(in srgb, var(--ps-color) 67%, transparent);
}
</style>
