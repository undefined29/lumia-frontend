<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ImageView } from '~/types/view'

const emit = defineEmits<{ done: [] }>()

const { api } = useApi()

const target = ref<ImageView | null>(null)
const avatarOpen = ref(false)
const coverOpen = ref(false)
const saving = ref(false)

const characterTags = computed(() =>
  (target.value?.tagGroups.character ?? []).map((tag) => tag.name),
)
const currentSeriesId = computed(() => target.value?.seriesId ?? null)

function openSetAvatar(image: ImageView): void {
  target.value = image
  avatarOpen.value = true
}
function openSetCover(image: ImageView): void {
  target.value = image
  coverOpen.value = true
}

async function onSetAvatar(payload: { characterId: string }): Promise<void> {
  const imageId = target.value?.id
  if (!imageId) return
  saving.value = true
  try {
    await api.updateCharacter(payload.characterId, { imageId })
    avatarOpen.value = false
    emit('done')
  } finally {
    saving.value = false
  }
}

async function onSetCover(payload: { seriesId: string }): Promise<void> {
  const imageId = target.value?.id
  if (!imageId) return
  saving.value = true
  try {
    await api.updateSeries(payload.seriesId, { coverImageId: imageId })
    coverOpen.value = false
    emit('done')
  } finally {
    saving.value = false
  }
}

defineExpose({ openSetAvatar, openSetCover })
</script>

<template>
  <SetAvatarModal
    :open="avatarOpen"
    :character-tags="characterTags"
    :saving="saving"
    @save="onSetAvatar"
    @close="avatarOpen = false"
  />
  <SetCoverModal
    :open="coverOpen"
    :current-series-id="currentSeriesId"
    :saving="saving"
    @save="onSetCover"
    @close="coverOpen = false"
  />
</template>
