import type { ImageStatus, SourceType } from './image'
import type { SeasonStatus } from './season'
import type { TagCategory, ImageTagRef } from './tag'

export interface TagView {
  name: string
  category: TagCategory
  count?: number
  color?: string
}

export type TagGroups = Partial<Record<TagCategory, TagView[]>>

export interface ImageView {
  id: string
  authorId: string
  url: string
  thumbUrl: string
  width: number
  height: number
  aspectRatio: number
  hue: number
  format: string
  fileSize: number
  contentHash: string
  sourceType: SourceType
  status: ImageStatus
  createdAt: string
  favorite: boolean
  timestampSeconds: number | null
  seriesId: string | null
  seriesTitle: string | null
  seasonNumber: number | null
  episodeNumber: number | null
  episodeId: string | null
  tagGroups: TagGroups
  tags: TagView[]
}

export interface AnimeView {
  id: string
  title: string
  titleSecondary: string | null
  rating: number | null
  year: string | null
  hue: number
  coverImageId: string | null
  coverUrl: string | null
  bannerUrl: string | null
  seasonsCount: number
  episodesCount: number
  isOngoing: boolean
}

export interface SeasonView {
  id: string
  seriesId: string
  number: number
  title: string
  status: SeasonStatus | null
  isOngoing: boolean
  episodesCount: number
  episodesAired: number
  imagesCount: number
  imageId: string | null
}

export interface EpisodeView {
  id: string
  seasonId: string
  number: number
  title: string
  imagesCount: number
  isEmpty: boolean
  hue: number
  imageId: string | null
  thumbUrl: string | null
}

export interface CharacterView {
  id: string
  tagId: string
  tagName: string
  displayName: string
  hue: number
  avatarUrl: string | null
  coverImageId: string | null
  usedInCount: number
  color: string | null
}

export interface UserView {
  id: string
  name: string
  username: string | null
  avatarUrl: string | null
  hue: number
  permissions: number
  isAdmin: boolean
  isSelf: boolean
  discordId: string | null
  imagesCount: number
  joinedAt: string
  lastActiveAt: string
}

export type { ImageTagRef }
