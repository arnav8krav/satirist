import type { Voice } from './types'

export const thinkingPhrases: Record<Voice, string[]> = {
  auto: [
    'Selecting the appropriate instrument of wit...',
    'Consulting the taxonomy of human absurdity...',
    'Assigning blame...',
  ],
  twain: [
    'Gathering sufficient human folly...',
    'Consulting my riverboat experiences...',
    'Recalling what a senator once told me...',
  ],
  bierce: [
    'Consulting the dictionary of human stupidity...',
    'Categorizing the applicable failures...',
    'Indexing the relevant absurdities...',
  ],
  swift: [
    'Drafting the appropriate memorandum...',
    'Convening an advisory committee...',
    'Calculating the modest proposal...',
  ],
  voltaire: [
    'Questioning all assumptions...',
    'Applying reason to the unreasonable...',
    'Determining what is worst in all possible worlds...',
  ],
}

export const openingLines: Record<Voice, string> = {
  auto: 'State your predicament. My selection of the appropriate voice of condemnation shall follow.',
  twain: "Well, speak your mind. I've heard worse from senators, and they got paid for it.",
  bierce: 'Submit your word or grievance. I have definitions enough for all human folly.',
  swift: 'Describe the problem. A modest solution shall be provided at no additional charge to your dignity.',
  voltaire: 'What troubles you? All is for the worst in this worst of all possible worlds — but let us examine it.',
}

export const errorMessages: Record<Voice, string> = {
  auto: 'The machinery of wit has seized. Try again.',
  twain: 'I appear to have gone temporarily mute. The irony is not lost on me.',
  bierce: 'ERROR, n. The condition of the server which mirrors the condition of the republic.',
  swift: 'A most immodest technical failure has occurred. The engineers shall be held accountable.',
  voltaire: 'I am silent. Draw what conclusions you will about the state of cloud infrastructure.',
}
