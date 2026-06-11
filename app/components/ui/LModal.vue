<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    maxWidth?: number
    labelledBy?: string
    closeOnBackdrop?: boolean
  }>(),
  { maxWidth: 560, closeOnBackdrop: true, labelledBy: undefined },
)
const emit = defineEmits<{ close: []; submit: [] }>()

const panel = ref<HTMLElement | null>(null)
const openRef = computed(() => props.open)
const reduced = useReducedMotion()
const transition = computed(() => (reduced.value ? undefined : 'modal'))

useFocusTrap(panel, { active: openRef, onEscape: () => emit('close') })

// Input types that should not trigger submit on Enter (or where Enter is meaningless).
const NON_SUBMIT_INPUT_TYPES = new Set([
  'checkbox',
  'radio',
  'button',
  'submit',
  'reset',
  'file',
  'range',
  'color',
])

// Enter inside a text field triggers the modal's primary action. Components that
// own Enter for their own purposes (e.g. tag autocomplete) call preventDefault,
// which sets defaultPrevented and makes us skip — avoiding any double-handling.
function onPanelKeydown(e: KeyboardEvent): void {
  if (e.key !== 'Enter' || e.shiftKey || e.isComposing || e.defaultPrevented) return
  const target = e.target as HTMLElement | null
  if (!target || target.tagName !== 'INPUT') return
  if (NON_SUBMIT_INPUT_TYPES.has((target as HTMLInputElement).type)) return
  e.preventDefault()
  emit('submit')
}

watch(
  () => props.open,
  (open) => {
    if (!import.meta.client) return
    document.body.style.overflow = open ? 'hidden' : ''
  },
)
</script>

<template>
  <Teleport to="body">
    <Transition :name="transition">
      <div v-if="open" class="modal" @click.self="closeOnBackdrop && emit('close')">
        <div
          ref="panel"
          class="modal__panel"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="labelledBy"
          tabindex="-1"
          :style="{ maxWidth: `${maxWidth}px` }"
          @keydown="onPanelKeydown"
        >
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-8);
  background: var(--scrim);
  backdrop-filter: blur(8px);
}
.modal__panel {
  width: 100%;
  max-height: calc(100dvh - 64px);
  overflow: hidden;
  background: var(--color-bg2);
  border: 1px solid var(--color-border-hi);
  border-radius: var(--radius-l);
  box-shadow: var(--shadow-modal);
  display: flex;
  flex-direction: column;
}
@media (max-width: 768px) {
  .modal {
    padding: var(--space-3);
    align-items: flex-end;
  }
  .modal__panel {
    max-height: 92dvh;
  }
}
</style>
