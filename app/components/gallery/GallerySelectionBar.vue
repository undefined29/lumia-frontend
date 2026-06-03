<script setup lang="ts">
defineProps<{ count: number; total: number }>()
const emit = defineEmits<{
  selectAll: []
  clear: []
  assignTags: []
  assignEpisode: []
  delete: []
}>()

const { t } = useI18n()
</script>

<template>
  <Transition name="select-bar">
    <div v-if="count > 0" class="selbar" role="toolbar" :aria-label="t('selection.label')">
      <div class="selbar__count">
        <span class="selbar__num mono">{{ count }}</span>
        <span class="selbar__count-text">{{ t('selection.selected') }}</span>
      </div>

      <span class="selbar__divider" />

      <button type="button" class="selbar__btn" @click="emit('selectAll')">
        <LIcon name="grid" :size="14" />
        <span>{{ t('selection.selectAll', { n: total }, total) }}</span>
      </button>

      <button type="button" class="selbar__btn" @click="emit('assignTags')">
        <LIcon name="edit" :size="14" />
        <span>{{ t('selection.assignTags') }}</span>
      </button>

      <button type="button" class="selbar__btn" @click="emit('assignEpisode')">
        <LIcon name="film" :size="14" />
        <span>{{ t('selection.assignEpisode') }}</span>
      </button>

      <button type="button" class="selbar__btn selbar__btn--danger" @click="emit('delete')">
        <LIcon name="trash" :size="14" />
        <span>{{ t('selection.delete') }}</span>
      </button>

      <span class="selbar__divider" />

      <button
        type="button"
        class="selbar__btn selbar__btn--ghost"
        :aria-label="t('selection.clear')"
        @click="emit('clear')"
      >
        <LIcon name="x" :size="15" :stroke="2" />
        <span>{{ t('selection.clear') }}</span>
      </button>
    </div>
  </Transition>
</template>

<style scoped>
.selbar {
  position: absolute;
  bottom: 22px;
  left: 50%;
  transform: translateX(-50%);
  z-index: var(--z-sticky);
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  border-radius: var(--radius-pill);
  background: var(--glass-bg);
  backdrop-filter: blur(16px);
  border: 1px solid var(--color-border-hi);
  box-shadow: var(--shadow-modal);
  max-width: calc(100% - 32px);
  flex-wrap: wrap;
  justify-content: center;
}
.selbar__count {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 0 8px 0 6px;
}
.selbar__num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 7px;
  border-radius: var(--radius-pill);
  background: var(--color-accent);
  color: var(--color-accent-contrast);
  font-size: 12px;
  font-weight: 700;
}
.selbar__count-text {
  font-size: 12.5px;
  color: var(--color-text2);
}
.selbar__divider {
  width: 1px;
  height: 20px;
  background: var(--color-border);
}
.selbar__btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 12px;
  border-radius: var(--radius-pill);
  font-size: 12.5px;
  font-weight: 500;
  color: var(--color-text);
  background: var(--color-surface2);
  border: 1px solid var(--color-border);
  transition:
    background var(--dur-fast),
    color var(--dur-fast);
}
.selbar__btn:hover {
  background: var(--color-surface3);
}
.selbar__btn--danger {
  color: var(--color-err);
  background: color-mix(in srgb, var(--color-err) 10%, transparent);
  border-color: color-mix(in srgb, var(--color-err) 25%, transparent);
}
.selbar__btn--danger:hover {
  background: color-mix(in srgb, var(--color-err) 18%, transparent);
}
.selbar__btn--ghost {
  background: transparent;
  color: var(--color-muted);
  border-color: transparent;
}
.selbar__btn--ghost:hover {
  color: var(--color-text);
  background: var(--color-surface2);
}

.select-bar-enter-active,
.select-bar-leave-active {
  transition:
    opacity var(--dur-base) var(--ease-out),
    transform var(--dur-base) var(--ease-out);
}
.select-bar-enter-from,
.select-bar-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(12px);
}

@media (max-width: 768px) {
  .selbar__btn span {
    display: none;
  }
  .selbar__count-text {
    display: none;
  }
}
</style>
