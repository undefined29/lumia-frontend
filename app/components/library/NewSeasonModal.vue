<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    defaultNumber: number
    saving?: boolean
    error?: string | null
  }>(),
  { saving: false, error: null },
)

const emit = defineEmits<{ submit: [payload: { number: number; title?: string }]; close: [] }>()

const { t } = useI18n()

const number = ref(props.defaultNumber)
const title = ref('')
const numberInput = ref<HTMLInputElement | null>(null)

const canSubmit = computed(() => !props.saving && Number.isFinite(number.value) && number.value > 0)

watch(
  () => props.open,
  async (open) => {
    if (!open) return
    number.value = props.defaultNumber
    title.value = ''
    await nextTick()
    numberInput.value?.focus()
  },
)

function onSubmit(): void {
  if (!canSubmit.value) return
  const trimmedTitle = title.value.trim()
  emit('submit', { number: number.value, title: trimmedTitle || undefined })
}
</script>

<template>
  <LModal
    :open="open"
    :max-width="440"
    labelled-by="new-season-title"
    @close="emit('close')"
    @submit="onSubmit"
  >
    <header class="ns__header">
      <h2 id="new-season-title" class="ns__title">{{ t('library.newSeason') }}</h2>
      <button type="button" class="ns__icon" :aria-label="t('common.close')" @click="emit('close')">
        <LIcon name="x" :size="18" :stroke="2" />
      </button>
    </header>

    <div class="ns__body">
      <LField :label="t('library.seasonNumber')">
        <input
          ref="numberInput"
          v-model.number="number"
          type="number"
          min="1"
          step="1"
          class="ns__input ns__input--num"
          :disabled="saving"
        />
      </LField>
      <LField :label="t('library.seasonTitleOptional')">
        <input
          v-model="title"
          type="text"
          class="ns__input"
          :placeholder="t('library.seasonTitlePlaceholder')"
          :disabled="saving"
        />
      </LField>
      <p v-if="error" class="ns__error" role="alert">{{ error }}</p>
    </div>

    <footer class="ns__footer">
      <LButton variant="ghost" :disabled="saving" @click="emit('close')">
        {{ t('common.cancel') }}
      </LButton>
      <LButton
        variant="primary"
        icon="plus"
        :loading="saving"
        :disabled="!canSubmit"
        @click="onSubmit"
      >
        {{ t('common.add') }}
      </LButton>
    </footer>
  </LModal>
</template>

<style scoped>
.ns__header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 18px 22px;
  border-bottom: 1px solid var(--color-border);
}
.ns__title {
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.2px;
}
.ns__icon {
  margin-left: auto;
  display: inline-flex;
  padding: 8px;
  border-radius: var(--radius-s);
  color: var(--color-muted);
}
.ns__icon:hover {
  background: var(--color-surface2);
  color: var(--color-text);
}
.ns__body {
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.ns__input {
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
.ns__input--num {
  width: 120px;
}
.ns__input:focus {
  background: var(--color-surface3);
  border-color: var(--color-border-hi);
}
.ns__error {
  font-size: 12px;
  color: var(--color-danger, #e5484d);
}
.ns__footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 22px;
  border-top: 1px solid var(--color-border);
}
</style>
