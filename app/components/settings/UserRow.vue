<script setup lang="ts">
import { computed } from 'vue'
import type { UserView } from '~/types/view'
import { UserPermission } from '~/types/user'
import {
  hasPermission,
  isAdministrator,
  bitmaskToggle,
  formatPermissionMask,
} from '~/utils/bitmask'
import { PERM_FLAGS } from './perms'

const props = defineProps<{
  view: UserView
  expanded: boolean
}>()

const emit = defineEmits<{
  toggleExpand: []
  updatePermissions: [number]
  viewUploads: []
}>()

const { t } = useI18n()

const isAdmin = computed(() => isAdministrator(props.view.permissions))
const locked = computed(() => isAdmin.value || props.view.isSelf)
const discordId = computed(() => props.view.discordId)
const maskBits = computed(() => formatPermissionMask(props.view.permissions))

function flagOn(bit: UserPermission): boolean {
  return hasPermission(props.view.permissions, bit)
}

function onFlagChange(bit: UserPermission, next: boolean): void {
  if (locked.value) return
  emit('updatePermissions', bitmaskToggle(props.view.permissions, bit, next))
}

function onToggleAdmin(): void {
  if (props.view.isSelf) return
  emit(
    'updatePermissions',
    bitmaskToggle(props.view.permissions, UserPermission.Administrator, !isAdmin.value),
  )
}
</script>

<template>
  <div class="user-row" :class="{ 'user-row--expanded': expanded }">
    <div class="user-row__main">
      <div class="user-row__user">
        <LAvatar :name="view.name" :src="view.avatarUrl" :hue="view.hue" :size="32" />
        <div class="user-row__id">
          <div class="user-row__name-line">
            <span class="user-row__name">{{ view.name }}</span>
            <span v-if="view.isSelf" class="user-row__you mono">{{ t('settings.you') }}</span>
          </div>
          <div class="user-row__joined mono">{{ view.id }}</div>
        </div>
      </div>

      <div class="user-row__discord mono">
        <template v-if="view.username">@{{ view.username }}</template>
        <template v-else>—</template>
        <div v-if="discordId" class="user-row__discord-id">{{ discordId }}</div>
      </div>

      <div class="user-row__perms">
        <PermSummary :mask="view.permissions" />
      </div>

      <div class="user-row__actions">
        <button
          type="button"
          class="user-row__expand"
          :class="{ 'user-row__expand--on': expanded }"
          :aria-expanded="expanded"
          :aria-label="t('settings.editPermissions')"
          @click="emit('toggleExpand')"
        >
          <LIcon name="sliders" :size="12" />
          <LIcon
            name="chev"
            :size="11"
            class="user-row__chev"
            :class="{ 'user-row__chev--up': expanded }"
          />
        </button>
      </div>
    </div>

    <div v-if="expanded" class="user-row__detail">
      <div class="user-row__flags">
        <PermToggle
          v-for="flag in PERM_FLAGS"
          :key="flag.key"
          :flag="flag"
          :on="flagOn(flag.bit)"
          :locked="locked"
          @change="(next) => onFlagChange(flag.bit, next)"
        />
        <div v-if="isAdmin" class="user-row__admin-note">
          <LIcon name="star" :size="13" class="user-row__admin-note-icon" />
          <span>{{ t('settings.adminOverride') }}</span>
        </div>
      </div>

      <div class="user-row__side">
        <button
          type="button"
          class="user-row__side-btn"
          :class="{ 'user-row__side-btn--admin': isAdmin }"
          :disabled="view.isSelf"
          @click="onToggleAdmin"
        >
          <LIcon name="star" :size="13" />
          {{ isAdmin ? t('settings.revokeAdmin') : t('settings.makeAdmin') }}
        </button>
        <button type="button" class="user-row__side-btn" @click="emit('viewUploads')">
          <LIcon name="picture" :size="13" />
          {{ t('settings.viewUploads') }}
        </button>
        <div class="user-row__mask mono">{{ t('settings.mask') }} · {{ maskBits }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.user-row {
  border-bottom: 1px solid var(--color-border);
  transition: background var(--dur-fast);
}
.user-row--expanded {
  background: var(--color-surface);
}
.user-row__main {
  display: grid;
  grid-template-columns: 1fr 180px 1fr 80px;
  padding: 11px 16px;
  align-items: center;
  font-size: 13px;
}
.user-row__user {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}
.user-row__id {
  min-width: 0;
}
.user-row__name-line {
  display: flex;
  align-items: center;
  gap: 6px;
}
.user-row__name {
  font-weight: 500;
}
.user-row__you {
  font-size: 9.5px;
  padding: 1px 5px;
  border-radius: var(--radius-s);
  background: var(--color-surface3);
  color: var(--color-text2);
  letter-spacing: 0.6px;
}
.user-row__joined {
  font-size: 10.5px;
  color: var(--color-muted);
}
.user-row__discord {
  font-size: 12px;
  color: var(--color-text2);
}
.user-row__discord-id {
  font-size: 10.5px;
  color: var(--color-muted);
  margin-top: 2px;
}
.user-row__actions {
  display: flex;
  gap: var(--space-1);
  justify-content: flex-end;
}
.user-row__expand {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: var(--radius-s);
  font-size: 12px;
  color: var(--color-text2);
  background: var(--color-surface2);
  border: 1px solid var(--color-border);
  transition: background var(--dur-fast);
}
.user-row__expand--on {
  color: var(--color-accent-text);
  background: var(--color-accent-dim);
  border-color: color-mix(in srgb, var(--color-accent) 33%, transparent);
}
.user-row__chev {
  transition: transform var(--dur-base);
}
.user-row__chev--up {
  transform: rotate(180deg);
}
.user-row__detail {
  padding: 0 16px 16px;
  display: grid;
  grid-template-columns: 1fr 220px;
  gap: 18px;
}
.user-row__flags {
  border-radius: var(--radius-m);
  background: var(--color-bg2);
  border: 1px solid var(--color-border);
  padding: 6px;
}
.user-row__admin-note {
  margin: 4px;
  padding: 8px 10px;
  border-radius: var(--radius-s);
  background: color-mix(in srgb, var(--color-warn) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-warn) 25%, transparent);
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 12px;
  color: var(--color-warn);
}
.user-row__admin-note-icon {
  color: var(--color-warn);
  flex-shrink: 0;
}
.user-row__side {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.user-row__side-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 9px 12px;
  border-radius: var(--radius-s);
  font-size: 12.5px;
  text-align: left;
  background: var(--color-surface2);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  transition: background var(--dur-fast);
}
.user-row__side-btn:hover:not(:disabled) {
  background: var(--color-surface3);
}
.user-row__side-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.user-row__side-btn--admin {
  background: color-mix(in srgb, var(--color-warn) 15%, transparent);
  color: var(--color-warn);
  border-color: color-mix(in srgb, var(--color-warn) 40%, transparent);
}
.user-row__side-btn--danger {
  background: color-mix(in srgb, var(--color-err) 8%, transparent);
  color: var(--color-err);
  border-color: color-mix(in srgb, var(--color-err) 25%, transparent);
}
.user-row__side-btn--danger:hover:not(:disabled) {
  background: color-mix(in srgb, var(--color-err) 16%, transparent);
}
.user-row__mask {
  margin-top: 6px;
  font-size: 10px;
  color: var(--color-mute2);
  letter-spacing: 0.5px;
  line-height: 1.5;
  word-break: break-word;
}

@media (max-width: 768px) {
  .user-row__main {
    grid-template-columns: 1fr auto;
    gap: var(--space-2);
  }
  .user-row__discord,
  .user-row__perms {
    display: none;
  }
  .user-row__detail {
    grid-template-columns: 1fr;
  }
}
</style>
