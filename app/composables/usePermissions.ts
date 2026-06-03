import { computed, type ComputedRef } from 'vue'
import { useUserStore } from '~/stores/user'
import { UserPermission } from '~/types/user'
import { hasPermission, isAdministrator } from '~/utils/bitmask'

export function usePermissions() {
  const userStore = useUserStore()

  const mask = computed(() => userStore.currentUser?.permissions ?? 0)

  function can(flag: UserPermission): ComputedRef<boolean> {
    return computed(() => hasPermission(mask.value, flag))
  }

  return {
    mask,
    isAdmin: computed(() => isAdministrator(mask.value)),
    canUpload: can(UserPermission.UploadImages),
    canManageAnime: can(UserPermission.ManageAnime),
    canEditOthersTags: can(UserPermission.EditOthersImageTags),
    canAssignOthersEpisodes: can(UserPermission.AssignOthersEpisodeScreenshots),
    canDeleteOthersImages: can(UserPermission.DeleteOthersImages),
    can,
  }
}
