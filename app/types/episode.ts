export interface EpisodeResponseDto {
  id: string
  seasonId: string
  number: number
  title: string | null
  imagesCount: number
  imageId?: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateEpisodeDto {
  number: number
  title?: string
}

export interface UpdateEpisodeDto {
  number?: number
  title?: string | null
}
