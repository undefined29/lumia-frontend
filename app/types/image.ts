import type { ImageTagRef } from './tag'

export type ImageStatus = 'uploading' | 'pending' | 'indexing' | 'done' | 'failed'

export type SourceType = 'fanart' | 'screenshot'

export type TagsByCategory = Record<string, ImageTagRef[]>

export interface ImageSeriesRef {
  id: string
  titleRus: string
  titleEng: string | null
  titleJap: string | null
  rating: string | null
  coverImageId: string | null
  createdAt: string
  updatedAt: string
}

export interface ImageSeasonRef {
  id: string
  seriesId: string
  number: number
  title: string | null
  shikimoriId: number | null
  status: 'anons' | 'ongoing' | 'released' | null
  episodesCount: number | null
  episodesAired: number | null
  airedOn: string | null
  releasedOn: string | null
  createdAt: string
  updatedAt: string
}

export interface ImageEpisodeRef {
  id: string
  seasonId: string
  number: number
  title: string | null
  createdAt: string
  updatedAt: string
}

export interface ImageResponseDto {
  id: string
  authorId: string
  contentHash: string
  storageKey: string | null
  sourceFormat: string | null
  width: number | null
  height: number | null
  fileSize: number | null
  sourceType: SourceType
  status: ImageStatus
  errorMessage: string | null
  timestampSeconds: number | null
  createdAt: string
  updatedAt: string
  favorite?: boolean
  tagsByCategory: TagsByCategory
  series?: ImageSeriesRef | null
  season?: ImageSeasonRef | null
  episode?: ImageEpisodeRef | null
}

export interface ListImagesResponseDto {
  images: ImageResponseDto[]
  afterFilter?: number
}

export interface GalleryTotalResponseDto {
  total: number
}

export type ImageSortType = 'createdAt' | 'timestampSeconds'
export type ImageSortDirection = 'asc' | 'desc'

export interface GalleryQuery {
  tags?: string[]
  excludeTags?: string[]
  authorId?: string
  seriesId?: string
  seasonId?: string
  episodeId?: string
  withoutEpisodeLink?: boolean
  onlyFavorites?: boolean
  sourceType?: SourceType
  sortType?: ImageSortType
  sortDirection?: ImageSortDirection
  lastSeenId?: string
  limit?: number
}

export interface PatchTagAdd {
  name: string
  category: string
}

export interface PatchTagsDto {
  add?: PatchTagAdd[]
  remove?: string[]
}

export interface SetFavoriteDto {
  isFavorite: boolean
}

export interface SetFavoriteResponseDto {
  ok: boolean
}

export interface UpdateImageDto {
  episodeId?: string | null
  sourceType?: SourceType
}

export interface DeleteImageResponseDto {
  ok: boolean
}

export interface UploadItemDto {
  id: string
  status: ImageStatus
  storageKey: string | null
  sourceFormat: string | null
}

export interface UploadResponseDto {
  items: UploadItemDto[]
}

export type EventTagsByCategory = Record<string, string[]>

export interface ImageStatusEvent {
  type?: string
  data?: { imageId?: string; tags?: EventTagsByCategory }
  id?: string
  status?: ImageStatus
  errorMessage?: string | null
  progress?: number
}
