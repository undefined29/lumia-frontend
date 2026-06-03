import type { TagCategory, AutocompleteTagResponseDto } from '~/types/tag'
import { TAG_CATEGORIES } from '~/types/tag'
import type { TagView, TagGroups } from '~/types/view'

export const TAG_LABELS: Record<TagCategory, string> = {
  rating: 'rating',
  character: 'char',
  copyright: 'series',
  artist: 'artist',
  general: 'tag',
  meta: 'meta',
  year: 'year',
}

export function categoryColorVar(category: TagCategory): string {
  return `var(--cat-${category})`
}

export function narrowCategory(category: string | null | undefined): TagCategory {
  if (category && (TAG_CATEGORIES as readonly string[]).includes(category)) {
    return category as TagCategory
  }
  return 'general'
}

export function orderedTagGroups(
  groups: TagGroups,
): Array<{ category: TagCategory; tags: TagView[] }> {
  return TAG_CATEGORIES.flatMap((category) => {
    const tags = groups[category]
    return tags && tags.length ? [{ category, tags }] : []
  })
}

export function flattenTagGroups(groups: TagGroups): TagView[] {
  return orderedTagGroups(groups).flatMap((g) => g.tags)
}

export function rankAutocomplete(
  items: AutocompleteTagResponseDto[],
  query: string,
): AutocompleteTagResponseDto[] {
  const q = query.trim().toLowerCase()
  if (!q) return [...items].sort((a, b) => b.usageCount - a.usageCount)
  return [...items]
    .filter((t) => t.name.toLowerCase().includes(q))
    .sort((a, b) => {
      const aStarts = a.name.toLowerCase().startsWith(q) ? 0 : 1
      const bStarts = b.name.toLowerCase().startsWith(q) ? 0 : 1
      if (aStarts !== bStarts) return aStarts - bStarts
      return b.usageCount - a.usageCount
    })
}
