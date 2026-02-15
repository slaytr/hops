import { ref, watch } from 'vue'

export type RoomSortBy = 'roomNumber' | 'roomType'

interface OpsHubSettings {
  roomSortBy: RoomSortBy
}

const STORAGE_KEY = 'opsHubSettings'

const defaults: OpsHubSettings = {
  roomSortBy: 'roomNumber'
}

function load(): OpsHubSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      return { ...defaults, ...JSON.parse(raw) }
    }
  } catch {
    // ignore
  }
  return { ...defaults }
}

function save(settings: OpsHubSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

const roomSortBy = ref<RoomSortBy>(load().roomSortBy)

watch(roomSortBy, () => {
  save({ roomSortBy: roomSortBy.value })
})

export function useOpsHubSettings() {
  return {
    roomSortBy
  }
}
