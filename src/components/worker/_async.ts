import { ref, watch } from 'vue'
import type { Ref } from 'vue'
import type { UseAsyncResult } from './_types'

export function useAsync<T>(
  loader: () => Promise<T> | T,
  dependencies: unknown[] | (() => unknown[])
): UseAsyncResult<T> {
  const data = ref<T | null>(null) as Ref<T | null>
  const loading = ref(false)
  const error = ref<string | null>(null)

  let requestId = 0

  const refresh = async (): Promise<void> => {
    const currentRequest = ++requestId

    loading.value = true
    error.value = null

    try {
      const result = await loader()

      if (currentRequest === requestId) {
        data.value = result
      }
    } catch (err: unknown) {
      if (currentRequest === requestId) {
        error.value =
          err instanceof Error ? err.message : 'Something went wrong.'
      }
    } finally {
      if (currentRequest === requestId) {
        loading.value = false
      }
    }
  }

  const setData = (value: T | null): void => {
    data.value = value
  }

  if (typeof dependencies === 'function') {
    watch(
      () => dependencies(),
      () => {
        void refresh()
      },
      { immediate: true, deep: true }
    )
  } else {
    void refresh()
  }

  return {
    data,
    loading,
    error,
    refresh,
    setData,
  }
}