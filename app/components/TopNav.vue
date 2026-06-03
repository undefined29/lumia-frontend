<script setup lang="ts">
import { ref, computed } from 'vue'
import { useUserStore } from '~/stores/user'
import { useBreakpoint } from '~/composables/useBreakpoint'
import { hueFromId } from '~/utils/hue'

const emit = defineEmits<{ upload: [] }>()

const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const userStore = useUserStore()
const { isMobile, smaller } = useBreakpoint()
const { canUpload } = usePermissions()

const collapsed = smaller('lg')

const menuOpen = ref(false)

const tabs = computed(() => {
  const settingsTo = localePath('/settings/appearance')
  const settingsMatch = settingsTo.replace(/\/[^/]+$/, '')
  return [
    { key: 'gallery', label: t('nav.gallery'), icon: 'grid', to: localePath('/') },
    { key: 'library', label: t('nav.library'), icon: 'film', to: localePath('/library') },
    canUpload.value
      ? { key: 'upload', label: t('nav.upload'), icon: 'upload', action: 'upload' as const }
      : null,
    canUpload.value
      ? { key: 'uploadBulk', label: t('nav.uploadBulk'), icon: 'film', to: localePath('/upload') }
      : null,
    {
      key: 'settings',
      label: t('nav.settings'),
      icon: 'sliders',
      to: settingsTo,
      match: settingsMatch,
    },
  ].filter((tab): tab is NonNullable<typeof tab> => tab !== null)
})

const userName = computed(() => userStore.currentUser?.name ?? 'Guest')
const userId = computed(() => userStore.currentUser?.id ?? 'guest')
const userAvatar = computed(() => userStore.currentUser?.avatarUrl ?? null)

function isActive(tab: { to?: string; match?: string }): boolean {
  const target = tab.match ?? tab.to
  if (!target) return false
  if (target === localePath('/')) return route.path === target
  return route.path.startsWith(target)
}

function onTab(tab: { action?: 'upload'; to?: string }): void {
  menuOpen.value = false
  if (tab.action === 'upload') emit('upload')
  else if (tab.to) navigateTo(tab.to)
}
</script>

<template>
  <nav class="topnav">
    <NuxtLink :to="localePath('/')" class="topnav__brand" :aria-label="t('app.name')">
      <LLogo :size="22" />
      <span class="topnav__name">{{ t('app.name') }}</span>
    </NuxtLink>

    <span class="topnav__divider" />

    <div v-if="!collapsed" class="topnav__tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        class="topnav__tab"
        :class="{ 'topnav__tab--active': isActive(tab) }"
        :aria-current="isActive(tab) ? 'page' : undefined"
        @click="onTab(tab)"
      >
        <LIcon :name="tab.icon" :size="15" />
        <span>{{ tab.label }}</span>
      </button>
    </div>

    <div class="topnav__spacer" />

    <div class="topnav__actions">
      <LLocaleSwitch />
      <LThemeSwitch />
      <NuxtLink
        :to="localePath('/profile')"
        class="topnav__user"
        :class="{ 'topnav__user--compact': isMobile }"
      >
        <LAvatar :name="userName" :src="userAvatar" :hue="hueFromId(userId)" :size="26" />
        <span v-if="!isMobile" class="topnav__username">{{ userName }}</span>
      </NuxtLink>
      <button
        v-if="collapsed"
        type="button"
        class="topnav__menu-btn"
        :aria-label="t('nav.gallery')"
        :aria-expanded="menuOpen"
        @click="menuOpen = !menuOpen"
      >
        <LIcon :name="menuOpen ? 'x' : 'menu'" :size="20" />
      </button>
    </div>

    <Transition name="fade">
      <div v-if="collapsed && menuOpen" class="topnav__drawer">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          class="topnav__drawer-item"
          :class="{ 'topnav__drawer-item--active': isActive(tab) }"
          @click="onTab(tab)"
        >
          <LIcon :name="tab.icon" :size="18" />
          <span>{{ tab.label }}</span>
        </button>
      </div>
    </Transition>
  </nav>
</template>

<style scoped>
.topnav {
  position: sticky;
  top: 0;
  z-index: var(--z-nav);
  display: flex;
  align-items: center;
  gap: 18px;
  height: var(--topnav-h);
  padding: 0 22px;
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
}
.topnav__brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}
.topnav__name {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.2px;
}
.topnav__divider {
  width: 1px;
  height: 22px;
  background: var(--color-border);
}
.topnav__tabs {
  display: flex;
  align-items: center;
  gap: 4px;
}
.topnav__tab {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 34px;
  padding: 0 12px;
  border-radius: var(--radius-m);
  border: 1px solid transparent;
  color: var(--color-text2);
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;
  transition: background var(--dur-fast);
}
.topnav__tab:hover {
  background: var(--color-surface2);
}
.topnav__tab--active {
  background: var(--color-surface2);
  border-color: var(--color-border);
  color: var(--color-text);
}
.topnav__spacer {
  flex: 1;
}
.topnav__actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.topnav__user {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 34px;
  padding: 4px 10px 4px 4px;
  border-radius: var(--radius-pill);
  background: var(--color-surface2);
  border: 1px solid var(--color-border);
}
.topnav__user--compact {
  padding: 4px;
}
.topnav__username {
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
}
.topnav__menu-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: var(--radius-m);
  color: var(--color-text2);
}
.topnav__drawer {
  position: absolute;
  top: var(--topnav-h);
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--space-3);
  background: var(--color-bg2);
  border-bottom: 1px solid var(--color-border);
  box-shadow: var(--shadow-card);
}
.topnav__drawer-item {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: var(--touch-min);
  padding: 0 12px;
  border-radius: var(--radius-m);
  color: var(--color-text2);
  font-size: 15px;
}
.topnav__drawer-item--active {
  background: var(--color-surface2);
  color: var(--color-text);
}
</style>
