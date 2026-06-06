<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { UserView } from '~/types/view'
import { isAdministrator } from '~/utils/bitmask'

definePageMeta({ layout: 'default', middleware: 'admin' })

const { t } = useI18n()
const { api } = useApi()
const { toUserView } = useAdapters()
const { isAdmin } = usePermissions()
const localePath = useLocalePath()

useSeoMeta({
  title: () => t('seo.settingsTitle'),
  description: () => t('seo.settingsDescription'),
})

type Filter = 'all' | 'admin' | 'with' | 'none'

const search = ref('')
const filter = ref<Filter>('all')
const expandedId = ref<string | null>(null)

const users = ref<UserView[]>([])

const resource = useAsyncResource(async () => {
  const dtos = await api.listUsers()
  users.value = dtos.map((u) => toUserView(u))
  return users.value
})

const SEARCH_DEBOUNCE_MS = 250
let searchTimer: ReturnType<typeof setTimeout> | null = null

async function fetchUsers(): Promise<void> {
  const dtos = await api.listUsers({ search: search.value.trim() || undefined })
  users.value = dtos.map((u) => toUserView(u))
}

watch(search, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => void fetchUsers(), SEARCH_DEBOUNCE_MS)
})

const counts = computed(() => ({
  all: users.value.length,
  admin: users.value.filter((u) => u.isAdmin).length,
  with: users.value.filter((u) => u.permissions !== 0).length,
  none: users.value.filter((u) => u.permissions === 0).length,
}))

const filterPills = computed(() => [
  { key: 'all' as const, label: t('settings.all'), count: counts.value.all },
  { key: 'admin' as const, label: t('settings.admins'), count: counts.value.admin },
  { key: 'with' as const, label: t('settings.withPerms'), count: counts.value.with },
  { key: 'none' as const, label: t('settings.noPerms'), count: counts.value.none },
])

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return users.value
    .filter((u) => {
      if (!q) return true
      return (
        u.name.toLowerCase().includes(q) ||
        (u.username ?? '').toLowerCase().includes(q) ||
        (u.discordId ?? '').toLowerCase().includes(q)
      )
    })
    .filter((u) => {
      switch (filter.value) {
        case 'admin':
          return u.isAdmin
        case 'with':
          return u.permissions !== 0
        case 'none':
          return u.permissions === 0
        default:
          return true
      }
    })
})

function onToggleExpand(id: string): void {
  expandedId.value = expandedId.value === id ? null : id
}

function onViewUploads(user: UserView): void {
  void navigateTo({
    path: localePath('/'),
    query: { authorId: user.id, authorLabel: user.name },
  })
}

async function onUpdatePermissions(id: string, permissions: number): Promise<void> {
  const prev = users.value
  users.value = users.value.map((u) =>
    u.id === id ? { ...u, permissions, isAdmin: isAdministrator(permissions) } : u,
  )
  try {
    await api.updateUserPermissions(id, { permissions })
  } catch {
    users.value = prev
  }
}
</script>

<template>
  <SettingsShell :users-count="counts.all">
    <div class="users">
      <header class="users__header">
        <div class="users__eyebrow mono">{{ t('settings.usersTotal', { n: counts.all }) }}</div>
        <h1 class="users__title">{{ t('settings.usersTitle') }}</h1>
        <p class="users__desc">{{ t('settings.usersDesc') }}</p>
      </header>

      <div class="users__toolbar">
        <div class="users__search">
          <LIcon name="search" :size="14" class="users__search-icon" />
          <input
            v-model="search"
            type="search"
            class="users__search-input"
            :placeholder="t('settings.searchUsers')"
            :aria-label="t('settings.searchUsers')"
          />
          <button
            v-if="search"
            type="button"
            class="users__search-clear"
            :aria-label="t('common.clear')"
            @click="search = ''"
          >
            <LIcon name="x" :size="12" :stroke="2" />
          </button>
        </div>
        <div class="users__pills">
          <button
            v-for="pill in filterPills"
            :key="pill.key"
            type="button"
            class="users__pill"
            :class="{ 'users__pill--active': filter === pill.key }"
            @click="filter = pill.key"
          >
            {{ pill.label }}
            <span class="users__pill-count mono">{{ pill.count }}</span>
          </button>
        </div>
      </div>

      <LAsyncState
        :status="resource.status.value"
        :error="resource.error.value"
        @retry="resource.retry"
      >
        <div class="users__table">
          <div class="users__head mono">
            <span>{{ t('settings.user') }}</span>
            <span>{{ t('settings.discord') }}</span>
            <span>{{ t('settings.permissions') }}</span>
            <span />
          </div>
          <UserRow
            v-for="user in filtered"
            :key="user.id"
            :view="user"
            :expanded="expandedId === user.id"
            :editable="isAdmin"
            @toggle-expand="onToggleExpand(user.id)"
            @update-permissions="(mask) => onUpdatePermissions(user.id, mask)"
            @view-uploads="onViewUploads(user)"
          />
          <div v-if="filtered.length === 0" class="users__empty">
            {{ t('settings.noUsersMatch') }}
          </div>
        </div>
      </LAsyncState>
    </div>
  </SettingsShell>
</template>

<style scoped>
.users__header {
  margin-bottom: var(--space-6);
}
.users__eyebrow {
  font-size: 11px;
  color: var(--color-muted);
  letter-spacing: 1.4px;
  margin-bottom: 6px;
}
.users__title {
  margin: 0;
  font-size: 26px;
  font-weight: 600;
  letter-spacing: -0.6px;
}
.users__desc {
  margin: 6px 0 0;
  color: var(--color-muted);
  font-size: 13.5px;
  max-width: 580px;
}
.users__toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 14px;
  align-items: center;
  flex-wrap: wrap;
}
.users__search {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 0 12px;
  background: var(--color-surface2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-m);
  height: 36px;
  width: 280px;
  max-width: 100%;
}
.users__search-icon {
  color: var(--color-muted);
  flex-shrink: 0;
}
.users__search-input {
  flex: 1;
  min-width: 0;
  background: transparent;
  border: 0;
  color: var(--color-text);
  font-size: 13px;
}
.users__search-input:focus {
  outline: none;
}
.users__search-clear {
  color: var(--color-muted);
  padding: 2px;
  display: inline-flex;
}
.users__pills {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}
.users__pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 11px;
  font-size: 12px;
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--color-text2);
  font-weight: 500;
  border: 1px solid var(--color-border);
  transition: background var(--dur-fast);
}
.users__pill:hover:not(.users__pill--active) {
  background: var(--color-surface2);
}
.users__pill--active {
  background: var(--color-accent);
  color: var(--color-accent-contrast);
  font-weight: 600;
  border-color: var(--color-accent);
}
.users__pill-count {
  font-size: 10px;
  opacity: 0.7;
  font-weight: 500;
}
.users__table {
  border-radius: var(--radius-m);
  border: 1px solid var(--color-border);
  overflow: hidden;
  background: var(--color-bg2);
}
.users__head {
  display: grid;
  grid-template-columns: 1fr 180px 1fr 80px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--color-border);
  font-size: 10px;
  color: var(--color-muted);
  letter-spacing: 1px;
  background: var(--color-bg);
}
.users__empty {
  padding: 40px 16px;
  text-align: center;
  color: var(--color-muted);
  font-size: 13px;
}

@media (max-width: 768px) {
  .users__search {
    width: 100%;
  }
  .users__head {
    grid-template-columns: 1fr auto;
  }
  .users__head span:nth-child(2),
  .users__head span:nth-child(3) {
    display: none;
  }
}
</style>
