const env =
  (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {}
const SITE_URL = (env.NUXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '')
const LOGO_URL = `${SITE_URL}/lumia-logo.png`
const SITE_NAME = 'Lumia'
const SITE_DESCRIPTION =
  'Anime screenshot & fan-art gallery with tagging, characters and episode tracking.'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },

  ssr: false,

  modules: ['@nuxt/eslint', '@nuxt/image', '@nuxt/fonts', '@pinia/nuxt', '@nuxtjs/i18n'],

  css: ['~/assets/css/tokens.css', '~/assets/css/base.css', '~/assets/css/transitions.css'],

  components: [
    { path: '~/components/ui', pathPrefix: false },
    { path: '~/components', pathPrefix: false },
  ],

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      title: SITE_NAME,
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: SITE_DESCRIPTION },
        { name: 'theme-color', content: '#0b0e14' },

        { key: 'og:site_name', property: 'og:site_name', content: SITE_NAME },
        { key: 'og:type', property: 'og:type', content: 'website' },
        { key: 'og:title', property: 'og:title', content: SITE_NAME },
        { key: 'og:description', property: 'og:description', content: SITE_DESCRIPTION },
        { key: 'og:image', property: 'og:image', content: LOGO_URL },
        { key: 'og:image:width', property: 'og:image:width', content: '512' },
        { key: 'og:image:height', property: 'og:image:height', content: '512' },

        { key: 'twitter:card', name: 'twitter:card', content: 'summary' },
        { key: 'twitter:title', name: 'twitter:title', content: SITE_NAME },
        { key: 'twitter:description', name: 'twitter:description', content: SITE_DESCRIPTION },
        { key: 'twitter:image', name: 'twitter:image', content: LOGO_URL },
      ],
      link: [
        { rel: 'icon', href: '/favicon.ico', sizes: 'any' },
        { rel: 'icon', type: 'image/png', href: '/lumia-logo.png' },
        { rel: 'apple-touch-icon', href: '/lumia-logo.png' },
      ],
    },
  },

  typescript: {
    strict: true,
    typeCheck: false,
  },

  runtimeConfig: {
    public: {
      apiBaseUrl: '',
      authBaseUrl: '',
      baseCdnUrl: '',
    },
  },

  eslint: {
    config: {
      stylistic: false,
    },
  },

  fonts: {
    families: [
      { name: 'Geist', provider: 'google', weights: [300, 400, 500, 600, 700] },
      { name: 'Geist Mono', provider: 'google', weights: [400, 500, 600] },
    ],
    defaults: {
      preload: true,
    },
  },

  image: {
    quality: 80,
    format: ['webp'],
  },

  i18n: {
    vueI18n: './i18n.config.ts',
    strategy: 'prefix_except_default',
    defaultLocale: 'en',
    locales: [
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' },
      { code: 'ru', language: 'ru-RU', name: 'Русский', file: 'ru.json' },
      { code: 'de', language: 'de-DE', name: 'Deutsch', file: 'de.json' },
    ],
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'lumia_locale',
      redirectOn: 'root',
      fallbackLocale: 'en',
    },
  },
})
