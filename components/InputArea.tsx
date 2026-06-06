'use client'

import { useRef, useEffect } from 'react'
import type { Mode } from '@/lib/types'

const LABELS: Record<Mode, string> = {
  roast: 'Subject:',
  dictionary: 'Your Word:',
  proposal: 'The Problem:',
  correspondence: 'Your Letter:',
  aphorism: 'Your Theme:',
}

interface Props {
  mode: Mode
  disabled: boolean
  onSubmit: (text: string) => void
}

export default function InputArea({ mode, disabled, onSubmit }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!disabled) textareaRef.current?.focus()
  }, [disabled])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  function submit() {
    const val = textareaRef.current?.value.trim()
    if (!val || disabled) return
    onSubmit(val)
    if (textareaRef.current) textareaRef.current.value = ''
  }

  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--divider)',
        padding: '16px',
      }}
    >
      <label
        htmlFor="chat-input"
        style={{
          display: 'block',
          fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
          fontSize: '11px',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          color: 'var(--accent-gold)',
          marginBottom: '8px',
        }}
      >
        {LABELS[mode]}
      </label>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
        <textarea
          ref={textareaRef}
          id="chat-input"
          rows={2}
          disabled={disabled}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? '' : 'Type here…'}
          style={{
            flex: 1,
            background: 'var(--bg-primary)',
            border: 'none',
            outline: 'none',
            resize: 'none',
            fontFamily: 'var(--font-garamond), Georgia, serif',
            fontSize: '16px',
            color: 'var(--text-primary)',
            lineHeight: '1.6',
            padding: '8px 0',
            opacity: disabled ? 0.5 : 1,
          }}
        />
        <button
          onClick={submit}
          disabled={disabled}
          style={{
            background: disabled ? '#555' : 'var(--accent-gold)',
            color: '#111',
            border: 'none',
            borderRadius: 0,
            fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
            fontSize: '13px',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            padding: '0 20px',
            minHeight: '44px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            flexShrink: 0,
          }}
        >
          Submit
        </button>
      </div>
    </div>
  )
}
