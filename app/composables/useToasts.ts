export type ToastTone = 'info' | 'success' | 'warn' | 'error'

export interface ToastView {
  id: number
  tone: ToastTone
  message: string
}

export interface ToastOptions {
  tone?: ToastTone
  /** Auto-dismiss delay in ms. Pass 0 to keep the toast until dismissed manually. */
  ttl?: number
}

const DEFAULT_TTL_MS = 5000

/**
 * Lightweight global toast queue. State is shared via `useState` so any component
 * or composable (including the API layer) can surface a transient message.
 */
export function useToasts() {
  const toasts = useState<ToastView[]>('toasts', () => [])
  const seq = useState<number>('toasts-seq', () => 0)

  function dismiss(id: number): void {
    toasts.value = toasts.value.filter((toast) => toast.id !== id)
  }

  function push(message: string, options: ToastOptions = {}): number {
    const id = ++seq.value
    toasts.value = [...toasts.value, { id, tone: options.tone ?? 'info', message }]

    const ttl = options.ttl ?? DEFAULT_TTL_MS
    if (import.meta.client && ttl > 0) {
      setTimeout(() => dismiss(id), ttl)
    }
    return id
  }

  return { toasts, push, dismiss }
}
