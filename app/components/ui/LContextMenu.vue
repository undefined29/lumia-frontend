<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps<{ open: boolean; x: number; y: number }>()
const emit = defineEmits<{ close: [] }>()

const VIEWPORT_MARGIN = 8

const menu = ref<HTMLElement | null>(null)
const style = ref<Record<string, string>>({})

function reposition(): void {
  let left = props.x
  let top = props.y
  const el = menu.value
  if (el) {
    const w = el.offsetWidth
    const h = el.offsetHeight
    if (left + w + VIEWPORT_MARGIN > window.innerWidth)
      left = window.innerWidth - w - VIEWPORT_MARGIN
    if (top + h + VIEWPORT_MARGIN > window.innerHeight)
      top = window.innerHeight - h - VIEWPORT_MARGIN
  }
  style.value = {
    left: `${Math.max(VIEWPORT_MARGIN, left)}px`,
    top: `${Math.max(VIEWPORT_MARGIN, top)}px`,
  }
}

watch(
  () => [props.open, props.x, props.y] as const,
  ([open]) => {
    if (!open) return
    reposition()
    void nextTick(() => reposition())
  },
  { immediate: true },
)

function onDocPointer(e: MouseEvent): void {
  if (menu.value?.contains(e.target as Node)) return
  emit('close')
}
function onKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape') emit('close')
}
function onDismiss(): void {
  if (props.open) emit('close')
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocPointer, true)
  document.addEventListener('keydown', onKeydown)
  window.addEventListener('scroll', onDismiss, true)
  window.addEventListener('resize', onDismiss)
})
onUnmounted(() => {
  document.removeEventListener('pointerdown', onDocPointer, true)
  document.removeEventListener('keydown', onKeydown)
  window.removeEventListener('scroll', onDismiss, true)
  window.removeEventListener('resize', onDismiss)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="open" ref="menu" class="ctxmenu" :style="style" role="menu">
        <slot :close="() => emit('close')" />
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.ctxmenu {
  position: fixed;
  z-index: var(--z-popover);
  min-width: 180px;
  max-width: min(280px, calc(100vw - 24px));
  background: var(--color-surface);
  border: 1px solid var(--color-border-hi);
  border-radius: var(--radius-m);
  box-shadow: var(--shadow-card);
  padding: 4px;
}
</style>
