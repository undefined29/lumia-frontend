import type { TagCategory } from './tag'

export interface SelectedTag {
  name: string
  category: TagCategory
  exclude?: boolean
}

export interface GalleryFilters {
  tags: SelectedTag[]
  characterTag: string | null
  characterLabel: string | null
  authorId: string | null
  authorLabel: string | null
  seriesId: string | null
  seriesTitle: string | null
  seasonId: string | null
  seasonLabel: string | null
  episodeId: string | null
  episodeLabel: string | null
  withoutEpisodeLink: boolean
  onlyFavorites: boolean
}

export function emptyFilters(): GalleryFilters {
  return {
    tags: [],
    characterTag: null,
    characterLabel: null,
    authorId: null,
    authorLabel: null,
    seriesId: null,
    seriesTitle: null,
    seasonId: null,
    seasonLabel: null,
    episodeId: null,
    episodeLabel: null,
    withoutEpisodeLink: false,
    onlyFavorites: false,
  }
}
