<script setup lang="ts">
import { computed } from 'vue'
import { PERM_FLAGS } from './perms'
import { hasPermission } from '~/utils/bitmask'

defineProps<{
  usersCount?: number | null
  tagsCount?: number | null
  charactersCount?: number | null
}>()

const { t } = useI18n()
const localePath = useLocalePath()
const { isAdmin, mask } = usePermissions()

const groups = computed(() =>
  [
    {
      key: 'general',
      title: t('settings.catGeneral'),
      tabs: [
        {
          key: 'appearance',
          label: t('settings.appearance'),
          icon: 'sliders',
          to: localePath('/settings/appearance'),
          show: true,
        },
      ],
    },
    {
      key: 'management',
      title: t('settings.catManagement'),
      tabs: [
        {
          key: 'tags',
          label: t('settings.tags'),
          icon: 'filter',
          to: localePath('/settings/tags'),
          show: true,
        },
        {
          key: 'characters',
          label: t('settings.characters'),
          icon: 'picture',
          to: localePath('/settings/characters'),
          show: true,
        },
        {
          key: 'users',
          label: t('settings.users'),
          icon: 'user',
          to: localePath('/settings/users'),
          show: isAdmin.value,
        },
      ],
    },
  ]
    .map((group) => ({ ...group, tabs: group.tabs.filter((tab) => tab.show) }))
    .filter((group) => group.tabs.length),
)

const visibleFlags = computed(() =>
  PERM_FLAGS.filter((flag) => hasPermission(mask.value, flag.bit)),
)

function countFor(
  key: string,
  p: { usersCount?: number | null; tagsCount?: number | null; charactersCount?: number | null },
): number | null {
  if (key === 'users') return p.usersCount ?? null
  if (key === 'tags') return p.tagsCount ?? null
  if (key === 'characters') return p.charactersCount ?? null
  return null
}
</script>

<template>
  <aside class="snav">
    <div class="snav__label mono">{{ t('settings.section') }}</div>

    <div v-for="group in groups" :key="group.key" class="snav__group">
      <div class="snav__group-title mono">{{ group.title }}</div>
      <nav class="snav__tabs">
        <NuxtLink
          v-for="tab in group.tabs"
          :key="tab.key"
          :to="tab.to"
          class="snav__tab"
          active-class="snav__tab--active"
        >
          <LIcon :name="tab.icon" :size="14" class="snav__tab-icon" />
          <span class="snav__tab-label">{{ tab.label }}</span>
          <span
            v-if="countFor(tab.key, { usersCount, tagsCount, charactersCount }) != null"
            class="snav__tab-count mono"
          >
            {{ countFor(tab.key, { usersCount, tagsCount, charactersCount }) }}
          </span>
        </NuxtLink>
      </nav>
    </div>

    <div v-if="visibleFlags.length || isAdmin" class="snav__legend">
      <div class="snav__legend-title mono">{{ t('settings.permissionFlags') }}</div>
      <div v-for="flag in visibleFlags" :key="flag.key" class="snav__legend-row">
        <LIcon :name="flag.icon" :size="12" class="snav__legend-icon" />
        <span class="snav__legend-text">{{ t(`settings.perm.${flag.key}.label`) }}</span>
      </div>
      <div v-if="isAdmin" class="snav__legend-admin">
        <LIcon name="star" :size="12" class="snav__legend-admin-icon" />
        <span class="snav__legend-admin-text">{{ t('settings.administrator') }}</span>
        <span class="snav__legend-admin-all mono">{{ t('settings.equalsAll') }}</span>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.snav {
  padding: var(--space-5);
  border-right: 1px solid var(--color-border);
  background: var(--color-bg2);
}
.snav__label {
  font-size: 10.5px;
  color: var(--color-muted);
  letter-spacing: 1px;
  margin-bottom: var(--space-3);
}
.snav__group + .snav__group {
  margin-top: var(--space-5);
}
.snav__group-title {
  font-size: 10px;
  color: var(--color-mute2);
  letter-spacing: 0.8px;
  text-transform: uppercase;
  margin-bottom: var(--space-2);
  padding: 0 12px;
}
.snav__tabs {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.snav__tab {
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  padding: 9px 12px;
  border-radius: var(--radius-s);
  font-size: 13px;
  text-align: left;
  background: transparent;
  color: var(--color-text2);
  border: 1px solid transparent;
  transition: background var(--dur-fast);
}
.snav__tab:hover {
  background: var(--color-surface);
}
.snav__tab--active {
  background: var(--color-surface2);
  color: var(--color-text);
  border-color: var(--color-border);
  font-weight: 500;
}
.snav__tab-icon {
  color: var(--color-muted);
  flex-shrink: 0;
}
.snav__tab--active .snav__tab-icon {
  color: var(--color-accent-text);
}
.snav__tab-label {
  flex: 1;
}
.snav__tab-count {
  font-size: 11px;
  color: var(--color-muted);
}
.snav__legend {
  margin-top: var(--space-7);
  padding: 14px;
  border-radius: var(--radius-m);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}
.snav__legend-title {
  font-size: 10px;
  color: var(--color-muted);
  letter-spacing: 0.8px;
  margin-bottom: var(--space-2);
}
.snav__legend-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: 6px;
  font-size: 11.5px;
  color: var(--color-text2);
}
.snav__legend-icon {
  color: var(--color-muted);
  flex-shrink: 0;
}
.snav__legend-text {
  flex: 1;
}
.snav__legend-admin {
  margin-top: 6px;
  padding-top: var(--space-2);
  border-top: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 11.5px;
}
.snav__legend-admin-icon {
  color: var(--color-warn);
  flex-shrink: 0;
}
.snav__legend-admin-text {
  color: var(--color-warn);
}
.snav__legend-admin-all {
  color: var(--color-muted);
  font-size: 10px;
  margin-left: auto;
}

@media (max-width: 768px) {
  .snav {
    border-right: 0;
    border-bottom: 1px solid var(--color-border);
  }
  .snav__tabs {
    flex-direction: row;
    flex-wrap: wrap;
  }
  .snav__tab {
    width: auto;
  }
  .snav__legend {
    display: none;
  }
}
</style>
