import { UserPermission } from '~/types/user'

export interface PermFlag {
  key: string
  bit: UserPermission
  icon: string
}

export const PERM_FLAGS: readonly PermFlag[] = [
  { key: 'uploadImages', bit: UserPermission.UploadImages, icon: 'upload' },
  { key: 'editOthersTags', bit: UserPermission.EditOthersImageTags, icon: 'edit' },
  { key: 'assignEpisode', bit: UserPermission.AssignOthersEpisodeScreenshots, icon: 'film' },
  { key: 'deleteOthers', bit: UserPermission.DeleteOthersImages, icon: 'trash' },
]
