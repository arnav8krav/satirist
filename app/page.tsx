'use client'

import { useState, useCallback, useRef } from 'react'
import VoiceTabs from '@/components/VoiceTabs'
import ModeTabs from '@/components/ModeTabs'
import ChatArea from '@/components/ChatArea'
import InputArea from '@/components/InputArea'
import { useVoiceHistory } from '@/hooks/useVoiceHistory'
import { clearAllHistory } from '@/lib/history'
import { openingLines } from '@/lib/voiceCopy'
import type { Voice, Mode, Message } from '@/lib/types'

type ModeDivider = { type: 'divider'; id: string; label: string }
type ChatItem = Message | ModeDivider

const MODE_NAMES: Record<Mode, string> = {
  roast: 'Roast',
  dictionary: "Devil's Dictionary",
  proposal: 'Modest Proposal',
  correspondence: 'Correspondence',
  aphorism: 'Aphorism Engine',
}

function buildOpeningMessage(voice: Voice, mode: Mode): Message {
  return {
    id: `opening-${voice}`,
    role: 'assistant',
    content: openingLines[voice],
    mode,
    timestamp: Date.now(),
  }
}

export default function Home() {
  const [voice, setVoice] = useState<Voice>('auto')
  const [mode, setMode] = useState<Mode>('roast')
  const [detectedVoice, setDetectedVoice] = useState<Exclude<Voice, 'auto'> | undefined>()
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [error, setError] = useState(false)
  const [dividers, setDividers] = useState<ModeDivider[]>([])
  const lastUserMessage = useRef<string>('')
  const lastModeRef = useRef<Mode>('roast')

  const { messages, addMessage, updateLastAssistant, setMessages, clearHistory } = useVoiceHistory(voice)

  const chatItems: ChatItem[] = (() => {
    const base: ChatItem[] = messages.length === 0 ? [buildOpeningMessage(voice, mode)] : [...messages]
    const withDividers: ChatItem[] = []
    const insertedDividerIds = new Set<string>()
    for (const item of base) {
      if (!('type' in item)) {
        const msg = item as Message
        const relevantDividers = dividers.filter(
          (d) => d.id.startsWith(`${voice}-`) && !insertedDividerIds.has(d.id)
            && d.id < `${voice}-${msg.timestamp}`
        )
        for (const d of relevantDividers) {
          withDividers.push(d)
          insertedDividerIds.add(d.id)
        }
      }
      withDividers.push(item)
    }
    // append any remaining dividers
    for (const d of dividers) {
      if (!insertedDividerIds.has(d.id) && d.id.startsWith(`${voice}-`)) {
        withDividers.push(d)
      }
    }
    return withDividers
  })()

  const handleVoiceChange = useCallback((v: Voice) => {
    setVoice(v)
    setError(false)
    setIsStreaming(false)
    setStreamingContent('')
  }, [])

  const handleModeChange = useCallback((m: Mode) => {
    if (m === lastModeRef.current) return
    lastModeRef.current = m
    setMode(m)
    setError(false)
    if (messages.length > 0) {
      const divider: ModeDivider = {
        type: 'divider',
        id: `${voice}-${Date.now()}`,
        label: `Switched to ${MODE_NAMES[m]}`,
      }
      setDividers((prev) => [...prev, divider])
    }
  }, [voice, messages.length])

  async function sendMessage(text: string) {
    lastUserMessage.current = text
    setError(false)
    setStreamingContent('')

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      mode,
      timestamp: Date.now(),
    }
    addMessage(userMsg)

    const assistantPlaceholder: Message = {
      id: `assistant-${Date.now() + 1}`,
      role: 'assistant',
      content: '',
      mode,
      timestamp: Date.now() + 1,
    }

    setIsStreaming(true)

    try {
      const contextMessages = messages
        .filter((m) => m.mode === mode)
        .slice(-20)
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))
      contextMessages.push({ role: 'user', content: text })

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: contextMessages, voice, mode }),
      })

      if (!res.ok) {
        setIsStreaming(false)
        setError(true)
        return
      }

      const detectedVoiceHeader = res.headers.get('X-Detected-Voice') as Exclude<Voice, 'auto'> | null
      if (detectedVoiceHeader && voice === 'auto') {
        setDetectedVoice(detectedVoiceHeader)
      }

      const reader = res.body?.getReader()
      if (!reader) throw new Error('No reader')

      const decoder = new TextDecoder()
      let accumulated = ''
      const resolvedVoice: Exclude<Voice, 'auto'> | undefined = detectedVoiceHeader ?? undefined

      addMessage(assistantPlaceholder)

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        setStreamingContent(accumulated)
      }

      setIsStreaming(false)
      setStreamingContent('')
      updateLastAssistant(accumulated, resolvedVoice)
    } catch {
      setIsStreaming(false)
      setStreamingContent('')
      setError(true)
    }
  }

  function handleRetry() {
    setError(false)
    if (lastUserMessage.current) sendMessage(lastUserMessage.current)
  }

  function handleReset() {
    clearHistory()
    setMessages([])
    clearAllHistory()
    setVoice('auto')
    setMode('roast')
    setDetectedVoice(undefined)
    setDividers([])
    setError(false)
    setIsStreaming(false)
    setStreamingContent('')
    lastModeRef.current = 'roast'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', maxWidth: '680px', margin: '0 auto', width: '100%', padding: '0 16px' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 0',
          borderBottom: '1px solid var(--divider)',
          flexShrink: 0,
        }}
      >
        <h1
          style={{
            fontFamily: 'var(--font-playfair), Georgia, serif',
            fontSize: '22px',
            letterSpacing: '0.08em',
            color: 'var(--text-primary)',
          }}
        >
          THE SATIRIST
        </h1>
        <button
          onClick={handleReset}
          style={{
            fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
            fontSize: '11px',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            background: 'none',
            border: '1px solid var(--divider)',
            padding: '6px 12px',
            minHeight: '44px',
            cursor: 'pointer',
          }}
        >
          Reset
        </button>
      </header>

      <div style={{ margin: '0 -16px', flexShrink: 0 }}>
        <VoiceTabs active={voice} detectedVoice={detectedVoice} onChange={handleVoiceChange} />
        <ModeTabs active={mode} onChange={handleModeChange} />
      </div>

      <ChatArea
        items={chatItems}
        isStreaming={isStreaming}
        streamingContent={streamingContent}
        error={error}
        voice={voice}
        mode={mode}
        onRetry={handleRetry}
      />

      <div style={{ margin: '0 -16px', flexShrink: 0 }}>
        <InputArea mode={mode} disabled={isStreaming} onSubmit={sendMessage} />
      </div>
    </div>
  )
}
