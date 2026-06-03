<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue'
import type { SeasonView } from '~/types/view'

const props = withDefaults(
  defineProps<{
    open: boolean
    season: SeasonView | null
    saving?: boolean
    deleting?: boolean
    error?: string | null
  }>(),
  { saving: false, deleting: false, error: null },
)

const emit = defineEmits<{
  submit: [payload: { number: number; title: string | null }]
  delete: []
  close: []
}>()

const { t } = useI18n()

const number = ref(1)
const title = ref('')
const confirmingDelete = ref(false)
const numberInput = ref<HTMLInputElement | null>(null)

const busy = computed(() => props.saving || props.deleting)
const canSubmit = computed(() => !busy.value && Number.isFinite(number.value) && number.value > 0)

watch(
  () => props.open,
  async (open) => {
    if (!open || !props.season) return
    number.value = props.season.number
    title.value = props.season.title ?? ''
    confirmingDelete.value = false
    await nextTick()
    numberInput.value?.focus()
  },
)

function onSubmit(): void {
  if (!canSubmit.value) return
  const trimmed = title.value.trim()
  emit('submit', { number: number.value, title: trimmed || null })
}
</script>

<template>
  <LModal :open="open" :max-width="500" labelled-by="edit-season-title" @close="emit('close')">
    <header class="es__header">
      <h2 id="edit-season-title" class="es__title">{{ t('library.editSeason') }}</h2>
      <button type="button" class="es__icon" :aria-label="t('common.close')" @click="emit('close')">
        <LIcon name="x" :size="18" :stroke="2" />
      </button>
    </header>

    <form class="es__body" @submit.prevent="onSubmit">
      <LField :label="t('library.seasonNumber')">
        <input
          ref="numberInput"
          v-model.number="number"
          type="number"
          min="1"
          step="1"
          class="es__input es__input--num"
          :disabled="busy"
        />
      </LField>
      <LField :label="t('library.seasonTitleOptional')">
        <input
          v-model="title"
          type="text"
          class="es__input"
          :placeholder="t('library.seasonTitlePlaceholder')"
          :disabled="busy"
        />
      </LField>
      <p v-if="error" class="es__error" role="alert">{{ error }}</p>
    </form>

    <footer v-if="confirmingDelete" class="es__footer es__footer--confirm">
      <span class="es__confirm-text">{{ t('library.deleteSeasonConfirm') }}</span>
      <span class="es__footer-spacer" />
      <LButton variant="ghost" :disabled="deleting" @click="confirmingDelete = false">
        {{ t('common.cancel') }}
      </LButton>
      <LButton variant="danger" icon="trash" :loading="deleting" @click="emit('delete')">
        {{ t('common.delete') }}
      </LButton>
    </footer>

    <footer v-else class="es__footer">
      <LButton variant="danger" icon="trash" :disabled="busy" @click="confirmingDelete = true">
        {{ t('library.deleteSeason') }}
      </LButton>
      <span class="es__footer-spacer" />
      <LButton variant="ghost" :disabled="busy" @click="emit('close')">
        {{ t('common.cancel') }}
      </LButton>
      <LButton
        variant="primary"
        icon="check"
        :loading="saving"
        :disabled="!canSubmit"
        @click="onSubmit"
      >
        {{ t('common.save') }}
      </LButton>
    </footer>
  </LModal>
</template>

<style scoped>
.es__header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 18px 22px;
  border-bottom: 1px solid var(--color-border);
}
.es__title {
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.2px;
}
.es__icon {
  margin-left: auto;
  display: inline-flex;
  padding: 8px;
  border-radius: var(--radius-s);
  color: var(--color-muted);
}
.es__icon:hover {
  background: var(--color-surface2);
  color: var(--color-text);
}
.es__body {
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.es__input {
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
.es__input--num {
  width: 120px;
}
.es__input:focus {
  background: var(--color-surface3);
  border-color: var(--color-border-hi);
}
.es__error {
  font-size: 12px;
  color: var(--color-err);
}
.es__footer {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 22px;
  border-top: 1px solid var(--color-border);
}
.es__footer-spacer {
  flex: 1;
}
.es__footer--confirm {
  gap: 12px;
}
.es__confirm-text {
  font-size: 12.5px;
  color: var(--color-text2);
}
</style>
