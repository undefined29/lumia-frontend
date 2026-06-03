import { computed } from 'vue'

export function useSelection(namespace: string) {
  const active = useState<boolean>(`${namespace}-active`, () => false)
  const selected = useState<Set<string>>(`${namespace}-set`, () => new Set())
  const anchorId = useState<string | null>(`${namespace}-anchor`, () => null)

  const count = computed(() => selected.value.size)
  const isEmpty = computed(() => selected.value.size === 0)

  function isSelected(id: string): boolean {
    return selected.value.has(id)
  }

  function commit(next: Set<string>): void {
    selected.value = next
    active.value = next.size > 0
  }

  function enable(): void {
    active.value = true
  }

  function toggle(id: string): void {
    const next = new Set(selected.value)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    anchorId.value = id
    commit(next)
  }

  function selectOnly(id: string): void {
    anchorId.value = id
    commit(new Set([id]))
  }

  function selectRange(id: string, orderedIds: string[]): void {
    const anchor = anchorId.value
    if (!anchor || anchor === id) {
      toggle(id)
      return
    }
    const a = orderedIds.indexOf(anchor)
    const b = orderedIds.indexOf(id)
    if (a < 0 || b < 0) {
      toggle(id)
      return
    }
    const [lo, hi] = a < b ? [a, b] : [b, a]
    const next = new Set(selected.value)
    for (let i = lo; i <= hi; i++) next.add(orderedIds[i]!)
    commit(next)
  }

  function selectAll(ids: string[]): void {
    commit(new Set(ids))
  }

  function setSelection(ids: string[]): void {
    commit(new Set(ids))
  }

  function addMany(ids: string[]): void {
    const next = new Set(selected.value)
    for (const id of ids) next.add(id)
    commit(next)
  }

  function clear(): void {
    selected.value = new Set()
    active.value = false
    anchorId.value = null
  }

  function prune(existingIds: string[]): void {
    const existing = new Set(existingIds)
    let changed = false
    const next = new Set<string>()
    for (const id of selected.value) {
      if (existing.has(id)) next.add(id)
      else changed = true
    }
    if (changed) commit(next)
  }

  return {
    active,
    selected,
    count,
    isEmpty,
    isSelected,
    enable,
    toggle,
    selectOnly,
    selectRange,
    selectAll,
    setSelection,
    addMany,
    clear,
    prune,
  }
}
