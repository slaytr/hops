import { ref } from 'vue'
import { apiGet, apiPost, apiPut, apiDelete } from '../api/client'

/**
 * Generic CRUD composable for settings managers.
 *
 * @param endpoint - The API path prefix, e.g. '/rooms' or '/room-types'
 * @param responseKey - The key in the JSON response that holds the list, e.g. 'rooms'
 */
export function useCrud<T extends { id: string }>(endpoint: string, responseKey: string) {
  const items = ref<T[]>([]) as { value: T[] }
  const loading = ref(false)
  const error = ref('')
  const editingItem = ref<T | null>(null) as { value: T | null }

  const fetchItems = async () => {
    try {
      const data = await apiGet<Record<string, T[]>>(endpoint)
      items.value = data[responseKey]
    } catch (e) {
      error.value = `Failed to fetch ${responseKey}`
    }
  }

  const createItem = async (formData: Partial<T>): Promise<boolean> => {
    loading.value = true
    error.value = ''

    try {
      await apiPost(`${endpoint}`, formData)
      await fetchItems()
      return true
    } catch (e: any) {
      error.value = e.message || `Failed to add ${responseKey}`
      return false
    } finally {
      loading.value = false
    }
  }

  const updateItem = async (id: string, formData: Partial<T>): Promise<boolean> => {
    loading.value = true
    error.value = ''

    try {
      await apiPut(`${endpoint}/${id}`, formData)
      await fetchItems()
      return true
    } catch (e: any) {
      error.value = e.message || `Failed to update ${responseKey}`
      return false
    } finally {
      loading.value = false
    }
  }

  const deleteItem = async (id: string): Promise<boolean> => {
    if (!confirm(`Are you sure you want to delete this item?`)) return false

    loading.value = true
    error.value = ''

    try {
      await apiDelete(`${endpoint}/${id}`)
      await fetchItems()
      return true
    } catch (e: any) {
      error.value = e.message || `Failed to delete ${responseKey}`
      return false
    } finally {
      loading.value = false
    }
  }

  const startEdit = (item: T) => {
    editingItem.value = item
    error.value = ''
  }

  const cancelEdit = () => {
    editingItem.value = null
    error.value = ''
  }

  return {
    items,
    loading,
    error,
    editingItem,
    fetchItems,
    createItem,
    updateItem,
    deleteItem,
    startEdit,
    cancelEdit
  }
}
