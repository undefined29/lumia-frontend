<script setup lang="ts"></script>

<template>
  <main class="auth-layout">
    <div class="auth-layout__top">
      <LLocaleSwitch />
      <LThemeSwitch />
    </div>
    <slot />
  </main>
</template>

<style scoped>
.auth-layout {
  position: relative;
  min-height: 100dvh;
  overflow: hidden;
}
.auth-layout__top {
  position: absolute;
  top: 18px;
  right: 22px;
  z-index: var(--z-sticky);
  display: flex;
  gap: var(--space-2);
}
</style>
