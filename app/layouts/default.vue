<script setup lang="ts">
import { useUpload } from '~/composables/useUpload'

const { pickFiles } = useUpload()
</script>

<template>
  <div class="layout">
    <TopNav @upload="pickFiles" />
    <main class="layout__main">
      <slot />
    </main>
    <ClientOnly>
      <GlobalUploadHost />
      <HeartLayer />
    </ClientOnly>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
}
.layout__main {
  flex: 1;
  min-height: 0;
}
</style>
