<script setup lang="ts">
import { computed } from 'vue'
import type { TagCategory } from '~/types/tag'
import { categoryColorVar } from '~/utils/tags'

const props = withDefaults(
  defineProps<{
    category?: TagCategory
    color?: string
    count?: number
    size?: 'sm' | 'md'
    removable?: boolean
    clickable?: boolean
  }>(),
  {
    category: 'general',
    size: 'md',
    removable: false,
    clickable: false,
    color: undefined,
    count: undefined,
  },
)

const emit = defineEmits<{ remove: []; select: [] }>()

const color = computed(() => props.color || categoryColorVar(props.category))
</script>

<template>
  <component
    :is="clickable ? 'button' : 'span'"
    class="chip"
    :class="[`chip--${size}`, { 'chip--clickable': clickable }]"
    :style="{
      '--chip-color': color,
      background: `color-mix(in srgb, ${color} 12%, transparent)`,
      borderColor: `color-mix(in srgb, ${color} 20%, transparent)`,
      color,
    }"
    @click="clickable && emit('select')"
  >
    <span class="chip__dot" :style="{ background: color }" />
    <span class="chip__label"><slot /></span>
    <span v-if="count != null" class="chip__count">{{ count }}</span>
    <button
      v-if="removable"
      type="button"
      class="chip__remove"
      :aria-label="`Remove`"
      @click.stop="emit('remove')"
    >
      <LIcon name="x" :size="size === 'sm' ? 10 : 11" :stroke="2" />
    </button>
  </component>
</template>

<style scoped>
.chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  max-width: 100%;
  border: 1px solid;
  border-radius: var(--radius-pill);
  font-family: var(--font-mono);
  font-weight: 500;
  white-space: nowrap;
  transition: background var(--dur-fast);
}
.chip__label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}
.chip--md {
  padding: 3px 9px 3px 8px;
  font-size: 12.5px;
  gap: 6px;
}
.chip--sm {
  padding: 2px 7px 2px 6px;
  font-size: 11px;
}
.chip--clickable {
  cursor: pointer;
}
.chip--clickable:hover {
  background: color-mix(in srgb, var(--chip-color) 20%, transparent) !important;
}
.chip__dot {
  width: 6px;
  height: 6px;
  border-radius: 3px;
  flex-shrink: 0;
  box-shadow: 0 0 6px color-mix(in srgb, var(--chip-color) 67%, transparent);
}
.chip--sm .chip__dot {
  width: 5px;
  height: 5px;
}
.chip__count {
  opacity: 0.55;
  margin-left: 2px;
}
.chip__remove {
  margin-left: 2px;
  opacity: 0.6;
  display: inline-flex;
  align-items: center;
  border-radius: var(--radius-pill);
}
.chip__remove:hover {
  opacity: 1;
}
</style>
