import type { SeriesResponseDto } from '~/types/series'
import type { SeasonResponseDto } from '~/types/season'
import type { EpisodeResponseDto } from '~/types/episode'
import type { CharacterResponseDto } from '~/types/character'
import type { TagResponseDto } from '~/types/tag'
import type { ImageResponseDto, TagsByCategory, EventTagsByCategory } from '~/types/image'
import type { UserResponseDto } from '~/types/user'
import type {
  AnimeView,
  SeasonView,
  EpisodeView,
  CharacterView,
  ImageView,
  UserView,
  TagGroups,
  TagView,
} from '~/types/view'
import { hueFromId } from './hue'
import { imageUrlFromKey, thumbUrlFromKey, discordIdFromAvatarUrl } from './format'
import { narrowCategory } from './tags'
import { isAdministrator } from './bitmask'

export interface AdapterContext {
  baseCdnUrl?: string
  useThumb?: boolean
  currentUserId?: string | null
  locale?: string
}

function localizedSeriesTitle(
  series: { titleRus: string; titleEng: string | null },
  locale?: string,
): string {
  if (locale && locale !== 'ru') return series.titleEng || series.titleRus
  return series.titleRus || series.titleEng || ''
}

type SeriesWithAggregate = SeriesResponseDto & {
  seasonsCount?: number
  episodesCount?: number
  year?: string | null
  isOngoing?: boolean
}

type UserWithMeta = UserResponseDto & {
  joinedAt?: string
  lastActiveAt?: string
  imagesCount?: number
}

function parseRating(rating: string | null): number | null {
  if (!rating) return null
  const n = Number.parseFloat(rating)
  return Number.isFinite(n) ? n : null
}

function buildTagGroups(tagsByCategory: TagsByCategory): { groups: TagGroups; flat: TagView[] } {
  const groups: TagGroups = {}
  const flat: TagView[] = []
  for (const [rawCat, refs] of Object.entries(tagsByCategory ?? {})) {
    const category = narrowCategory(rawCat)
    const views: TagView[] = (refs ?? []).map((r) => ({
      name: r.tag,
      category,
      color: r.color,
    }))
    if (!views.length) continue
    groups[category] = [...(groups[category] ?? []), ...views]
  }
  for (const views of Object.values(groups)) flat.push(...(views ?? []))
  return { groups, flat }
}

export function tagViewsFromEventTags(tags: EventTagsByCategory): TagView[] {
  const flat: TagView[] = []
  for (const [rawCat, names] of Object.entries(tags ?? {})) {
    const category = narrowCategory(rawCat)
    for (const name of names ?? []) flat.push({ name, category })
  }
  return flat
}

export function toAnimeView(series: SeriesResponseDto, ctx: AdapterContext = {}): AnimeView {
  const s = series as SeriesWithAggregate
  const isRu = !ctx.locale || ctx.locale === 'ru'
  const primary = isRu
    ? series.titleRus || series.titleEng || series.titleJap || 'Untitled'
    : series.titleEng || series.titleRus || series.titleJap || 'Untitled'
  const secondary = isRu
    ? series.titleEng && series.titleEng !== series.titleRus
      ? series.titleEng
      : series.titleJap
    : series.titleRus && series.titleRus !== series.titleEng
      ? series.titleRus
      : series.titleJap
  return {
    id: series.id,
    title: primary,
    titleSecondary: secondary,
    rating: parseRating(series.rating),
    year: s.year ?? null,
    hue: hueFromId(series.id),
    coverImageId: series.coverImageId,
    coverUrl: null,
    bannerUrl: null,
    seasonsCount: s.seasonsCount ?? 0,
    episodesCount: s.episodesCount ?? 0,
    isOngoing: s.isOngoing ?? false,
  }
}

export interface SeriesAggregates {
  seasonsCount: number
  episodesCount: number
  year: string | null
  isOngoing: boolean
}

function seasonYear(iso: string | null | undefined): number | null {
  if (!iso) return null
  const y = Number(iso.slice(0, 4))
  return Number.isFinite(y) ? y : null
}

function formatYearRange(years: number[]): string | null {
  if (!years.length) return null
  const min = Math.min(...years)
  const max = Math.max(...years)
  return min === max ? String(min) : `${min}–${max}`
}

export function deriveSeriesAggregates(seasons: SeasonResponseDto[]): SeriesAggregates {
  const years = seasons
    .flatMap((s) => [seasonYear(s.airedOn), seasonYear(s.releasedOn)])
    .filter((y): y is number => y != null)
  return {
    seasonsCount: seasons.length,
    episodesCount: seasons.reduce((sum, s) => sum + (s.episodesCount ?? s.episodesAired ?? 0), 0),
    year: formatYearRange(years),
    isOngoing: seasons.some((s) => s.status === 'ongoing'),
  }
}

export function toSeasonView(season: SeasonResponseDto, imagesCount = 0): SeasonView {
  return {
    id: season.id,
    seriesId: season.seriesId,
    number: season.number,
    title: season.title || `Season ${season.number}`,
    status: season.status,
    isOngoing: season.status === 'ongoing',
    episodesCount: season.episodesCount ?? 0,
    episodesAired: season.episodesAired ?? 0,
    imagesCount,
    imageId: season.imageId ?? null,
  }
}

export function toEpisodeView(ep: EpisodeResponseDto): EpisodeView {
  const imagesCount = ep.imagesCount ?? 0
  return {
    id: ep.id,
    seasonId: ep.seasonId,
    number: ep.number,
    title: ep.title || `Episode ${ep.number}`,
    imagesCount,
    isEmpty: imagesCount === 0,
    hue: hueFromId(ep.id),
    imageId: ep.imageId ?? null,
    thumbUrl: null,
  }
}

export function toCharacterView(
  char: CharacterResponseDto,
  tag: TagResponseDto | null = null,
  _ctx: AdapterContext = {},
): CharacterView {
  return {
    id: char.id,
    tagId: char.tagId,
    tagName: char.tag,
    displayName: char.displayName,
    hue: hueFromId(char.id),
    avatarUrl: null,
    coverImageId: char.coverImageId,
    usedInCount: char.imagesCount ?? tag?.usageCount ?? 0,
    color: tag?.colorOverride ?? null,
  }
}

export function toImageView(img: ImageResponseDto, ctx: AdapterContext = {}): ImageView {
  const width = img.width ?? 1
  const height = img.height ?? 1
  const { groups, flat } = buildTagGroups(img.tagsByCategory)
  return {
    id: img.id,
    authorId: img.authorId,
    url: imageUrlFromKey(img.storageKey, ctx.baseCdnUrl),
    thumbUrl: thumbUrlFromKey(img.storageKey, ctx.baseCdnUrl, ctx.useThumb ?? false),
    width,
    height,
    aspectRatio: height > 0 ? width / height : 1,
    hue: hueFromId(img.id),
    format: img.sourceFormat ?? 'webp',
    fileSize: img.fileSize ?? 0,
    contentHash: img.contentHash,
    sourceType: img.sourceType,
    status: img.status,
    createdAt: img.createdAt,
    favorite: img.favorite ?? false,
    timestampSeconds: img.timestampSeconds ?? null,
    seriesId: img.series?.id ?? null,
    seriesTitle: img.series ? localizedSeriesTitle(img.series, ctx.locale) : null,
    seasonNumber: img.season?.number ?? null,
    episodeNumber: img.episode?.number ?? null,
    episodeId: img.episode?.id ?? null,
    tagGroups: groups,
    tags: flat,
  }
}

export function toUserView(user: UserResponseDto, ctx: AdapterContext = {}): UserView {
  const u = user as UserWithMeta
  const permissions = user.permissions ?? 0
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    avatarUrl: user.avatarUrl,
    hue: hueFromId(user.id),
    permissions,
    isAdmin: isAdministrator(permissions),
    isSelf: ctx.currentUserId != null && user.id === ctx.currentUserId,
    discordId: discordIdFromAvatarUrl(user.avatarUrl),
    imagesCount: u.imagesCount ?? 0,
    joinedAt: u.joinedAt ?? user.id,
    lastActiveAt: u.lastActiveAt ?? user.id,
  }
}
