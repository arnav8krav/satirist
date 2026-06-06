import { describe, it, expect } from 'vitest'
import { buildSystemPrompt, classifyVoice } from '@/lib/prompts'
import type { Voice, Mode } from '@/lib/types'

const VOICES: Exclude<Voice, 'auto'>[] = ['twain', 'bierce', 'swift', 'voltaire']
const MODES: Mode[] = ['roast', 'dictionary', 'proposal', 'correspondence', 'aphorism']

describe('buildSystemPrompt', () => {
  it('returns non-empty string for all 20 combinations', () => {
    for (const v of VOICES) {
      for (const m of MODES) {
        const prompt = buildSystemPrompt(v, m)
        expect(prompt.length).toBeGreaterThan(0)
      }
    }
  })

  it('includes base rules in every prompt', () => {
    for (const v of VOICES) {
      for (const m of MODES) {
        const prompt = buildSystemPrompt(v, m)
        expect(prompt).toContain('satirist')
      }
    }
  })

  it('includes voice persona', () => {
    expect(buildSystemPrompt('twain', 'roast')).toContain('Twain')
    expect(buildSystemPrompt('bierce', 'roast')).toContain('Bierce')
    expect(buildSystemPrompt('swift', 'roast')).toContain('Swift')
    expect(buildSystemPrompt('voltaire', 'roast')).toContain('Voltaire')
  })

  it('includes mode instructions', () => {
    expect(buildSystemPrompt('twain', 'dictionary')).toContain('definition')
    expect(buildSystemPrompt('twain', 'proposal')).toContain('solution')
    expect(buildSystemPrompt('twain', 'correspondence')).toContain('letter')
    expect(buildSystemPrompt('twain', 'aphorism')).toContain('aphorism')
  })
})

describe('classifyVoice', () => {
  it('defaults to twain for generic prompts', () => {
    expect(classifyVoice('hello world')).toBe('twain')
  })

  it('picks bierce for tech/jargon prompts', () => {
    expect(classifyVoice('modern tech jargon')).toBe('bierce')
    expect(classifyVoice('jargon everywhere')).toBe('bierce')
  })

  it('picks swift for government prompts', () => {
    expect(classifyVoice('government policy reform')).toBe('swift')
  })

  it('picks voltaire for philosophy prompts', () => {
    expect(classifyVoice('philosophy of existence')).toBe('voltaire')
  })
})
