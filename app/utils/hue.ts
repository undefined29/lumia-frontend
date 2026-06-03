export function hueFromId(id: string | number): number {
  const str = String(id)
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0
  }
  return Math.abs(hash) % 360
}

export function hueGradient(
  hue: number,
  variant: 'card' | 'poster' | 'banner' | 'avatar' = 'card',
): string {
  switch (variant) {
    case 'poster':
      return `linear-gradient(170deg, oklch(0.4 0.18 ${hue}), oklch(0.18 0.10 ${hue + 20}))`
    case 'banner':
      return `linear-gradient(135deg, oklch(0.5 0.22 ${hue}), oklch(0.18 0.08 ${hue + 40}))`
    case 'avatar':
      return `linear-gradient(135deg, oklch(0.7 0.18 ${hue}), oklch(0.4 0.14 ${hue + 30}))`
    case 'card':
    default:
      return `linear-gradient(135deg, oklch(0.55 0.20 ${hue}), oklch(0.2 0.10 ${hue + 40}))`
  }
}

export function hueStageBackdrop(hue: number): string {
  return `radial-gradient(ellipse 70% 60% at 70% 60%, oklch(0.28 0.14 ${hue} / 0.7), var(--color-bg) 70%)`
}
