'use client'

import type { Mode } from '@/lib/types'

const MODES: { id: Mode; label: string }[] = [
  { id: 'roast', label: 'Roast' },
  { id: 'dictionary', label: 'Dictionary' },
  { id: 'proposal', label: 'Proposal' },
  { id: 'correspondence', label: 'Correspondence' },
  { id: 'aphorism', label: 'Aphorism' },
]

interface Props {
  active: Mode
  onChange: (m: Mode) => void
}

export default function ModeTabs({ active, onChange }: Props) {
  function handleKeyDown(e: React.KeyboardEvent, idx: number) {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      onChange(MODES[(idx + 1) % MODES.length].id)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      onChange(MODES[(idx - 1 + MODES.length) % MODES.length].id)
    }
  }

  return (
    <div
      role="tablist"
      aria-label="Satire mode"
      className="tabs-scroll flex overflow-x-auto"
      style={{ borderBottom: '1px solid var(--divider)', background: 'var(--bg-surface)' }}
    >
      {MODES.map((m, i) => {
        const isActive = active === m.id
        return (
          <button
            key={m.id}
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onKeyDown={(e) => handleKeyDown(e, i)}
            onClick={() => onChange(m.id)}
            style={{
              fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
              fontSize: '12px',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              padding: '10px 14px',
              minHeight: '44px',
              border: 'none',
              borderBottom: isActive ? '2px solid var(--accent-gold)' : '2px solid transparent',
              background: 'transparent',
              color: isActive ? 'var(--text-primary)' : '#888',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {m.label}
          </button>
        )
      })}
    </div>
  )
}
