import type { ApiEnvelope } from '~/types/api'
import { ApiError, ErrorCode } from '~/types/api'
import { parseTimestampSeconds } from '~/utils/timecode'
import type {
  UserResponseDto,
  UpdatePermissionsDto,
  TagResponseDto,
  AutocompleteTagResponseDto,
  TagListQuery,
  TagAutocompleteQuery,
  UpdateTagDto,
  UpdateCharacterDto,
  SeriesResponseDto,
  CreateSeriesDto,
  UpdateSeriesDto,
  SeriesListQuery,
  SeasonResponseDto,
  CreateSeasonDto,
  UpdateSeasonDto,
  EpisodeResponseDto,
  CreateEpisodeDto,
  UpdateEpisodeDto,
  CharacterResponseDto,
  CharacterListQuery,
  ImageResponseDto,
  ListImagesResponseDto,
  GalleryTotalResponseDto,
  GalleryQuery,
  PatchTagsDto,
  SetFavoriteDto,
  SetFavoriteResponseDto,
  UpdateImageDto,
  DeleteImageResponseDto,
  UploadResponseDto,
  ImageStatusEvent,
  SourceType,
} from '~/types'
interface FetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  query?: Record<string, unknown> | object
  body?: unknown
}

/** Max automatic retries on HTTP 429 before surfacing the error to the caller. */
const MAX_RATE_LIMIT_RETRIES = 2
/** Upper bound on a single backoff wait, so a large `Retry-After` can't freeze the UI. */
const MAX_RETRY_DELAY_MS = 8000

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Parse the throttler's `Retry-After` (seconds), falling back to `X-RateLimit-Reset`. */
function parseRetryAfterMs(headers: Headers | undefined): number | undefined {
  if (!headers) return undefined
  for (const header of ['retry-after', 'x-ratelimit-reset']) {
    const raw = headers.get(header)
    if (raw == null) continue
    const seconds = Number(raw)
    if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000)
  }
  return undefined
}

function backoffDelayMs(retryAfterMs: number | undefined, attempt: number): number {
  const base = retryAfterMs ?? Math.min(500 * 2 ** attempt, 4000)
  return Math.min(base, MAX_RETRY_DELAY_MS)
}

export interface SseController {
  close: () => void
}

export interface SseOptions {
  onMessage: (event: ImageStatusEvent) => void
  onError?: (error: Error) => void
  onClose?: () => void
}

export function useApi() {
  const config = useRuntimeConfig()
  const userStore = useUserStore()
  const toasts = useToasts()
  const nuxtApp = useNuxtApp()
  const baseURL = config.public.apiBaseUrl as string

  // Resolve translations defensively: useApi() also runs in route middleware / plugins,
  // where the setup-only `useI18n()` may be unavailable. Fall back to the key if missing.
  function t(key: string): string {
    const i18n = nuxtApp.$i18n as { t?: (k: string) => string } | undefined
    return i18n?.t?.(key) ?? key
  }

  function authHeaders(): Record<string, string> {
    return userStore.token ? { Authorization: `Bearer ${userStore.token}` } : {}
  }

  async function $apiFetch<T>(path: string, opts: FetchOptions = {}): Promise<T> {
    const query = opts.query as Record<string, unknown> | undefined
    const method = opts.method ?? 'GET'

    for (let attempt = 0; ; attempt++) {
      try {
        const envelope = await $fetch<ApiEnvelope<T>>(path, {
          baseURL,
          method,
          query,
          body: opts.body as Record<string, unknown> | undefined,
          headers: authHeaders(),
        })
        if (!envelope.ok) {
          const first = envelope.errors[0]
          throw new ApiError(first?.message ?? 'Request failed', {
            code: first?.code ?? ErrorCode.UNKNOWN,
            errors: envelope.errors,
          })
        }
        return envelope.result
      } catch (error: unknown) {
        // Envelope-level failures are already shaped; never retry or reshape them.
        if (error instanceof ApiError) throw error

        const e = error as {
          status?: number
          statusCode?: number
          data?: Partial<ApiEnvelope<T>>
          response?: { headers?: Headers }
        }
        const status = e.statusCode ?? e.status ?? 0

        if (status === 429) {
          const retryAfterMs = parseRetryAfterMs(e.response?.headers)
          // The request was rejected, not processed, so retrying is safe even for writes.
          // Reads (GET) are debounced/re-fired by the UI, so we let them fail fast instead.
          if (method !== 'GET' && attempt < MAX_RATE_LIMIT_RETRIES) {
            await sleep(backoffDelayMs(retryAfterMs, attempt))
            continue
          }
          if (method !== 'GET') {
            toasts.push(t('errors.rateLimited'), { tone: 'warn' })
          }
          throw new ApiError(t('errors.rateLimited'), {
            status,
            code: ErrorCode.UNKNOWN,
            errors: e.data?.errors ?? [],
            retryAfterMs,
          })
        }

        const envErr = e.data?.errors?.[0]
        const message =
          envErr?.message ?? (error instanceof Error ? error.message : 'Network error')
        throw new ApiError(message, {
          status,
          code: envErr?.code ?? ErrorCode.UNKNOWN,
          errors: e.data?.errors ?? [],
        })
      }
    }
  }

  function $apiSse(path: string, options: SseOptions): SseController {
    const controller = new AbortController()

    async function pump(): Promise<void> {
      const res = await fetch(`${baseURL}${path}`, {
        headers: { ...authHeaders(), Accept: 'text/event-stream' },
        signal: controller.signal,
      })
      if (!res.ok || !res.body) {
        options.onError?.(new Error(`SSE HTTP ${res.status}`))
        return
      }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      for (;;) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n')
        let sep: number
        while ((sep = buffer.indexOf('\n\n')) !== -1) {
          const frame = buffer.slice(0, sep)
          buffer = buffer.slice(sep + 2)
          const lines = frame.split('\n')
          const eventName =
            lines
              .find((line) => line.startsWith('event:'))
              ?.slice(6)
              .trim() ?? ''
          const data = lines
            .filter((line) => line.startsWith('data:'))
            .map((line) => line.slice(5).replace(/^ /, ''))
            .join('\n')
          if (!data && !eventName) continue
          try {
            const payload = (data ? JSON.parse(data) : {}) as ImageStatusEvent
            const named = /^image:([^:]+):(.+)$/.exec(eventName)
            if (named) {
              if (!payload.type) payload.type = named[2]
              if (!payload.data?.imageId) {
                payload.data = { ...payload.data, imageId: named[1]! }
              }
            }
            options.onMessage(payload)
          } catch (err) {
            options.onError?.(err instanceof Error ? err : new Error('Bad SSE payload'))
          }
        }
      }
      options.onClose?.()
    }

    pump().catch((err: unknown) => {
      if (err instanceof Error && err.name === 'AbortError') return
      options.onError?.(err instanceof Error ? err : new Error('SSE connection error'))
    })

    return { close: () => controller.abort() }
  }

  const api = {
    me: () => $apiFetch<UserResponseDto>('/users/@me'),
    getUser: (id: string) => $apiFetch<UserResponseDto>(`/users/${id}`),
    listUsers: (query: { search?: string; lastSeenId?: string; limit?: number } = {}) =>
      $apiFetch<UserResponseDto[]>('/users', { query }),
    updateUserPermissions: (id: string, body: UpdatePermissionsDto) =>
      $apiFetch<UserResponseDto>(`/users/${id}/permissions`, { method: 'PATCH', body }),

    gallery: (query: GalleryQuery = {}) =>
      $apiFetch<ListImagesResponseDto>('/gallery', { query: query as Record<string, unknown> }),
    galleryTotal: (query: GalleryQuery = {}) =>
      $apiFetch<GalleryTotalResponseDto>('/gallery/total', {
        query: query as Record<string, unknown>,
      }),
    getImage: (id: string) => $apiFetch<ImageResponseDto>(`/images/${id}`),
    updateImage: (id: string, body: UpdateImageDto) =>
      $apiFetch<ImageResponseDto>(`/images/${id}`, { method: 'PATCH', body }),
    deleteImage: (id: string) =>
      $apiFetch<DeleteImageResponseDto>(`/images/${id}`, { method: 'DELETE' }),
    patchImageTags: (id: string, body: PatchTagsDto) =>
      $apiFetch<ImageResponseDto>(`/images/${id}/tags`, { method: 'PATCH', body }),
    setFavorite: (id: string, isFavorite: boolean) =>
      $apiFetch<SetFavoriteResponseDto>(`/images/${id}/favorite`, {
        method: 'PUT',
        body: { isFavorite } satisfies SetFavoriteDto,
      }),
    uploadImages: (
      files: File[],
      options: { episodeId?: string; sourceType?: SourceType } = {},
    ) => {
      const form = new FormData()
      files.forEach((file, index) => {
        form.append('files', file, file.name)
        const seconds = parseTimestampSeconds(file.name)
        if (seconds != null) form.append(`timestampSeconds-${index}`, String(seconds))
      })
      if (options.episodeId) form.append('episodeId', options.episodeId)
      if (options.sourceType) form.append('sourceType', options.sourceType)
      return $apiFetch<UploadResponseDto>('/images/upload', { method: 'POST', body: form })
    },

    listCharacters: (query: CharacterListQuery = {}) =>
      $apiFetch<CharacterResponseDto[]>('/characters', { query }),
    getCharacter: (id: string) => $apiFetch<CharacterResponseDto>(`/characters/${id}`),
    getCharacterByTag: (tag: string) =>
      $apiFetch<CharacterResponseDto>(`/characters/by-tag/${encodeURIComponent(tag)}`),
    updateCharacter: (id: string, body: UpdateCharacterDto) =>
      $apiFetch<CharacterResponseDto>(`/characters/${id}`, { method: 'PATCH', body }),
    deleteCharacter: (id: string) =>
      $apiFetch<CharacterResponseDto>(`/characters/${id}`, { method: 'DELETE' }),

    listTags: (query: TagListQuery = {}) => $apiFetch<TagResponseDto[]>('/tags', { query }),
    autocompleteTags: (query: TagAutocompleteQuery = {}) =>
      $apiFetch<AutocompleteTagResponseDto[]>('/tags/autocomplete', { query }),
    updateTag: (id: number | string, body: UpdateTagDto) =>
      $apiFetch<TagResponseDto>(`/tags/${id}`, { method: 'PATCH', body }),

    listSeries: (query: SeriesListQuery = {}) =>
      $apiFetch<SeriesResponseDto[]>('/anime/series', { query }),
    getSeries: (id: string) =>
      $apiFetch<SeriesResponseDto & { seasons: SeasonResponseDto[] }>(`/anime/series/${id}`),
    createSeries: (body: CreateSeriesDto) =>
      $apiFetch<SeriesResponseDto>('/anime/series', { method: 'POST', body }),
    updateSeries: (id: string, body: UpdateSeriesDto) =>
      $apiFetch<SeriesResponseDto>(`/anime/series/${id}`, { method: 'PATCH', body }),
    deleteSeries: (id: string) =>
      $apiFetch<{ ok: boolean }>(`/anime/series/${id}`, { method: 'DELETE' }),
    importSeries: (url: string) =>
      $apiFetch<SeriesResponseDto>('/anime/series/import', { method: 'POST', body: { url } }),

    listSeasons: (seriesId: string) =>
      $apiFetch<SeasonResponseDto[]>(`/anime/series/${seriesId}/seasons`),
    getSeason: (id: string) =>
      $apiFetch<SeasonResponseDto & { episodes: EpisodeResponseDto[] }>(`/anime/seasons/${id}`),
    createSeason: (seriesId: string, body: CreateSeasonDto) =>
      $apiFetch<SeasonResponseDto>(`/anime/series/${seriesId}/seasons`, { method: 'POST', body }),
    importSeason: (seriesId: string, url: string) =>
      $apiFetch<SeasonResponseDto>(`/anime/series/${seriesId}/seasons/import`, {
        method: 'POST',
        body: { url },
      }),
    updateSeason: (id: string, body: UpdateSeasonDto) =>
      $apiFetch<SeasonResponseDto>(`/anime/seasons/${id}`, { method: 'PATCH', body }),
    deleteSeason: (id: string) =>
      $apiFetch<{ ok: boolean }>(`/anime/seasons/${id}`, { method: 'DELETE' }),

    listEpisodes: (seasonId: string) =>
      $apiFetch<EpisodeResponseDto[]>(`/anime/seasons/${seasonId}/episodes`),
    getEpisode: (id: string) => $apiFetch<EpisodeResponseDto>(`/anime/episodes/${id}`),
    createEpisode: (seasonId: string, body: CreateEpisodeDto) =>
      $apiFetch<EpisodeResponseDto>(`/anime/seasons/${seasonId}/episodes`, {
        method: 'POST',
        body,
      }),
    updateEpisode: (id: string, body: UpdateEpisodeDto) =>
      $apiFetch<EpisodeResponseDto>(`/anime/episodes/${id}`, { method: 'PATCH', body }),
    deleteEpisode: (id: string) =>
      $apiFetch<{ ok: boolean }>(`/anime/episodes/${id}`, { method: 'DELETE' }),

    imageEvents: (imageId: string, options: SseOptions) =>
      $apiSse(`/images/image:${imageId}:ai-tags-resolved/events`, options),
  }

  return { $apiFetch, $apiSse, api }
}
