export enum ErrorCode {
  UNKNOWN = 1,

  UserNotFound = 1001,
  NotEnoughPermissions = 1002,

  SeriesNotFound = 2001,
  SeasonNotFound = 2002,
  EpisodeNotFound = 2003,
  SeriesHasSeasons = 2004,
  SeasonHasEpisodes = 2005,
  InvalidShikimoriUrl = 2006,
  ShikimoriAnimeNotFound = 2007,
  ShikimoriRequestFailed = 2008,
  ShikimoriAlreadyImported = 2009,

  ImageNotFound = 3001,
  NoFilesUploaded = 3002,
  NotMultipart = 3003,
  CorruptedImage = 3004,
}

export interface ErrorItem {
  code?: ErrorCode | number
  message?: string
  field?: string
}

export interface ApiEnvelope<T> {
  ok: boolean
  result: T
  errors: ErrorItem[]
}

export class ApiError extends Error {
  readonly code: ErrorCode | number
  readonly status: number
  readonly errors: ErrorItem[]
  /** Milliseconds to wait before retrying, parsed from the 429 `Retry-After` header. */
  readonly retryAfterMs?: number

  constructor(
    message: string,
    options: {
      code?: ErrorCode | number
      status?: number
      errors?: ErrorItem[]
      retryAfterMs?: number
    } = {},
  ) {
    super(message)
    this.name = 'ApiError'
    this.code = options.code ?? ErrorCode.UNKNOWN
    this.status = options.status ?? 0
    this.errors = options.errors ?? []
    this.retryAfterMs = options.retryAfterMs
  }

  get isRateLimited(): boolean {
    return this.status === 429
  }
}

export interface KeysetQuery {
  lastSeenId?: string | number
  limit?: number
}

export interface KeysetPage<T> {
  items: T[]
  nextCursor: string | number | null
}
