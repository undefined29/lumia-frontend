<script setup lang="ts">
import type { CharacterView } from '~/types/view'
import { formatCount } from '~/utils/format'

const props = withDefaults(
  defineProps<{
    character: CharacterView
    selectable?: boolean
    selected?: boolean
  }>(),
  { selectable: false, selected: false },
)

const emit = defineEmits<{
  open: []
  select: [id: string, modifiers: { shift: boolean; meta: boolean }]
}>()

const { t, locale } = useI18n()

function onClick(event: MouseEvent): void {
  const meta = event.metaKey || event.ctrlKey
  if (props.selectable || meta || event.shiftKey) {
    event.preventDefault()
    emit('select', props.character.id, { shift: event.shiftKey, meta })
    return
  }
  emit('open')
}

function onCheckbox(event: MouseEvent): void {
  event.preventDefault()
  event.stopPropagation()
  emit('select', props.character.id, {
    shift: event.shiftKey,
    meta: event.metaKey || event.ctrlKey,
  })
}
</script>

<template>
  <button
    type="button"
    class="char-card"
    :class="{ 'char-card--selectable': selectable, 'char-card--selected': selected }"
    :data-character-id="character.id"
    @click="onClick"
  >
    <span
      class="char-card__check"
      :class="{ 'char-card__check--on': selected }"
      role="checkbox"
      :aria-checked="selected"
      :aria-label="t('settings.selectCharacter')"
      @click="onCheckbox"
    >
      <LIcon v-if="selected" name="check" :size="12" :stroke="2.5" />
    </span>

    <LAvatar
      :name="character.displayName"
      :src="character.avatarUrl"
      :hue="character.hue"
      :size="56"
      class="char-card__avatar"
    />
    <div class="char-card__body">
      <div class="char-card__name">{{ character.displayName }}</div>
      <div class="char-card__tag mono">{{ character.tagName }}</div>
      <span class="char-card__usage mono">
        <span class="char-card__usage-dot" />
        {{
          t(
            'settings.usedIn',
            { n: formatCount(character.usedInCount, locale) },
            character.usedInCount,
          )
        }}
      </span>
    </div>
    <LIcon name="chevR" :size="14" class="char-card__chev" />
  </button>
</template>

<style scoped>
.char-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px;
  border-radius: var(--radius-m);
  cursor: pointer;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  text-align: left;
  width: 100%;
  transition:
    background var(--dur-fast),
    border-color var(--dur-fast),
    box-shadow var(--dur-fast);
}
.char-card:hover {
  background: var(--color-surface2);
  border-color: var(--color-border-hi);
}
.char-card--selected,
.char-card--selected:hover {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 1px var(--color-accent);
}
.char-card__avatar {
  border-radius: var(--radius-m);
}

.char-card__check {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
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
.char-card:hover .char-card__check,
.char-card--selectable .char-card__check,
.char-card--selected .char-card__check {
  opacity: 1;
}
.char-card__check--on {
  background: var(--color-accent);
  border-color: var(--color-accent);
}
.char-card__body {
  flex: 1;
  min-width: 0;
}
.char-card__name {
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 1px;
}
.char-card__tag {
  font-size: 11px;
  color: var(--color-muted);
  margin-bottom: 4px;
}
.char-card__usage {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 10.5px;
  letter-spacing: 0.4px;
  color: var(--cat-character);
  padding: 2px 7px;
  border-radius: var(--radius-pill);
  background: color-mix(in srgb, var(--cat-character) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--cat-character) 20%, transparent);
}
.char-card__usage-dot {
  width: 4px;
  height: 4px;
  border-radius: 2px;
  background: var(--cat-character);
}
.char-card__chev {
  color: var(--color-muted);
  flex-shrink: 0;
}
</style>
