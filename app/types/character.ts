export interface CharacterResponseDto {
  id: string
  tagId: string
  tag: string
  displayName: string
  coverImageId: string | null
  imagesCount: number
}

export interface CharacterListQuery {
  name?: string
  lastSeenId?: string
  limit?: number
}

export interface UpdateCharacterDto {
  name?: string
  imageId?: string
}
