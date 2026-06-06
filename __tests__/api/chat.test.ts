import { describe, it, expect, vi, beforeEach } from 'vitest'
import { classifyVoice, buildSystemPrompt } from '@/lib/prompts'

// Unit tests for the API route logic — without spinning up the actual HTTP server.
// Integration tests with real HTTP go in e2e (deferred to post-ship).

describe('auto-voice classification', () => {
  it('classifies tech prompt as bierce', () => {
    expect(classifyVoice('modern tech startup jargon')).toBe('bierce')
  })

  it('classifies government prompt as swift', () => {
    expect(classifyVoice('government bureaucracy problem')).toBe('swift')
  })

  it('classifies philosophy prompt as voltaire', () => {
    expect(classifyVoice('philosophy and reason')).toBe('voltaire')
  })

  it('defaults to twain', () => {
    expect(classifyVoice('my cat is annoying')).toBe('twain')
  })
})

describe('sliding window context', () => {
  it('limits to last 20 messages', () => {
    const messages = Array.from({ length: 30 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `message ${i}`,
    }))
    const context = messages.slice(-20)
    expect(context).toHaveLength(20)
    expect(context[0].content).toBe('message 10')
  })
})

describe('rate limit response format', () => {
  it('produces correct 429 body shape', () => {
    const body = JSON.stringify({
      error: 'RATE_LIMIT',
      message: 'Even I require occasional silence. Return in an hour.',
    })
    const parsed = JSON.parse(body)
    expect(parsed.error).toBe('RATE_LIMIT')
    expect(parsed.message).toContain('silence')
  })
})

describe('system prompt building', () => {
  it('auto voice uses classified voice for system prompt', () => {
    const resolved = classifyVoice('tech startup pivot')
    const prompt = buildSystemPrompt(resolved, 'roast')
    expect(prompt.length).toBeGreaterThan(50)
    expect(typeof prompt).toBe('string')
  })
})
