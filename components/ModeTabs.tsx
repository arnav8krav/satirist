'use client'

import { useState, useRef, useEffect } from 'react'
import type { Mode } from '@/lib/types'

const MODES: { id: Mode; label: string; description: string }[] = [
  { id: 'roast', label: 'Roast', description: 'A satirical take on whatever you describe.' },
  { id: 'dictionary', label: "Devil's Dictionary", description: 'Submit a word. Receive a sardonic definition.' },
  { id: 'proposal', label: 'Modest Proposal', description: 'Describe a problem. Get an absurdist solution.' },
  { id: 'correspondence', label: 'Correspondence', description: 'Write a letter. The satirist writes back.' },
  { id: 'aphorism', label: 'Aphorism Engine', description: 'Name a theme. Receive original witticisms.' },
]

interface Props {
  active: Mode
  onChange: (m: Mode) => void
}

export default function ModeTabs({ active, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const activeMode = MODES.find((m) => m.id === active)!

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setOpen(false)
      triggerRef.current?.focus()
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const idx = MODES.findIndex((m) => m.id === active)
      onChange(MODES[(idx + 1) % MODES.length].id)
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      const idx = MODES.findIndex((m) => m.id === active)
      onChange(MODES[(idx - 1 + MODES.length) % MODES.length].id)
    }
  }

  return (
    <div
      ref={ref}
      style={{ position: 'relative', borderBottom: '1px solid var(--divider)', background: 'var(--bg-surface)' }}
    >
      {/* Trigger */}
      <button
        ref={triggerRef}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls="mode-listbox"
        onClick={() => setOpen((o) => !o)}
        onKeyDown={handleKeyDown}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          width: '100%',
          padding: '10px 16px',
          minHeight: '44px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span style={{
          fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
          fontSize: '12px',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          color: 'var(--accent-gold)',
        }}>
          {activeMode.label}
        </span>
        <span style={{
          fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
          fontSize: '12px',
          color: 'var(--text-muted)',
          flexGrow: 1,
        }}>
          {activeMode.description}
        </span>
        <span
          aria-hidden="true"
          style={{
            fontSize: '10px',
            color: 'var(--text-muted)',
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.15s ease',
            flexShrink: 0,
          }}
        >
          ▾
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <ul
          id="mode-listbox"
          role="listbox"
          aria-label="Satire mode"
          onKeyDown={handleKeyDown}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 50,
            background: 'var(--bg-surface)',
            borderTop: '1px solid var(--divider)',
            borderBottom: '1px solid var(--divider)',
            listStyle: 'none',
            margin: 0,
            padding: 0,
          }}
        >
          {MODES.map((m) => {
            const isActive = m.id === active
            return (
              <li
                key={m.id}
                role="option"
                aria-selected={isActive}
                tabIndex={0}
                onClick={() => { onChange(m.id); setOpen(false) }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onChange(m.id)
                    setOpen(false)
                    triggerRef.current?.focus()
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '10px',
                  padding: '10px 16px',
                  cursor: 'pointer',
                  borderLeft: isActive ? '2px solid var(--accent-gold)' : '2px solid transparent',
                  background: isActive ? 'rgba(196,165,90,0.06)' : 'transparent',
                }}
                onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)' }}
                onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                <span style={{
                  fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
                  fontSize: '12px',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  color: isActive ? 'var(--accent-gold)' : 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  minWidth: '130px',
                }}>
                  {m.label}
                </span>
                <span style={{
                  fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                }}>
                  {m.description}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
