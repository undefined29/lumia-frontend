export type SeasonStatus = 'anons' | 'ongoing' | 'released'

export interface SeasonResponseDto {
  id: string
  seriesId: string
  number: number
  title: string | null
  shikimoriId: number | null
  status: SeasonStatus | null
  episodesCount: number | null
  episodesAired: number | null
  airedOn: string | null
  releasedOn: string | null
  imageId?: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateSeasonDto {
  number: number
  title?: string
}

export interface UpdateSeasonDto {
  number?: number
  title?: string | null
}
