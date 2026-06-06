import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getHistory, saveHistory, clearAllHistory } from '@/lib/history'
import type { Message } from '@/lib/types'

function makeMsg(id: string): Message {
  return { id, role: 'user', content: 'test', mode: 'roast', timestamp: Date.now() }
}

describe('history', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('returns empty array when no history', () => {
    expect(getHistory('twain')).toEqual([])
  })

  it('saves and retrieves messages', () => {
    const msgs = [makeMsg('1'), makeMsg('2')]
    saveHistory('twain', msgs)
    expect(getHistory('twain')).toEqual(msgs)
  })

  it('returns empty array on corrupt JSON', () => {
    localStorage.setItem('satirist-history-twain', 'INVALID_JSON{{{')
    expect(getHistory('twain')).toEqual([])
  })

  it('trims to 100 messages on save', () => {
    const msgs = Array.from({ length: 110 }, (_, i) => makeMsg(String(i)))
    saveHistory('twain', msgs)
    const saved = getHistory('twain')
    expect(saved).toHaveLength(100)
    expect(saved[0].id).toBe('10')
  })

  it('aggressively trims to 50 on QuotaExceededError', () => {
    const msgs = Array.from({ length: 60 }, (_, i) => makeMsg(String(i)))
    let callCount = 0
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        const err = new DOMException('QuotaExceededError')
        Object.defineProperty(err, 'name', { value: 'QuotaExceededError' })
        throw err
      }
    })
    saveHistory('twain', msgs)
    expect(callCount).toBe(2)
  })

  it('clearAllHistory removes all voice keys', () => {
    saveHistory('twain', [makeMsg('1')])
    saveHistory('bierce', [makeMsg('2')])
    clearAllHistory()
    expect(getHistory('twain')).toEqual([])
    expect(getHistory('bierce')).toEqual([])
  })

  it('keeps voices independent', () => {
    saveHistory('twain', [makeMsg('a')])
    saveHistory('bierce', [makeMsg('b')])
    expect(getHistory('twain')[0].id).toBe('a')
    expect(getHistory('bierce')[0].id).toBe('b')
  })
})
