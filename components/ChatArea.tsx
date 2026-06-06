'use client'

import { useEffect, useRef } from 'react'
import Message from './Message'
import ThinkingIndicator from './ThinkingIndicator'
import ErrorMessage from './ErrorMessage'
import type { Voice, Mode, Message as Msg } from '@/lib/types'

interface ModeDivider {
  type: 'divider'
  id: string
  label: string
}

type ChatItem = Msg | ModeDivider

interface Props {
  items: ChatItem[]
  isStreaming: boolean
  streamingContent: string
  error: boolean
  voice: Voice
  mode: Mode
  onRetry: () => void
}

export default function ChatArea({ items, isStreaming, streamingContent, error, voice, mode, onRetry }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [items, streamingContent, isStreaming])

  return (
    <div
      role="log"
      aria-live="polite"
      aria-label="Conversation"
      style={{ flex: 1, overflowY: 'auto', padding: '24px 0' }}
    >
      {items.map((item) => {
        if ('type' in item && item.type === 'divider') {
          return (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                margin: '24px 0',
              }}
            >
              <div style={{ flex: 1, height: '1px', background: 'var(--divider)' }} />
              <span
                style={{
                  fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
                  fontSize: '11px',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                }}
              >
                {item.label}
              </span>
              <div style={{ flex: 1, height: '1px', background: 'var(--divider)' }} />
            </div>
          )
        }
        const msg = item as Msg
        return (
          <Message
            key={msg.id}
            role={msg.role}
            content={msg.content}
            voice={msg.voice}
            mode={msg.mode}
          />
        )
      })}

      {isStreaming && !streamingContent && <ThinkingIndicator voice={voice} />}

      {isStreaming && streamingContent && (
        <div>
          <div style={{ borderTop: '1px solid var(--divider)', margin: '4px 0 16px' }} />
          <div
            style={{
              fontFamily: 'var(--font-garamond), Georgia, serif',
              fontSize: 'clamp(16px, 2vw, 18px)',
              lineHeight: '1.8',
              color: 'var(--text-primary)',
              whiteSpace: 'pre-wrap',
            }}
          >
            {streamingContent}
            <span aria-hidden="true" style={{ opacity: 0.6 }}>▌</span>
          </div>
        </div>
      )}

      {error && <ErrorMessage voice={voice} onRetry={onRetry} />}
      <div ref={bottomRef} />
    </div>
  )
}
