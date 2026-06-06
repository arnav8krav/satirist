import ReactMarkdown from 'react-markdown'
import type { Voice, Mode } from '@/lib/types'

interface Props {
  role: 'user' | 'assistant'
  content: string
  voice?: Voice
  mode?: Mode
}

export default function Message({ role, content, voice }: Props) {
  if (role === 'user') {
    return (
      <div
        style={{
          fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
          fontSize: '15px',
          fontStyle: 'italic',
          color: 'var(--text-muted)',
          borderLeft: '2px solid var(--accent-gold)',
          paddingLeft: '16px',
          margin: '20px 0',
        }}
      >
        {content}
      </div>
    )
  }

  return (
    <div>
      <div style={{ borderTop: '1px solid var(--divider)', margin: '4px 0 16px' }} />
      <div
        style={{
          fontFamily: 'var(--font-garamond), Georgia, serif',
          fontSize: 'clamp(16px, 2vw, 18px)',
          lineHeight: '1.8',
          color: 'var(--text-primary)',
        }}
      >
        <ReactMarkdown
          components={{
            p: ({ children }) => <p style={{ margin: '0 0 0.6em' }}>{children}</p>,
            strong: ({ children }) => <strong style={{ fontWeight: 700 }}>{children}</strong>,
            em: ({ children }) => <em>{children}</em>,
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
      {voice && voice !== 'auto' && (
        <div
          style={{
            fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
            fontSize: '11px',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            marginTop: '8px',
          }}
        >
          — {voice.charAt(0).toUpperCase() + voice.slice(1)}
        </div>
      )}
    </div>
  )
}
