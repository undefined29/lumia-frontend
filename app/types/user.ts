export enum UserPermission {
  Zero = 0,
  UploadImages = 1,
  EditOthersImageTags = 2,
  AssignOthersEpisodeScreenshots = 4,
  DeleteOthersImages = 8,
  ManageAnime = 16,
  Administrator = 1073741824,
}

export const DefaultUserPermissions = UserPermission.UploadImages

export interface UserResponseDto {
  id: string
  name: string
  username: string | null
  avatarUrl: string | null
  permissions?: number
  imagesCount?: number
}

export interface UpdatePermissionsDto {
  permissions: number
}
