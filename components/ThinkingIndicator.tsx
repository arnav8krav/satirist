'use client'

import { useState, useEffect } from 'react'
import { thinkingPhrases } from '@/lib/voiceCopy'
import type { Voice } from '@/lib/types'

interface Props {
  voice: Voice
}

export default function ThinkingIndicator({ voice }: Props) {
  const phrases = thinkingPhrases[voice]
  const [idx, setIdx] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    setIdx(0)
    setVisible(true)
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIdx((i) => (i + 1) % phrases.length)
        setVisible(true)
      }, 300)
    }, 1500)
    return () => clearInterval(interval)
  }, [voice, phrases.length])

  return (
    <div
      style={{
        fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
        fontSize: '14px',
        fontStyle: 'italic',
        color: 'rgba(196, 165, 90, 0.7)',
        margin: '20px 0',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.3s ease',
      }}
    >
      {phrases[idx]}
    </div>
  )
}
