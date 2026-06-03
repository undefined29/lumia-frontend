<script setup lang="ts">
import { computed, ref } from 'vue'
import { useUserStore } from '~/stores/user'
import { useAdapters } from '~/composables/useAdapters'
import { useAuth } from '~/composables/useAuth'
import { padId } from '~/utils/format'
import { isAdministrator } from '~/utils/bitmask'
import { PERM_FLAGS } from '~/components/settings/perms'

const { t } = useI18n()
const localePath = useLocalePath()
const userStore = useUserStore()
const { toUserView } = useAdapters()
const { logout } = useAuth()

useSeoMeta({
  title: () => t('seo.profileTitle'),
  description: () => t('seo.profileDescription'),
})

const view = computed(() => {
  const user = userStore.currentUser
  return user ? toUserView(user) : null
})

const cardNumber = computed(() => (view.value ? padId(view.value.id, 6).replace('#', '') : '—'))

const scopeLabel = computed(() => {
  if (!view.value) return '—'
  const mask = view.value.permissions
  if (isAdministrator(mask)) return t('settings.administrator')
  const on = PERM_FLAGS.filter((f) => (mask & f.bit) !== 0).length
  if (on === 0) return t('settings.noPermissions')
  if (on === PERM_FLAGS.length) return t('settings.allFlags')
  return t('settings.nOfFour', { n: on, total: PERM_FLAGS.length })
})

const ID_BAR_MIN = 4
const ID_BAR_MAX = 26
const bars = computed(() => {
  const digits = (view.value?.id ?? '').replace(/\D/g, '')
  return Array.from(digits, (ch) => ID_BAR_MIN + (Number(ch) / 9) * (ID_BAR_MAX - ID_BAR_MIN))
})

const loggingOut = ref(false)
async function onLogout(): Promise<void> {
  if (loggingOut.value) return
  loggingOut.value = true
  logout()
  await navigateTo(localePath('/login'))
}
</script>

<template>
  <div class="profile">
    <LAurora :hue="130" :intensity="0.8" />

    <div class="profile__brand">
      <LLogo :size="22" />
      <span class="profile__brand-name">{{ t('app.name') }}</span>
    </div>
    <div class="profile__status">
      <span class="profile__status-label mono">{{ t('auth.signedIn') }}</span>
      <span class="profile__status-dot" />
    </div>

    <div class="card-shadow" aria-hidden="true" />

    <section class="card">
      <header class="card__header mono">
        <span>{{ t('auth.cardLabel') }}</span>
        <span>№ {{ cardNumber }}</span>
      </header>

      <div class="card__body">
        <div class="card__avatar">
          <LImage
            v-if="view"
            variant="avatar"
            :src="view.avatarUrl"
            :hue="view.hue"
            :alt="view.name"
          />
        </div>

        <div class="card__info">
          <div class="card__holder-label mono">{{ t('auth.holder') }}</div>
          <div class="card__holder-name">{{ view?.name ?? '—' }}</div>

          <dl class="card__grid">
            <div>
              <dt class="card__field-label mono">{{ t('auth.discordUsername') }}</dt>
              <dd class="card__field-value">{{ view?.username ?? '—' }}</dd>
            </div>
            <div>
              <dt class="card__field-label mono">{{ t('auth.discordId') }}</dt>
              <dd class="card__field-value mono card__field-value--id">
                {{ view?.discordId ?? '—' }}
              </dd>
            </div>
            <div>
              <dt class="card__field-label mono">{{ t('auth.images') }}</dt>
              <dd class="card__field-value mono">{{ view?.imagesCount ?? 0 }}</dd>
            </div>
            <div>
              <dt class="card__field-label mono">{{ t('auth.scope') }}</dt>
              <dd class="card__field-value">{{ scopeLabel }}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div class="card__barcode" aria-hidden="true">
        <span v-for="(h, i) in bars" :key="i" class="card__bar" :style="{ height: `${h}px` }" />
      </div>

      <footer class="card__footer">
        <LButton variant="outline" icon="logout" block :loading="loggingOut" @click="onLogout">
          {{ t('auth.logout') }}
        </LButton>
      </footer>
    </section>

    <div class="profile__footer mono">{{ t('auth.brandFooter') }}</div>
  </div>
</template>

<style scoped>
.profile {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.profile__brand {
  position: absolute;
  top: 24px;
  left: 28px;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: var(--space-3);
}
.profile__brand-name {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.2px;
  color: var(--color-text);
}

.profile__status {
  position: absolute;
  top: 24px;
  right: 28px;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: var(--space-3);
}
.profile__status-label {
  font-size: 11px;
  letter-spacing: 0.8px;
  color: var(--color-muted);
}
.profile__status-dot {
  width: 6px;
  height: 6px;
  border-radius: 3px;
  background: var(--color-ok);
  box-shadow: 0 0 8px var(--color-ok);
}

.card-shadow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-52%, -48%) rotate(4deg);
  z-index: 1;
  width: 460px;
  height: 280px;
  max-width: calc(100vw - 32px);
  border-radius: var(--radius-l);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  opacity: 0.5;
}

.card {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-1.5deg);
  z-index: 2;
  width: 460px;
  max-width: calc(100vw - 32px);
  border-radius: var(--radius-l);
  overflow: hidden;
  background: linear-gradient(150deg, var(--color-surface2), var(--color-surface));
  border: 1px solid var(--color-border-hi);
  box-shadow: var(--shadow-modal);
}

.card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 22px;
  background: linear-gradient(90deg, var(--color-accent), oklch(0.85 0.18 170));
  color: var(--color-accent-contrast);
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 1.4px;
}

.card__body {
  display: grid;
  grid-template-columns: 92px 1fr;
  gap: 20px;
  padding: 24px;
}

.card__avatar {
  width: 92px;
  height: 116px;
  border-radius: var(--radius-s);
  overflow: hidden;
  border: 1px solid var(--color-border);
}

.card__holder-label {
  margin-bottom: 2px;
  font-size: 10px;
  letter-spacing: 1px;
  color: var(--color-muted);
}
.card__holder-name {
  margin-bottom: 12px;
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.5px;
  color: var(--color-text);
}

.card__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 18px;
  margin: 0;
  font-size: 11.5px;
}
.card__grid > div {
  min-width: 0;
}
.card__field-label {
  margin-bottom: 1px;
  font-size: 9.5px;
  letter-spacing: 1px;
  color: var(--color-muted);
}
.card__field-value {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--color-text2);
}
.card__field-value--id {
  word-break: break-all;
}

.card__barcode {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 32px;
  padding: 0 24px 18px;
}
.card__bar {
  flex: 1;
  background: var(--color-muted);
  opacity: 0.5;
}

.card__footer {
  padding: 18px;
  background: var(--color-bg);
  border-top: 1px dashed var(--color-border-hi);
}

.profile__footer {
  position: absolute;
  bottom: 22px;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 10.5px;
  letter-spacing: 1.2px;
  color: var(--color-mute2);
}

@media (max-width: 520px) {
  .card,
  .card-shadow {
    width: calc(100vw - 32px);
  }
}
</style>
