import { anthropic } from '@ai-sdk/anthropic'
import { streamText } from 'ai'
import { buildSystemPrompt, classifyVoice } from '@/lib/prompts'
import type { Voice, Mode } from '@/lib/types'

export const runtime = 'edge'

export async function POST(req: Request) {
  const { messages, voice, mode } = await req.json() as {
    messages: { role: 'user' | 'assistant'; content: string }[]
    voice: Voice
    mode: Mode
  }

  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
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
      return new Response(
        JSON.stringify({ error: 'RATE_LIMIT', message: 'Even I require occasional silence. Return in an hour.' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }

  const resolvedVoice: Exclude<Voice, 'auto'> =
    voice === 'auto'
      ? classifyVoice(messages[messages.length - 1]?.content ?? '')
      : (voice as Exclude<Voice, 'auto'>)

  const systemPrompt = buildSystemPrompt(resolvedVoice, mode)
  const context = messages.slice(-20)

  const result = streamText({
    model: anthropic('claude-sonnet-4-6'),
    system: systemPrompt,
    messages: context,
  })

  const headers: Record<string, string> = {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-cache',
    'X-Detected-Voice': resolvedVoice,
  }

  return result.toTextStreamResponse({ headers })
}
