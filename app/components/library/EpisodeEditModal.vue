<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue'
import type { EpisodeView } from '~/types/view'

const props = withDefaults(
  defineProps<{
    open: boolean
    episode: EpisodeView | null
    saving?: boolean
    error?: string | null
  }>(),
  { saving: false, error: null },
)

const emit = defineEmits<{
  submit: [payload: { title: string | null }]
  close: []
}>()

const { t } = useI18n()

const title = ref('')
const titleInput = ref<HTMLInputElement | null>(null)

const numberLabel = computed(() =>
  props.episode ? `E${String(props.episode.number).padStart(2, '0')}` : '',
)

watch(
  () => props.open,
  async (open) => {
    if (!open || !props.episode) return
    title.value = props.episode.title ?? ''
    await nextTick()
    titleInput.value?.focus()
    titleInput.value?.select()
  },
)

function onSubmit(): void {
  if (props.saving) return
  const trimmed = title.value.trim()
  emit('submit', { title: trimmed || null })
}
</script>

<template>
  <LModal
    :open="open"
    :max-width="460"
    labelled-by="edit-episode-title"
    @close="emit('close')"
    @submit="onSubmit"
  >
    <header class="ee__header">
      <h2 id="edit-episode-title" class="ee__title">
        {{ t('library.editEpisode') }}
        <span v-if="numberLabel" class="ee__num mono">{{ numberLabel }}</span>
      </h2>
      <button type="button" class="ee__icon" :aria-label="t('common.close')" @click="emit('close')">
        <LIcon name="x" :size="18" :stroke="2" />
      </button>
    </header>

    <div class="ee__body">
      <LField :label="t('library.episodeTitleLabel')">
        <input
          ref="titleInput"
          v-model="title"
          type="text"
          class="ee__input"
          :placeholder="t('library.episodeTitlePlaceholder')"
          :disabled="saving"
        />
      </LField>
      <p v-if="error" class="ee__error" role="alert">{{ error }}</p>
    </div>

    <footer class="ee__footer">
      <span class="ee__footer-spacer" />
      <LButton variant="ghost" :disabled="saving" @click="emit('close')">
        {{ t('common.cancel') }}
      </LButton>
      <LButton variant="primary" icon="check" :loading="saving" @click="onSubmit">
        {{ t('common.save') }}
      </LButton>
    </footer>
  </LModal>
</template>

<style scoped>
.ee__header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 18px 22px;
  border-bottom: 1px solid var(--color-border);
}
.ee__title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.2px;
}
.ee__num {
  font-size: 11px;
  color: var(--color-muted);
  padding: 2px 7px;
  border-radius: var(--radius-pill);
  background: var(--color-surface2);
}
.ee__icon {
  margin-left: auto;
  display: inline-flex;
  padding: 8px;
  border-radius: var(--radius-s);
  color: var(--color-muted);
}
.ee__icon:hover {
  background: var(--color-surface2);
  color: var(--color-text);
}
.ee__body {
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.ee__input {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  background: var(--color-surface2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-m);
  font-size: 13px;
  color: var(--color-text);
  outline: none;
  transition:
    background var(--dur-fast),
    border-color var(--dur-fast);
}
.ee__input:focus {
  background: var(--color-surface3);
  border-color: var(--color-border-hi);
}
.ee__error {
  font-size: 12px;
  color: var(--color-err);
}
.ee__footer {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 22px;
  border-top: 1px solid var(--color-border);
}
.ee__footer-spacer {
  flex: 1;
}
</style>
