<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { hueGradient } from '~/utils/hue'

const props = withDefaults(
  defineProps<{
    src?: string | null
    placeholder?: string | null
    alt?: string
    hue?: number
    aspectRatio?: number
    variant?: 'card' | 'poster' | 'banner' | 'avatar'
    cover?: boolean
  }>(),
  {
    hue: 200,
    variant: 'card',
    cover: true,
    alt: '',
    src: undefined,
    placeholder: undefined,
    aspectRatio: undefined,
  },
)

const imgEl = ref<HTMLImageElement | null>(null)
const failed = ref(false)
const loaded = ref(false)

const showImage = computed(() => !!props.src && !failed.value)
const showPlaceholder = computed(() => !!props.placeholder && !loaded.value && !failed.value)
const fallback = computed(() => hueGradient(props.hue, props.variant))
const objectFit = computed(() => (props.cover ? 'cover' : 'contain'))

function onLoad(): void {
  loaded.value = true
}
function onError(): void {
  failed.value = true
}

watch(
  () => props.src,
  () => {
    loaded.value = false
    failed.value = false
  },
)

onMounted(() => {
  if (imgEl.value?.complete && imgEl.value.naturalWidth > 0) loaded.value = true
})
</script>

<template>
  <div
    class="img"
    :style="{
      background: fallback,
      aspectRatio: aspectRatio ? String(aspectRatio) : undefined,
    }"
  >
    <img
      v-if="showPlaceholder"
      :src="placeholder!"
      alt=""
      aria-hidden="true"
      class="img__ph"
      :style="{ objectFit }"
    />
    <img
      v-if="showImage"
      ref="imgEl"
      :src="src!"
      :alt="alt"
      loading="lazy"
      decoding="async"
      :draggable="false"
      class="img__el"
      :class="{ 'img__el--loaded': loaded }"
      :style="{ objectFit }"
      @load="onLoad"
      @error="onError"
    />
  </div>
</template>

<style scoped>
.img {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
.img__ph,
.img__el {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  user-select: none;
}
.img__ph {
  filter: blur(12px);
  transform: scale(1.06);
}
.img__el {
  opacity: 0;
  transition: opacity var(--dur-base) var(--ease-out);
}
.img__el--loaded {
  opacity: 1;
}
</style>
