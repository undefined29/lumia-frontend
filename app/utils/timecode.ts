const MPVSNAP_TIMECODE_RE =
  /^mpvsnap-\d{4}-\d{2}-\d{2}-\d{2}h\d{2}m\d{2}s-(\d{2})_(\d{2})_(\d{2})(?:[.,]\d+)?/i

const SECONDS_PER_MINUTE = 60
const SECONDS_PER_HOUR = 3600

export function parseTimestampSeconds(filename: string): number | null {
  const match = MPVSNAP_TIMECODE_RE.exec(filename)
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  const seconds = Number(match[3])
  return hours * SECONDS_PER_HOUR + minutes * SECONDS_PER_MINUTE + seconds
}

export interface Timecode {
  hours: number
  minutes: number
  seconds: number
}

export function splitTimecode(totalSeconds: number): Timecode {
  const whole = Math.max(0, Math.floor(totalSeconds))
  return {
    hours: Math.floor(whole / SECONDS_PER_HOUR),
    minutes: Math.floor((whole % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE),
    seconds: whole % SECONDS_PER_MINUTE,
  }
}
