import { ref, shallowRef, computed, watch, type Ref } from 'vue'
import type { ResourceStatus } from './useAsyncResource'

export interface InfinitePage<TItem> {
  items: TItem[]
  total?: number
}

export interface UseInfiniteListOptions<TItem> {
  fetchPage: (ctx: { lastSeenId: string | null; limit: number }) => Promise<InfinitePage<TItem>>
  getId: (item: TItem) => string
  limit?: number
  immediate?: boolean
  watch?: Array<Ref<unknown> | (() => unknown)>
}

export interface InfiniteList<TItem> {
  items: Ref<TItem[]>
  status: Ref<ResourceStatus>
  error: Ref<Error | null>
  total: Ref<number>
  hasMore: Ref<boolean>
  loadingMore: Ref<boolean>
  loadMore: () => Promise<void>
  refresh: () => Promise<void>
  retry: () => Promise<void>
}

const DEFAULT_LIMIT = 60

export function useInfiniteList<TItem>(
  options: UseInfiniteListOptions<TItem>,
): InfiniteList<TItem> {
  const { fetchPage, getId, limit = DEFAULT_LIMIT, immediate = true } = options

  const items = shallowRef<TItem[]>([])
  const status = ref<ResourceStatus>('idle')
  const error = shallowRef<Error | null>(null)
  const total = ref(0)
  const loadingMore = ref(false)
  const reachedEnd = ref(false)
  let inFlight = false
  let runToken = 0

  const hasMore = computed(() => !reachedEnd.value && status.value === 'success')

  async function refresh(): Promise<void> {
    const token = ++runToken
    inFlight = true
    status.value = 'loading'
    error.value = null
    reachedEnd.value = false
    loadingMore.value = false
    try {
      const page = await fetchPage({ lastSeenId: null, limit })
      if (token !== runToken) return
      items.value = [...page.items]
      total.value = page.total ?? page.items.length
      if (page.items.length < limit) reachedEnd.value = true
      status.value = page.items.length === 0 ? 'empty' : 'success'
    } catch (err: unknown) {
      if (token !== runToken) return
      error.value = err instanceof Error ? err : new Error('Unknown error')
      status.value = 'error'
    } finally {
      if (token === runToken) inFlight = false
    }
  }

  async function loadMore(): Promise<void> {
    if (inFlight || reachedEnd.value || status.value !== 'success') return
    const last = items.value[items.value.length - 1]
    const lastSeenId = last ? getId(last) : null
    if (!lastSeenId) return
    const token = runToken
    inFlight = true
    loadingMore.value = true
    try {
      const page = await fetchPage({ lastSeenId, limit })
      if (token !== runToken) return
      const seen = new Set(items.value.map(getId))
      const fresh = page.items.filter((it) => !seen.has(getId(it)))
      items.value = [...items.value, ...fresh]
      if (page.total != null) total.value = page.total
      if (page.items.length < limit || fresh.length === 0) reachedEnd.value = true
    } catch {
    } finally {
      if (token === runToken) {
        inFlight = false
        loadingMore.value = false
      }
    }
  }

  if (options.watch?.length) {
    watch(options.watch, () => void refresh())
  }
  if (immediate) void refresh()

  return { items, status, error, total, hasMore, loadingMore, loadMore, refresh, retry: refresh }
}
