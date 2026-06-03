import type { ImageStatus, SourceType } from '~/types/image'
import type { TagView } from '~/types/view'
import type { SseController } from '~/composables/useApi'
import { ApiError, ErrorCode } from '~/types/api'
import { tagViewsFromEventTags } from '~/utils/adapters'
import { sha256Hex } from '~/utils/hash'

export type UploadPhase = 'queued' | 'uploading' | 'analyzing' | 'done' | 'error'

export interface UploadOptions {
  episodeId?: string
  sourceType?: SourceType
  open?: boolean
}

export interface UploadItemView {
  id: string
  filename: string
  size: number
  hue: number
  phase: UploadPhase
  progress: number
  tags: TagView[] | null
  error: string | null
  previewUrl: string | null
}

const BATCH_SIZE = 10

const UPLOAD_ERROR_KEY: Record<number, string> = {
  [ErrorCode.CorruptedImage]: 'errors.corruptedImage',
  [ErrorCode.NotMultipart]: 'errors.notMultipart',
  [ErrorCode.NoFilesUploaded]: 'errors.noFilesUploaded',
  [ErrorCode.NotEnoughPermissions]: 'errors.notEnoughPermissions',
}

function phaseOf(status: ImageStatus): UploadPhase {
  switch (status) {
    case 'uploading':
      return 'uploading'
    case 'pending':
      return 'queued'
    case 'indexing':
      return 'analyzing'
    case 'done':
      return 'done'
    case 'failed':
      return 'error'
  }
}

export function useUpload() {
  const { api } = useApi()
  const { toImageView } = useAdapters()
  const { t } = useI18n()

  const open = useState<boolean>('upload-open', () => false)
  const items = useState<UploadItemView[]>('upload-items', () => [])
  const error = useState<string | null>('upload-error', () => null)
  const notice = useState<string | null>('upload-notice', () => null)
  const completedTick = useState<number>('upload-completed-tick', () => 0)
  const controllers = useState<Map<string, SseController>>('upload-controllers', () => new Map())
  const picker = useState<(() => void) | null>('upload-picker', () => null)
  const suppressGlobalDrop = useState<boolean>('upload-suppress-global', () => false)

  const doneCount = computed(() => items.value.filter((i) => i.phase === 'done').length)
  const total = computed(() => items.value.length)

  function patch(id: string, patchData: Partial<UploadItemView>): void {
    items.value = items.value.map((i) => (i.id === id ? { ...i, ...patchData } : i))
  }

  async function start(files: File[], options: UploadOptions = {}): Promise<void> {
    if (!files.length) return
    if (options.open ?? true) open.value = true
    error.value = null
    notice.value = null
    const ordered = [...files].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }),
    )
    let added = 0
    for (let i = 0; i < ordered.length; i += BATCH_SIZE) {
      added += await uploadBatch(ordered.slice(i, i + BATCH_SIZE), options)
    }
    if (!error.value && added === 0 && !notice.value) {
      notice.value = t('upload.allDuplicates')
    }
  }

  async function uploadBatch(batch: File[], options: UploadOptions): Promise<number> {
    try {
      const { items: uploaded } = await api.uploadImages(batch, {
        episodeId: options.episodeId,
        sourceType: options.sourceType,
      })
      if (!uploaded.length) return 0

      const hashes = await Promise.all(batch.map((f) => f.arrayBuffer().then(sha256Hex)))
      const itemByHash = new Map(
        uploaded.map((item) => [item.storageKey?.split('/').pop() ?? '', item] as const),
      )

      const newViews: UploadItemView[] = []
      batch.forEach((file, idx) => {
        const item = itemByHash.get(hashes[idx]!)
        if (!item) return
        newViews.push({
          id: item.id,
          filename: file.name,
          size: file.size,
          hue: Math.abs(item.id.split('').reduce((h, c) => h + c.charCodeAt(0), 0)) % 360,
          phase: phaseOf(item.status),
          progress: 0,
          tags: null,
          error: null,
          previewUrl: URL.createObjectURL(file),
        })
      })

      items.value = [...items.value, ...newViews]
      for (const view of newViews) subscribe(view.id)
      return newViews.length
    } catch (e) {
      const code = e instanceof ApiError ? e.code : undefined
      error.value = t((code != null && UPLOAD_ERROR_KEY[code]) || 'errors.uploadFailed')
      return 0
    }
  }

  function dismissError(): void {
    error.value = null
  }

  function unsubscribe(id: string): void {
    controllers.value.get(id)?.close()
    controllers.value.delete(id)
  }

  function subscribe(id: string): void {
    const controller = api.imageEvents(id, {
      onMessage: async (event) => {
        if (event.type === 'ai-tags-resolved' || event.status === 'done') {
          patch(id, { phase: 'done', progress: 1, error: null })
          const eventTags = event.data?.tags ? tagViewsFromEventTags(event.data.tags) : null
          if (eventTags?.length) {
            patch(id, { tags: eventTags })
          } else {
            try {
              const image = await api.getImage(id)
              patch(id, { tags: toImageView(image).tags })
            } catch {}
          }
          completedTick.value++
          unsubscribe(id)
          return
        }
        if (event.status) {
          const phase = phaseOf(event.status)
          patch(id, {
            phase,
            progress: event.progress ?? (phase === 'analyzing' ? 1 : 0),
            error: event.errorMessage ?? null,
          })
        }
      },
      onError: () => {
        const item = items.value.find((i) => i.id === id)
        if (item?.phase === 'done') return
        patch(id, { phase: 'error', error: 'Stream error' })
      },
      onClose: () => unsubscribe(id),
    })
    controllers.value.set(id, controller)
  }

  function revokePreview(item: UploadItemView | undefined): void {
    if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl)
  }

  function remove(id: string): void {
    unsubscribe(id)
    revokePreview(items.value.find((i) => i.id === id))
    items.value = items.value.filter((i) => i.id !== id)
  }

  async function deleteUploaded(id: string): Promise<void> {
    try {
      await api.deleteImage(id)
    } catch {}
    remove(id)
  }

  function clear(): void {
    for (const c of controllers.value.values()) c.close()
    controllers.value.clear()
    for (const item of items.value) revokePreview(item)
    items.value = []
    error.value = null
    notice.value = null
  }

  function openModal(): void {
    open.value = true
  }
  function closeModal(): void {
    open.value = false
  }

  function registerPicker(fn: (() => void) | null): void {
    picker.value = fn
  }

  function pickFiles(): void {
    if (items.value.length) {
      open.value = true
      return
    }
    if (picker.value) picker.value()
    else open.value = true
  }

  return {
    open,
    items,
    error,
    notice,
    completedTick,
    doneCount,
    total,
    batchSize: BATCH_SIZE,
    suppressGlobalDrop,
    start,
    remove,
    deleteUploaded,
    clear,
    openModal,
    closeModal,
    registerPicker,
    pickFiles,
    dismissError,
  }
}
