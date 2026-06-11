<script setup lang="ts">
import { computed } from 'vue'

const ICONS: Record<string, string> = {
  search: 'M11 19a8 8 0 1 1 5.3-2L21 21M3 11a8 8 0 0 1 16 0',
  imageSearch:
    'M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14z M20.5 20.5l-4.8-4.8 M6.5 13l2.2-2.2 1.6 1.6 2-2.4 1.7 2 M8.2 8.2h.01',
  x: 'M6 6l12 12M18 6L6 18',
  plus: 'M12 5v14M5 12h14',
  upload: 'M12 16V4M6 10l6-6 6 6M4 18v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2',
  chev: 'M6 9l6 6 6-6',
  chevR: 'M9 6l6 6-6 6',
  chevL: 'M15 6l-6 6 6 6',
  check: 'M5 13l4 4L19 7',
  star: 'M12 3l2.6 5.5 6 .7-4.4 4.2 1.2 6L12 16.6 6.6 19.4l1.2-6L3.4 9.2l6-.7L12 3z',
  trash:
    'M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6',
  edit: 'M3 21h4l11-11-4-4L3 17v4zM14 5l4 4',
  filter: 'M4 6h16M7 12h10M10 18h4',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  picture: 'M3 5h18v14H3zM3 17l5-5 4 4 3-3 6 6',
  user: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM4 21a8 8 0 0 1 16 0',
  disc: 'M5 4l14 6.5L5 17l3-6.5L5 4z',
  key: 'M14 7a4 4 0 1 1-4 4l-7 7v3h3v-2h2v-2h2l1-1',
  film: 'M3 4h18v16H3zM7 4v16M17 4v16M3 8h4M3 12h4M3 16h4M17 8h4M17 12h4M17 16h4',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  sliders: 'M4 6h10M18 6h2M4 12h2M10 12h10M4 18h14M20 18h0M14 4v4M8 10v4M18 16v4',
  arrowR: 'M5 12h14M13 6l6 6-6 6',
  sort: 'M7 4v16M3 8l4-4 4 4M17 20V4M13 16l4 4 4-4',
  download: 'M12 4v12M6 10l6 6 6-6M4 20h16',
  refresh:
    'M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16M3 21v-5h5',
  shikimori: 'M4 12c0-5 4-8 8-8s8 3 8 8-4 8-8 8-8-3-8-8z M8 12h8 M12 8v8',
  sun: 'M12 4V2M12 22v-2M4 12H2M22 12h-2M6 6L4.5 4.5M19.5 19.5L18 18M6 18l-1.5 1.5M19.5 4.5L18 6M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
  moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z',
  globe:
    'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c2.5 2.5 3.5 6 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-6-3.5-9s1-6.5 3.5-9z',
  menu: 'M4 6h16M4 12h16M4 18h16',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
}

const props = withDefaults(
  defineProps<{
    name: string
    size?: number
    stroke?: number
  }>(),
  { size: 18, stroke: 1.6 },
)

const path = computed(() => ICONS[props.name] ?? '')
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="stroke"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path :d="path" />
  </svg>
</template>
