import type { Voice, Message } from './types'

const KEY = (voice: Voice) => `satirist-history-${voice}`
const MAX_MESSAGES = 100
const TRIM_TO = 50

export function getHistory(voice: Voice): Message[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(KEY(voice))
    if (!raw) return []
    return JSON.parse(raw) as Message[]
  } catch {
    return []
  }
}

export function saveHistory(voice: Voice, messages: Message[]): void {
  if (typeof window === 'undefined') return
  const trimmed = messages.length > MAX_MESSAGES ? messages.slice(-MAX_MESSAGES) : messages
  try {
    localStorage.setItem(KEY(voice), JSON.stringify(trimmed))
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      try {
        localStorage.setItem(KEY(voice), JSON.stringify(messages.slice(-TRIM_TO)))
      } catch {
        // storage unavailable
      }
    }
  }
}

export function clearAllHistory(): void {
  if (typeof window === 'undefined') return
  const voices: Voice[] = ['auto', 'twain', 'bierce', 'swift', 'voltaire']
  voices.forEach((v) => localStorage.removeItem(KEY(v)))
}
