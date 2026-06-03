<script setup lang="ts">
import type { TagView } from '~/types/view'
import { formatCount } from '~/utils/format'

defineProps<{ tags: Array<TagView & { id: number; count: number }> }>()
const emit = defineEmits<{ edit: [TagView & { id: number; count: number }] }>()

const { t, locale } = useI18n()
</script>

<template>
  <div class="tags-table">
    <div class="tags-table__head mono">
      <span>{{ t('settings.tag') }}</span>
      <span>{{ t('settings.category') }}</span>
      <span>{{ t('settings.uses') }}</span>
      <span />
    </div>
    <div class="tags-table__body">
      <div v-for="tag in tags" :key="tag.name" class="tags-table__row">
        <span class="tags-table__chip">
          <LTagChip
            :category="tag.category"
            :color="tag.color"
            size="md"
            clickable
            @select="emit('edit', tag)"
          >
            {{ tag.name }}
          </LTagChip>
        </span>
        <span class="tags-table__cat mono">{{ tag.category }}</span>
        <span class="tags-table__uses mono">{{ formatCount(tag.count, locale) }}</span>
        <div class="tags-table__actions">
          <button
            type="button"
            class="tags-table__action"
            :aria-label="t('common.edit')"
            @click="emit('edit', tag)"
          >
            <LIcon name="edit" :size="13" />
          </button>
        </div>
      </div>
      <div v-if="tags.length === 0" class="tags-table__empty">
        {{ t('settings.noTagsMatch') }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.tags-table {
  border-radius: var(--radius-m);
  border: 1px solid var(--color-border);
  overflow: hidden;
  background: var(--color-bg2);
}
.tags-table__head {
  display: grid;
  grid-template-columns: 1.8fr 1fr 100px 70px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--color-border);
  font-size: 10px;
  color: var(--color-muted);
  letter-spacing: 1px;
  background: var(--color-bg);
}
.tags-table__body {
  max-height: calc(100dvh - 420px);
  overflow-y: auto;
}
.tags-table__row {
  display: grid;
  grid-template-columns: 1.8fr 1fr 100px 70px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--color-border);
  align-items: center;
  font-size: 13px;
}
.tags-table__row:last-child {
  border-bottom: 0;
}
.tags-table__chip {
  display: inline-flex;
  align-items: center;
  min-width: 0;
}
.tags-table__cat {
  font-size: 11px;
  color: var(--color-muted);
  letter-spacing: 0.6px;
  text-transform: uppercase;
}
.tags-table__uses {
  font-size: 12px;
  color: var(--color-text2);
}
.tags-table__actions {
  display: flex;
  gap: var(--space-1);
  justify-content: flex-end;
}
.tags-table__action {
  color: var(--color-muted);
  padding: 6px;
  border-radius: var(--radius-s);
  display: inline-flex;
  transition: background var(--dur-fast);
}
.tags-table__action:hover {
  background: var(--color-surface2);
  color: var(--color-text2);
}
.tags-table__empty {
  padding: 40px 16px;
  text-align: center;
  color: var(--color-muted);
  font-size: 13px;
}

@media (max-width: 768px) {
  .tags-table__head,
  .tags-table__row {
    grid-template-columns: 1fr 70px 56px;
  }
  .tags-table__head span:nth-child(2),
  .tags-table__cat {
    display: none;
  }
}
</style>
