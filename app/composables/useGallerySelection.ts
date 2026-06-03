import { useSelection } from '~/composables/useSelection'

export function useGallerySelection() {
  return useSelection('gallery-selection')
}
