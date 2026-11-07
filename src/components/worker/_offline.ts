import type { OfflineAppStatus, OfflineApplication } from './_types'
const OFFLINE_KEY = 'tl_offline_applications'

export function getOfflineApplications(): OfflineApplication[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(OFFLINE_KEY) || '[]') } catch { return [] }
}

export function saveOfflineApplication(app: OfflineApplication): void {
  if (typeof window === 'undefined') return
  const list = getOfflineApplications()
  const idx = list.findIndex((a) => a.clientId === app.clientId)
  if (idx >= 0) list[idx] = app
  else list.push(app)
  localStorage.setItem(OFFLINE_KEY, JSON.stringify(list))
}

export function removeOfflineApplication(clientId: string): void {
  if (typeof window === 'undefined') return
  const list = getOfflineApplications().filter((a) => a.clientId !== clientId)
  localStorage.setItem(OFFLINE_KEY, JSON.stringify(list))
}

// Export listOfflineApplications to match what's expected
export function listOfflineApplications(): OfflineApplication[] {
  return getOfflineApplications()
}