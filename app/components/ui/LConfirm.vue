<script setup lang="ts">
withDefaults(
  defineProps<{
    open: boolean
    title: string
    body?: string
    confirmLabel?: string
    danger?: boolean
    loading?: boolean
  }>(),
  { body: undefined, confirmLabel: undefined, danger: false, loading: false },
)
const emit = defineEmits<{ confirm: []; cancel: [] }>()
const { t } = useI18n()
</script>

<template>
  <LModal :open="open" :max-width="420" labelled-by="lconfirm-title" @close="emit('cancel')">
    <div class="lconfirm">
      <h2 id="lconfirm-title" class="lconfirm__title">{{ title }}</h2>
      <p v-if="body" class="lconfirm__body">{{ body }}</p>
      <div class="lconfirm__actions">
        <LButton variant="ghost" :disabled="loading" @click="emit('cancel')">
          {{ t('common.cancel') }}
        </LButton>
        <LButton
          :variant="danger ? 'danger' : 'primary'"
          :loading="loading"
          @click="emit('confirm')"
        >
          {{ confirmLabel || t('common.confirm') }}
        </LButton>
      </div>
    </div>
  </LModal>
</template>

<style scoped>
.lconfirm {
  padding: 22px;
}
.lconfirm__title {
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.2px;
}
.lconfirm__body {
  margin-top: 8px;
  font-size: 13.5px;
  line-height: 1.5;
  color: var(--color-text2);
}
.lconfirm__actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}
</style>
