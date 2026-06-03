import { ref, shallowRef, computed, watch, type Ref } from 'vue'

export type ResourceStatus = 'idle' | 'loading' | 'error' | 'empty' | 'success'

export interface UseAsyncResourceOptions<T> {
  isEmpty?: (data: T) => boolean
  immediate?: boolean
  watch?: Array<Ref<unknown> | (() => unknown)>
}

export interface AsyncResource<T> {
  status: Ref<ResourceStatus>
  data: Ref<T | null>
  error: Ref<Error | null>
  isLoading: Ref<boolean>
  refresh: () => Promise<void>
  retry: () => Promise<void>
}

function defaultIsEmpty<T>(data: T): boolean {
  if (Array.isArray(data)) return data.length === 0
  if (data == null) return true
  return false
}

export function useAsyncResource<T>(
  fetcher: () => Promise<T>,
  options: UseAsyncResourceOptions<T> = {},
): AsyncResource<T> {
  const { isEmpty = defaultIsEmpty, immediate = true } = options

  const status = ref<ResourceStatus>('idle')
  const data = shallowRef<T | null>(null)
  const error = shallowRef<Error | null>(null)
  let runToken = 0

  async function refresh(): Promise<void> {
    const token = ++runToken
    status.value = 'loading'
    error.value = null
    try {
      const result = await fetcher()
      if (token !== runToken) return
      data.value = result
      status.value = isEmpty(result) ? 'empty' : 'success'
    } catch (err: unknown) {
      if (token !== runToken) return
      error.value = err instanceof Error ? err : new Error('Unknown error')
      status.value = 'error'
    }
  }

  const isLoading = computed(() => status.value === 'loading')

  if (options.watch?.length) {
    watch(options.watch, () => void refresh())
  }

  if (immediate) {
    void refresh()
  }

  return { status, data, error, isLoading, refresh, retry: refresh }
}
