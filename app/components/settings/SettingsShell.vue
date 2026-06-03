<script setup lang="ts">
defineProps<{
  usersCount?: number | null
  tagsCount?: number | null
  charactersCount?: number | null
}>()
</script>

<template>
  <div class="shell">
    <SettingsNav
      :users-count="usersCount"
      :tags-count="tagsCount"
      :characters-count="charactersCount"
    />
    <main class="shell__main">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.shell {
  display: grid;
  grid-template-columns: 240px 1fr;
  min-height: calc(100dvh - var(--topnav-h));
}
.shell__main {
  padding: var(--space-7);
  min-width: 0;
}

@media (max-width: 768px) {
  .shell {
    grid-template-columns: 1fr;
  }
  .shell__main {
    padding: var(--space-4);
  }
}
</style>
