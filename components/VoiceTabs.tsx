'use client'

import type { Voice } from '@/lib/types'

const VOICES: { id: Voice; label: string }[] = [
  { id: 'auto', label: 'Auto' },
  { id: 'twain', label: 'Twain' },
  { id: 'bierce', label: 'Bierce' },
  { id: 'swift', label: 'Swift' },
  { id: 'voltaire', label: 'Voltaire' },
]

interface Props {
  active: Voice
  detectedVoice?: Exclude<Voice, 'auto'>
  onChange: (v: Voice) => void
}

export default function VoiceTabs({ active, detectedVoice, onChange }: Props) {
  function handleKeyDown(e: React.KeyboardEvent, idx: number) {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      const next = (idx + 1) % VOICES.length
      onChange(VOICES[next].id)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      const prev = (idx - 1 + VOICES.length) % VOICES.length
      onChange(VOICES[prev].id)
    }
  }

  return (
    <div
      role="tablist"
      aria-label="Satirist voice"
      className="tabs-scroll flex overflow-x-auto scroll-snap-x-mandatory"
      style={{ borderBottom: '1px solid var(--divider)', background: 'var(--bg-surface)' }}
    >
      {VOICES.map((v, i) => {
        const isActive = active === v.id
        const hasDot = v.id !== 'auto' && active === 'auto' && detectedVoice === v.id
        return (
          <button
            key={v.id}
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onKeyDown={(e) => handleKeyDown(e, i)}
            onClick={() => onChange(v.id)}
            style={{
              fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
              fontSize: '13px',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              padding: '12px 16px',
              minHeight: '44px',
              border: 'none',
              borderBottom: isActive ? '2px solid var(--accent-gold)' : '2px solid transparent',
              background: 'transparent',
              color: isActive ? 'var(--text-primary)' : '#888',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              scrollSnapAlign: 'start',
              flexShrink: 0,
            }}
          >
            {v.label}
            {hasDot && <span aria-label="auto-selected" style={{ marginLeft: '4px', color: 'var(--accent-gold)' }}>·</span>}
          </button>
        )
      })}
    </div>
  )
}
