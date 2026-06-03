import { ref, computed } from 'vue'
import type { AnimeView } from '~/types/view'

const DEBOUNCE_MS = 250
const SEARCH_LIMIT = 50

export function useSeriesSearch() {
  const { api } = useApi()
  const { toAnimeView } = useAdapters()

  const base = ref<AnimeView[]>([])
  const results = ref<AnimeView[]>([])
  const query = ref('')
  const loading = ref(false)
  const searching = ref(false)
  let timer: ReturnType<typeof setTimeout> | null = null

  const options = computed(() => (query.value.trim() ? results.value : base.value))

  async function load(): Promise<void> {
    loading.value = true
    try {
      const rows = await api.listSeries()
      base.value = rows.map((s) => toAnimeView(s))
    } finally {
      loading.value = false
    }
  }

  async function runSearch(term: string): Promise<void> {
    try {
      const rows = await api.listSeries({ search: term, limit: SEARCH_LIMIT })
      if (query.value.trim() === term) results.value = rows.map((s) => toAnimeView(s))
    } finally {
      if (query.value.trim() === term) searching.value = false
    }
  }

  watch(query, (value) => {
    if (timer) clearTimeout(timer)
    const term = value.trim()
    if (!term) {
      results.value = []
      searching.value = false
      return
    }
    searching.value = true
    timer = setTimeout(() => void runSearch(term), DEBOUNCE_MS)
  })

  function reset(): void {
    if (timer) clearTimeout(timer)
    query.value = ''
    results.value = []
    searching.value = false
  }

  return { query, options, base, loading, searching, load, reset }
}
