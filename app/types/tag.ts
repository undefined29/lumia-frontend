export type TagCategory =
  | 'rating'
  | 'character'
  | 'copyright'
  | 'artist'
  | 'general'
  | 'meta'
  | 'year'

export const TAG_CATEGORIES: readonly TagCategory[] = [
  'rating',
  'character',
  'copyright',
  'artist',
  'general',
  'meta',
  'year',
] as const

export interface TagResponseDto {
  id: number
  name: string
  category: string | null
  usageCount: number
  colorOverride: string | null
}

export interface AutocompleteTagResponseDto {
  name: string
  category: string | null
  usageCount: number
  colorOverride: string | null
}

export interface ImageTagRef {
  tag: string
  color?: string
}

export interface UpdateTagDto {
  name?: string
  category?: string
  colorOverride?: string | null
}

export interface TagListQuery {
  search?: string
  category?: string
  lastSeenId?: number
  limit?: number
}

export interface TagAutocompleteQuery {
  q?: string
  category?: string
  limit?: number
}
