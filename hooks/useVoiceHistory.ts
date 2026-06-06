'use client'

import { useState, useEffect, useCallback } from 'react'
import { getHistory, saveHistory } from '@/lib/history'
import type { Voice, Message } from '@/lib/types'

export function useVoiceHistory(voice: Voice) {
  const [messages, setMessages] = useState<Message[]>([])

  useEffect(() => {
    setMessages(getHistory(voice))
  }, [voice])

  const addMessage = useCallback(
    (msg: Message) => {
      setMessages((prev) => {
        const next = [...prev, msg]
        saveHistory(voice, next)
        return next
      })
    },
    [voice]
  )

  const updateLastAssistant = useCallback(
    (content: string, detectedVoice?: Voice) => {
      setMessages((prev) => {
        const next = [...prev]
        const last = next[next.length - 1]
        if (last && last.role === 'assistant') {
          next[next.length - 1] = { ...last, content, ...(detectedVoice ? { voice: detectedVoice } : {}) }
        }
        saveHistory(voice, next)
        return next
      })
    },
    [voice]
  )

  const clearHistory = useCallback(() => {
    setMessages([])
  }, [])

  return { messages, setMessages, addMessage, updateLastAssistant, clearHistory }
}
