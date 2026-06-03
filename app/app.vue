<script setup lang="ts">
import { computed } from 'vue'
import { useReducedMotion } from '~/composables/useReducedMotion'

const reduced = useReducedMotion()
const { t } = useI18n()

const pageTransition = computed(() =>
  reduced.value ? false : { name: 'page', mode: 'out-in' as const },
)

useSeoMeta({
  titleTemplate: (title) => (title ? `${title}` : t('app.name')),
  ogType: 'website',
})
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage :transition="pageTransition" />
    </NuxtLayout>
  </div>
</template>
