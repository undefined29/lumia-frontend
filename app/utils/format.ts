export function imageUrlFromKey(storageKey: string | null | undefined, baseCdnUrl = ''): string {
  if (!storageKey) return ''
  const base = baseCdnUrl.replace(/\/$/, '')
  return base ? `${base}/${storageKey}` : `/${storageKey.replace(/^\//, '')}`
}

export function thumbUrlFromKey(
  storageKey: string | null | undefined,
  baseCdnUrl = '',
  useThumb = true,
): string {
  if (!storageKey) return ''
  if (!useThumb) return imageUrlFromKey(storageKey, baseCdnUrl)
  const base = baseCdnUrl.replace(/\/$/, '')
  const key = `${storageKey}-thumbnail.webp`
  return base ? `${base}/${key}` : `/${key.replace(/^\//, '')}`
}

export function formatCount(n: number, locale?: string): string {
  return new Intl.NumberFormat(locale).format(n)
}

export function formatBytes(bytes: number, locale?: string): string {
  if (!bytes || bytes < 0) return '—'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / Math.pow(1024, i)
  const formatted = new Intl.NumberFormat(locale, {
    maximumFractionDigits: i === 0 ? 0 : 1,
  }).format(value)
  return `${formatted} ${units[i]}`
}

export function formatDate(iso: string, locale?: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d)
}

export function formatDateTime(iso: string, locale?: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString(locale, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function formatRelative(iso: string, locale?: string): string {
  const d = new Date(iso).getTime()
  if (Number.isNaN(d)) return '—'
  const diff = d - Date.now()
  const abs = Math.abs(diff)
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  const minute = 60_000
  const hour = 60 * minute
  const day = 24 * hour
  if (abs < hour) return rtf.format(Math.round(diff / minute), 'minute')
  if (abs < day) return rtf.format(Math.round(diff / hour), 'hour')
  if (abs < 30 * day) return rtf.format(Math.round(diff / day), 'day')
  return formatDate(iso, locale)
}

export function truncateHash(hash: string, head = 3, tail = 3): string {
  if (!hash) return '—'
  if (hash.length <= head + tail + 1) return hash
  return `${hash.slice(0, head)}…${hash.slice(-tail)}`
}

export function padId(id: string | number, width = 5): string {
  return `#${String(id).replace(/\D/g, '').padStart(width, '0').slice(-width)}`
}

export function episodeLabel(num: number): string {
  return `E${String(num).padStart(2, '0')}`
}

export function discordIdFromAvatarUrl(url: string | null): string | null {
  const match = url?.match(/\/avatars\/(\d+)\//)
  return match?.[1] ?? null
}
