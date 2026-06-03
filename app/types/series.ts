export interface SeriesResponseDto {
  id: string
  titleRus: string
  titleEng: string | null
  titleJap: string | null
  rating: string | null
  coverImageId: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateSeriesDto {
  titleRus: string
  titleEng?: string
  titleJap?: string
  rating?: string
  coverImageId?: string
}

export interface UpdateSeriesDto {
  titleRus?: string
  titleEng?: string | null
  titleJap?: string | null
  rating?: string | null
  coverImageId?: string | null
}

export interface ImportShikimoriDto {
  url: string
}

export interface SeriesListQuery {
  search?: string
  lastSeenId?: string
  limit?: number
}
