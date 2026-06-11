<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    saving?: boolean
    error?: string | null
  }>(),
  { saving: false, error: null },
)

const emit = defineEmits<{ submit: [url: string]; close: [] }>()

const { t } = useI18n()

const url = ref('')
const input = ref<HTMLInputElement | null>(null)

const trimmed = computed(() => url.value.trim())
const canSubmit = computed(() => !props.saving && trimmed.value.length > 0)

watch(
  () => props.open,
  async (open) => {
    if (!open) return
    url.value = ''
    await nextTick()
    input.value?.focus()
  },
)

function onSubmit(): void {
  if (!canSubmit.value) return
  emit('submit', trimmed.value)
}
</script>

<template>
  <LModal
    :open="open"
    :max-width="480"
    labelled-by="import-shiki-title"
    @close="emit('close')"
    @submit="onSubmit"
  >
    <header class="im__header">
      <h2 id="import-shiki-title" class="im__title">{{ title }}</h2>
      <button type="button" class="im__icon" :aria-label="t('common.close')" @click="emit('close')">
        <LIcon name="x" :size="18" :stroke="2" />
      </button>
    </header>

    <div class="im__body">
      <LField :label="t('library.shikimoriUrl')">
        <input
          ref="input"
          v-model="url"
          type="url"
          class="im__input"
          :placeholder="t('library.shikimoriUrlPlaceholder')"
          :aria-invalid="error ? 'true' : undefined"
          :disabled="saving"
        />
      </LField>
      <p v-if="error" class="im__error" role="alert">{{ error }}</p>
    </div>

    <footer class="im__footer">
      <LButton variant="ghost" :disabled="saving" @click="emit('close')">
        {{ t('common.cancel') }}
      </LButton>
      <LButton
        variant="primary"
        icon="download"
        :loading="saving"
        :disabled="!canSubmit"
        @click="onSubmit"
      >
        {{ t('library.import') }}
      </LButton>
    </footer>
  </LModal>
</template>

<style scoped>
.im__header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 18px 22px;
  border-bottom: 1px solid var(--color-border);
}
.im__title {
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.2px;
}
.im__icon {
  margin-left: auto;
  display: inline-flex;
  padding: 8px;
  border-radius: var(--radius-s);
  color: var(--color-muted);
}
.im__icon:hover {
  background: var(--color-surface2);
  color: var(--color-text);
}
.im__body {
  padding: 20px 22px;
}
.im__input {
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
.im__input:focus {
  background: var(--color-surface3);
  border-color: var(--color-border-hi);
}
.im__input[aria-invalid='true'] {
  border-color: var(--color-danger, #e5484d);
}
.im__error {
  margin-top: 10px;
  font-size: 12px;
  color: var(--color-danger, #e5484d);
}
.im__footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 22px;
  border-top: 1px solid var(--color-border);
}
</style>
