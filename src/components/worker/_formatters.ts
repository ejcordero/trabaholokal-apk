import { COMPENSATION_TYPES } from './_constants'

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(amount || 0)
}

export function formatCompensation(amount: number, type: string): string {
  const typeLabel = COMPENSATION_TYPES.find((c) => c.value === type)?.label ?? type
  return `${formatCurrency(amount)} · ${typeLabel}`
}

export function formatDate(d?: string | Date | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function formatDateTime(d?: string | Date | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-PH', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export function relativeTime(d?: string | Date | null): string {
  if (!d) return ''
  const diff = Date.now() - new Date(d).getTime()
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return 'just now'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.floor(hr / 24)
  if (day < 30) return `${day}d ago`
  return formatDate(d)
}

export function daysBetween(start?: string | Date | null, end?: string | Date | null): number {
  if (!start) return 0
  const s = new Date(start).getTime()
  const e = end ? new Date(end).getTime() : Date.now()
  return Math.max(0, Math.round((e - s) / (1000 * 60 * 60 * 24)))
}

export function formatRange(start?: string | null, end?: string | null): string {
  if (!start && !end) return '—'
  return `${formatDate(start)}${end ? ' → ' + formatDate(end) : ''}`
}

export function labelFor(value: string, list: readonly { value: string; label: string }[]): string {
  return list.find((i) => i.value === value)?.label ?? value
}

export function initials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?'
}