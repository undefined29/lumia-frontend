<script setup lang="ts">
import { ref, watch } from 'vue'
import type { CharacterResponseDto } from '~/types/character'

const props = withDefaults(
  defineProps<{
    open: boolean
    characterTags: string[]
    saving?: boolean
  }>(),
  { saving: false },
)

const emit = defineEmits<{
  save: [payload: { characterId: string }]
  close: []
}>()

const { t } = useI18n()
const { api } = useApi()

const candidates = ref<CharacterResponseDto[]>([])
const loading = ref(false)

watch(
  () => props.open,
  async (open) => {
    if (!open) return
    candidates.value = []
    if (!props.characterTags.length) return
    loading.value = true
    try {
      const resolved = await Promise.all(
        props.characterTags.map((tag) => api.getCharacterByTag(tag).catch(() => null)),
      )
      candidates.value = resolved.filter((c): c is CharacterResponseDto => c != null)
    } finally {
      loading.value = false
    }
  },
)

function pick(characterId: string): void {
  if (props.saving) return
  emit('save', { characterId })
}
</script>

<template>
  <LModal :open="open" :max-width="440" labelled-by="set-avatar-title" @close="emit('close')">
    <header class="sa__header">
      <div>
        <h2 id="set-avatar-title" class="sa__title">{{ t('selection.avatarTitle') }}</h2>
        <p class="sa__sub mono">{{ t('selection.avatarSub') }}</p>
      </div>
      <button type="button" class="sa__icon" :aria-label="t('common.close')" @click="emit('close')">
        <LIcon name="x" :size="18" :stroke="2" />
      </button>
    </header>

    <div class="sa__body">
      <div v-if="loading" class="sa__state">
        <LSpinner :size="18" />
      </div>
      <p v-else-if="!candidates.length" class="sa__empty">
        {{ t('selection.noCharacterOnImage') }}
      </p>
      <ul v-else class="sa__list">
        <li v-for="c in candidates" :key="c.id">
          <button type="button" class="sa__opt" :disabled="saving" @click="pick(c.id)">
            <span class="sa__opt-name">{{ c.displayName }}</span>
            <span v-if="c.tag" class="sa__opt-tag mono">{{ c.tag }}</span>
            <LSpinner v-if="saving" :size="13" class="sa__opt-spin" />
          </button>
        </li>
      </ul>
    </div>

    <footer class="sa__footer">
      <LButton variant="ghost" @click="emit('close')">{{ t('common.cancel') }}</LButton>
    </footer>
  </LModal>
</template>

<style scoped>
.sa__header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 18px 22px;
  border-bottom: 1px solid var(--color-border);
}
.sa__title {
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.2px;
}
.sa__sub {
  font-size: 11px;
  color: var(--color-muted);
  letter-spacing: 0.6px;
  margin-top: 3px;
}
.sa__icon {
  margin-left: auto;
  display: inline-flex;
  padding: 8px;
  border-radius: var(--radius-s);
  color: var(--color-muted);
}
.sa__icon:hover {
  background: var(--color-surface2);
  color: var(--color-text);
}
.sa__body {
  padding: 16px 22px;
  min-height: 80px;
}
.sa__state {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}
.sa__empty {
  color: var(--color-muted);
  font-size: 13px;
  text-align: center;
  padding: 16px 0;
}
.sa__list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  list-style: none;
  margin: 0;
  padding: 0;
}
.sa__opt {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  border-radius: var(--radius-m);
  background: var(--color-surface2);
  border: 1px solid var(--color-border);
  text-align: left;
  transition:
    background var(--dur-fast),
    border-color var(--dur-fast);
}
.sa__opt:hover:not(:disabled) {
  background: var(--color-surface3);
  border-color: var(--color-border-hi);
}
.sa__opt:disabled {
  opacity: 0.6;
}
.sa__opt-name {
  flex: 1;
  font-size: 13.5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sa__opt-tag {
  font-size: 11px;
  color: var(--color-muted);
  flex-shrink: 0;
}
.sa__opt-spin {
  color: var(--color-muted);
  flex-shrink: 0;
}
.sa__footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 22px;
  border-top: 1px solid var(--color-border);
}
</style>
