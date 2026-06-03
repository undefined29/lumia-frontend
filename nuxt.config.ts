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
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
      link: [{ rel: 'icon', href: '/favicon.ico' }],
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
