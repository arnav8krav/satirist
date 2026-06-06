import { anthropic } from '@ai-sdk/anthropic'
import { streamText } from 'ai'
import { buildSystemPrompt, classifyVoice } from '@/lib/prompts'
import type { Voice, Mode } from '@/lib/types'

export async function POST(req: Request) {
  console.log('[chat] POST received')

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('[chat] ANTHROPIC_API_KEY is not set')
    return new Response(JSON.stringify({ error: 'MISSING_API_KEY' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let body: { messages: { role: 'user' | 'assistant'; content: string }[]; voice: Voice; mode: Mode }
  try {
    body = await req.json()
  } catch (e) {
    console.error('[chat] Failed to parse request body:', e)
    return new Response(JSON.stringify({ error: 'BAD_REQUEST' }), { status: 400 })
  }

  const { messages, voice, mode } = body
  const VALID_VOICES = ['auto', 'twain', 'bierce', 'swift', 'voltaire']
  const VALID_MODES = ['roast', 'dictionary', 'proposal', 'correspondence', 'aphorism']
  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response(JSON.stringify({ error: 'INVALID_PARAMS', message: 'messages must be a non-empty array' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }
  if (!VALID_VOICES.includes(voice)) {
    return new Response(JSON.stringify({ error: 'INVALID_PARAMS', message: 'invalid voice' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }
  if (!VALID_MODES.includes(mode)) {
    return new Response(JSON.stringify({ error: 'INVALID_PARAMS', message: 'invalid mode' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }
  console.log('[chat] voice=%s mode=%s messages=%d', voice, mode, messages.length)

  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      const { Ratelimit } = await import('@upstash/ratelimit')
      const { Redis } = await import('@upstash/redis')
      const ratelimit = new Ratelimit({
        redis: new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL,
          token: process.env.UPSTASH_REDIS_REST_TOKEN,
        }),
        limiter: Ratelimit.slidingWindow(20, '1 h'),
      })
      const ip = req.headers.get('x-forwarded-for') ?? '127.0.0.1'
      const { success } = await ratelimit.limit(ip)
      if (!success) {
        console.warn('[chat] Rate limit exceeded for ip=%s', ip)
        return new Response(
          JSON.stringify({ error: 'RATE_LIMIT', message: 'Even I require occasional silence. Return in an hour.' }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        )
      }
    } catch (e) {
      console.error('[chat] Rate limiter error (continuing without limit):', e)
    }
  }

  const resolvedVoice: Exclude<Voice, 'auto'> =
    voice === 'auto'
      ? classifyVoice(messages[messages.length - 1]?.content ?? '')
      : (voice as Exclude<Voice, 'auto'>)

  console.log('[chat] resolved voice=%s', resolvedVoice)

  const systemPrompt = buildSystemPrompt(resolvedVoice, mode)
  const context = messages.slice(-20)

  try {
    const result = streamText({
      model: anthropic('claude-sonnet-4-6'),
      system: systemPrompt,
      messages: context,
      onError: (e) => console.error('[chat] streamText error:', e),
    })

    console.log('[chat] streaming response started')
    return result.toTextStreamResponse({
      headers: {
        'Cache-Control': 'no-cache',
        'X-Detected-Voice': resolvedVoice,
      },
    })
  } catch (e) {
    console.error('[chat] streamText threw synchronously:', e)
    return new Response(JSON.stringify({ error: 'STREAM_ERROR' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
