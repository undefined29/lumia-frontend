<script setup lang="ts">
import { useToasts, type ToastTone } from '~/composables/useToasts'

const { toasts, dismiss } = useToasts()

const TONE_VAR: Record<ToastTone, string> = {
  info: 'var(--color-accent)',
  success: 'var(--color-ok)',
  warn: 'var(--color-warn)',
  error: 'var(--color-err)',
}
</script>

<template>
  <div class="toasts" role="region" aria-live="polite" aria-label="Notifications">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast"
        :style="{ '--toast-accent': TONE_VAR[toast.tone] }"
        role="status"
      >
        <span class="toast__message">{{ toast.message }}</span>
        <button type="button" class="toast__close" aria-label="Dismiss" @click="dismiss(toast.id)">
          <LIcon name="x" :size="14" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toasts {
  position: fixed;
  bottom: var(--space-5);
  right: var(--space-5);
  z-index: var(--z-toast);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  max-width: min(360px, calc(100vw - var(--space-8)));
  pointer-events: none;
}
.toast {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 10px 12px 10px 14px;
  background: var(--color-surface);
  border: 1px solid var(--color-border-hi);
  border-left: 3px solid var(--toast-accent);
  border-radius: var(--radius-m);
  box-shadow: var(--shadow-card);
}
.toast__message {
  flex: 1;
  font-size: 13px;
  line-height: 1.4;
  color: var(--color-text);
}
.toast__close {
  flex-shrink: 0;
  display: inline-flex;
  padding: 2px;
  color: var(--color-muted);
  background: transparent;
  border: 0;
  border-radius: var(--radius-s);
  cursor: pointer;
  transition: color var(--dur-fast);
}
.toast__close:hover {
  color: var(--color-text);
}

.toast-enter-active,
.toast-leave-active {
  transition:
    opacity var(--dur-base),
    transform var(--dur-base);
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(12px);
}
.toast-leave-active {
  position: absolute;
  right: 0;
}
</style>
