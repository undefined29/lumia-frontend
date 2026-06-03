<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

const props = withDefaults(defineProps<{ disabled?: boolean; align?: 'left' | 'right' }>(), {
  disabled: false,
  align: 'left',
})
const emit = defineEmits<{ open: []; close: [] }>()

const MENU_GAP = 4
const MENU_MAX_H = 280
const VIEWPORT_MARGIN = 8
const MIN_MENU_H = 120

const open = ref(false)
const root = ref<HTMLElement | null>(null)
const menu = ref<HTMLElement | null>(null)
const menuStyle = ref<Record<string, string>>({})

function toggle(): void {
  if (props.disabled) return
  if (open.value) close()
  else show()
}
function show(): void {
  open.value = true
  emit('open')
  updatePosition()
  void nextTick(() => updatePosition())
}
function close(): void {
  if (!open.value) return
  open.value = false
  emit('close')
}

function updatePosition(): void {
  const anchor = root.value
  if (!anchor) return
  const r = anchor.getBoundingClientRect()
  const vw = window.innerWidth
  const vh = window.innerHeight

  const spaceBelow = vh - r.bottom - MENU_GAP - VIEWPORT_MARGIN
  const spaceAbove = r.top - MENU_GAP - VIEWPORT_MARGIN
  const desired = menu.value ? Math.min(menu.value.scrollHeight, MENU_MAX_H) : MENU_MAX_H
  const flipUp = spaceBelow < desired && spaceAbove > spaceBelow
  const maxH = Math.max(MIN_MENU_H, Math.min(MENU_MAX_H, flipUp ? spaceAbove : spaceBelow))

  const style: Record<string, string> = {
    minWidth: `${r.width}px`,
    maxHeight: `${maxH}px`,
  }
  if (flipUp) style.bottom = `${vh - r.top + MENU_GAP}px`
  else style.top = `${r.bottom + MENU_GAP}px`
  if (props.align === 'right') style.right = `${vw - r.right}px`
  else style.left = `${r.left}px`
  menuStyle.value = style
}

function onDocClick(e: MouseEvent): void {
  const target = e.target as Node
  if (root.value?.contains(target)) return
  if (menu.value?.contains(target)) return
  close()
}
function onKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape') close()
}
function onReposition(): void {
  if (open.value) updatePosition()
}

onMounted(() => {
  document.addEventListener('mousedown', onDocClick)
  document.addEventListener('keydown', onKeydown)
  window.addEventListener('scroll', onReposition, true)
  window.addEventListener('resize', onReposition)
})
onUnmounted(() => {
  document.removeEventListener('mousedown', onDocClick)
  document.removeEventListener('keydown', onKeydown)
  window.removeEventListener('scroll', onReposition, true)
  window.removeEventListener('resize', onReposition)
})

defineExpose({ close })
</script>

<template>
  <div ref="root" class="dropdown">
    <slot name="trigger" :open="open" :toggle="toggle" />
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="open" ref="menu" class="dropdown__menu" :style="menuStyle" role="listbox">
          <slot name="menu" :close="close" />
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.dropdown {
  position: relative;
}
.dropdown__menu {
  position: fixed;
  width: max-content;
  max-width: min(280px, calc(100vw - 24px));
  z-index: var(--z-popover);
  background: var(--color-surface);
  border: 1px solid var(--color-border-hi);
  border-radius: var(--radius-m);
  box-shadow: var(--shadow-card);
  padding: 4px;
  overflow-y: auto;
}
</style>
