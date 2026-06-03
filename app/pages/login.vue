<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuth } from '~/composables/useAuth'

definePageMeta({ layout: 'auth' })

const { t } = useI18n()
const localePath = useLocalePath()
const { signInWithDiscord, bootstrapSession, loadMe } = useAuth()

useSeoMeta({
  title: () => t('seo.loginTitle'),
  description: () => t('seo.loginDescription'),
})

const redirecting = ref(false)
const restoring = ref(true)
const hasError = ref(false)

onMounted(async () => {
  try {
    const ok = await bootstrapSession()
    if (ok) {
      await loadMe()
      await navigateTo(localePath('/'))
      return
    }
  } catch {}
  restoring.value = false
})

async function onDiscord(): Promise<void> {
  if (redirecting.value) return
  redirecting.value = true
  hasError.value = false
  try {
    await signInWithDiscord()
  } catch {
    hasError.value = true
    redirecting.value = false
  }
}
</script>

<template>
  <div class="login">
    <LAurora :hue="140" :intensity="1.1" />

    <div class="login__brand">
      <LLogo :size="22" />
      <span class="login__brand-name">{{ t('app.name') }}</span>
    </div>
    <div class="login__version mono">{{ t('auth.version') }}</div>

    <section class="card">
      <div class="card__logo">
        <LLogo :size="36" />
      </div>
      <h1 class="card__title">{{ t('auth.welcomeBack') }}</h1>
      <p class="card__subtitle">{{ t('auth.signInSubtitle') }}</p>

      <div class="card__actions">
        <LButton
          variant="primary"
          size="lg"
          icon="disc"
          block
          :loading="restoring || redirecting"
          :disabled="restoring || redirecting"
          @click="onDiscord"
        >
          {{ restoring || redirecting ? t('auth.signingIn') : t('auth.continueDiscord') }}
        </LButton>
      </div>

      <p v-if="hasError" class="card__error mono" role="alert">{{ t('auth.error') }}</p>

      <p class="card__legal mono">{{ t('auth.legal') }}</p>
    </section>

    <div class="login__footer mono">{{ t('auth.brandFooter') }}</div>
  </div>
</template>

<style scoped>
.login {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.login__brand {
  position: absolute;
  top: 24px;
  left: 28px;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: var(--space-3);
}
.login__brand-name {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.2px;
  color: var(--color-text);
}

.login__version {
  position: absolute;
  top: 24px;
  right: 28px;
  z-index: 2;
  font-size: 11px;
  color: var(--color-muted);
}

.card {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 2;
  width: 380px;
  max-width: calc(100vw - 32px);
  padding: 36px;
  border-radius: var(--radius-xl);
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--color-border-hi);
  box-shadow: var(--shadow-modal);
}

.card__logo {
  display: flex;
  justify-content: center;
  margin-bottom: 18px;
}
.card__title {
  margin: 0 0 6px;
  text-align: center;
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.5px;
  color: var(--color-text);
}
.card__subtitle {
  margin: 0 0 28px;
  text-align: center;
  font-size: 13.5px;
  color: var(--color-muted);
}

.card__form {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.card__input {
  width: 100%;
  height: 44px;
  padding: 0 14px;
  background: var(--color-surface2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-m);
  color: var(--color-text);
  font-size: 14px;
}
.card__input:focus {
  outline: none;
  border-color: var(--color-border-hi);
}
.card__input::placeholder {
  color: var(--color-muted);
}
.card__divider {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin: var(--space-4) 0;
  color: var(--color-mute2);
  font-size: 12px;
}
.card__divider::before,
.card__divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--color-border);
}
.card__actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.card__error {
  margin: 14px 0 0;
  font-size: 11.5px;
  text-align: center;
  color: var(--color-err);
}

.card__legal {
  margin: 22px 0 0;
  padding-top: 18px;
  border-top: 1px solid var(--color-border);
  font-size: 10.5px;
  line-height: 1.6;
  color: var(--color-muted);
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.login__footer {
  position: absolute;
  bottom: 22px;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 10.5px;
  letter-spacing: 1.2px;
  color: var(--color-mute2);
}

@media (max-width: 480px) {
  .card {
    padding: 28px 24px;
  }
}
</style>
