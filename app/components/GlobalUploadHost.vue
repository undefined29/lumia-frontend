<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useUpload } from '~/composables/useUpload'

const { start, registerPicker, suppressGlobalDrop } = useUpload()

const dragging = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
let depth = 0

function hasFiles(e: DragEvent): boolean {
  return !!e.dataTransfer && Array.from(e.dataTransfer.types).includes('Files')
}

function onDragEnter(e: DragEvent): void {
  if (!hasFiles(e) || suppressGlobalDrop.value) return
  depth++
  dragging.value = true
}
function onDragOver(e: DragEvent): void {
  if (hasFiles(e)) e.preventDefault()
}
function onDragLeave(): void {
  depth = Math.max(0, depth - 1)
  if (depth === 0) dragging.value = false
}
async function onDrop(e: DragEvent): Promise<void> {
  if (!hasFiles(e)) return
  e.preventDefault()
  depth = 0
  dragging.value = false
  if (suppressGlobalDrop.value) return
  const files = Array.from(e.dataTransfer?.files ?? []).filter((f) => f.type.startsWith('image/'))
  if (files.length) await start(files)
}

function onPick(event: Event): void {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? []).filter((f) => f.type.startsWith('image/'))
  if (files.length) void start(files)
  input.value = ''
}

onMounted(() => {
  window.addEventListener('dragenter', onDragEnter)
  window.addEventListener('dragover', onDragOver)
  window.addEventListener('dragleave', onDragLeave)
  window.addEventListener('drop', onDrop)
  registerPicker(() => fileInput.value?.click())
})
onUnmounted(() => {
  window.removeEventListener('dragenter', onDragEnter)
  window.removeEventListener('dragover', onDragOver)
  window.removeEventListener('dragleave', onDragLeave)
  window.removeEventListener('drop', onDrop)
  registerPicker(null)
})
</script>

<template>
  <div>
    <input ref="fileInput" type="file" accept="image/*" multiple hidden @change="onPick" />
    <DropOverlay :active="dragging" />
    <UploadModal />
  </div>
</template>
