import { errorMessages } from '@/lib/voiceCopy'
import type { Voice } from '@/lib/types'

interface Props {
  voice: Voice
  onRetry: () => void
}

export default function ErrorMessage({ voice, onRetry }: Props) {
  return (
    <div style={{ margin: '20px 0' }}>
      <div style={{ borderTop: '1px solid var(--divider)', margin: '4px 0 16px' }} />
      <div
        style={{
          fontFamily: 'var(--font-garamond), Georgia, serif',
          fontSize: 'clamp(16px, 2vw, 18px)',
          lineHeight: '1.8',
          color: 'var(--error-text)',
        }}
      >
        {errorMessages[voice]}
      </div>
      <button
        onClick={onRetry}
        style={{
          marginTop: '8px',
          fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
          fontSize: '13px',
          color: 'var(--text-muted)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textDecoration: 'underline',
          padding: '8px 0',
          minHeight: '44px',
        }}
      >
        [Retry]
      </button>
    </div>
  )
}
