export type Voice = 'auto' | 'twain' | 'bierce' | 'swift' | 'voltaire'

export type Mode = 'roast' | 'dictionary' | 'proposal' | 'correspondence' | 'aphorism'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  voice?: Voice
  mode: Mode
  timestamp: number
}
