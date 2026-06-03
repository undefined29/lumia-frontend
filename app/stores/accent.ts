import { defineStore } from 'pinia'

export interface AccentPreset {
  key: string
  color: string
}

export const DEFAULT_ACCENT = '#c8ff3e'

export const ACCENT_PRESETS: readonly AccentPreset[] = [
  { key: 'lime', color: DEFAULT_ACCENT },
  { key: 'blue', color: '#4ecbff' },
  { key: 'violet', color: '#c084fc' },
  { key: 'pink', color: '#ff5d8a' },
  { key: 'orange', color: '#ffa657' },
  { key: 'emerald', color: '#34d399' },
  { key: 'amber', color: '#fbbf24' },
  { key: 'red', color: '#ff5d5d' },
] as const

const STORAGE_KEY = 'lumia_accent'
const STYLE_ID = 'lumia-accent'
const HEX_RE = /^#[0-9a-f]{6}$/

export function normalizeHex(input: string): string | null {
  const value = input.trim().toLowerCase()
  return HEX_RE.test(value) ? value : null
}

function relativeLuminance(hex: string): number {
  const channel = (start: number): number => {
    const c = parseInt(hex.slice(start, start + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5)
}

function contrastFor(hex: string): string {
  return relativeLuminance(hex) > 0.45 ? '#0a0b0e' : '#f4f6f9'
}

function buildAccentCss(hex: string): string {
  const contrast = contrastFor(hex)
  return `:root,
:root[data-theme='dark'],
:root[data-theme='oled'] {
  --color-accent: ${hex};
  --color-accent-contrast: ${contrast};
  --color-accent-text: ${hex};
  --color-accent-dim: color-mix(in srgb, ${hex} 18%, transparent);
  --color-accent2: color-mix(in srgb, ${hex} 82%, #000);
}
:root[data-theme='light'] {
  --color-accent: ${hex};
  --color-accent-contrast: ${contrast};
  --color-accent-text: color-mix(in srgb, ${hex} 55%, #000);
  --color-accent-dim: color-mix(in srgb, ${hex} 22%, transparent);
  --color-accent2: color-mix(in srgb, ${hex} 45%, #000);
}`
}

export const useAccentStore = defineStore('accent', {
  state: () => ({
    color: DEFAULT_ACCENT as string,
    initialized: false,
  }),

  getters: {
    isCustom: (state) => !ACCENT_PRESETS.some((preset) => preset.color === state.color),
  },

  actions: {
    init() {
      if (this.initialized || !import.meta.client) return
      const stored = localStorage.getItem(STORAGE_KEY)
      this.color = (stored && normalizeHex(stored)) || DEFAULT_ACCENT
      this.apply()
      this.initialized = true
    },

    apply() {
      if (!import.meta.client) return
      const existing = document.getElementById(STYLE_ID)
      if (this.color === DEFAULT_ACCENT) {
        existing?.remove()
        return
      }
      const css = buildAccentCss(this.color)
      if (existing) {
        existing.textContent = css
        return
      }
      const el = document.createElement('style')
      el.id = STYLE_ID
      el.textContent = css
      document.head.appendChild(el)
    },

    setAccent(color: string) {
      const hex = normalizeHex(color)
      if (!hex) return
      this.color = hex
      if (import.meta.client) localStorage.setItem(STORAGE_KEY, hex)
      this.apply()
    },

    reset() {
      this.setAccent(DEFAULT_ACCENT)
    },
  },
})
