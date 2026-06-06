# The Satirist — Product Plan

## Overview

A satire chatbot where users type any prompt and receive a witty, biting response in the style of a classic satirist. Persona lives entirely in the system prompt.

## Core Voices

| Voice | Style | Auto-selected for |
|-------|-------|-------------------|
| Mark Twain | Folksy irony, storytelling naivety | Everyday human foibles |
| Ambrose Bierce | Sardonic definitions, cynical taxonomy | Tech/jargon topics |
| Jonathan Swift | Deadpan policy logic, mock-earnestness | Bureaucracy/government |
| Voltaire | Socratic reason-as-weapon, philosophical skewering | Philosophy/institutions |

## Interaction Modes

1. **Roast** — Bot delivers an unprompted satirical take on whatever the user describes
2. **Devil's Dictionary** — User submits a word; bot returns a Bierce-style sardonic definition
3. **Modest Proposal** — User describes a problem; bot returns an absurdist solution in Swift's deadpan memo style
4. **Correspondence** — Roleplay: bot responds as the satirist receiving a letter from the user's era
5. **Aphorism Engine** — User names a theme; bot generates original witticisms in the chosen voice

## Design Decisions (resolved)

- Bot stays in character throughout a session; breaks character only on direct meta-questions
- Sharpness: full Swift — no softening for political or social targets
- Single voice per session; user picks at start and can reset
- No onboarding — throw users straight into the wit

## Stack

- **Next.js** (App Router) — frontend + API routes
- **Vercel AI SDK** (`ai` + `@ai-sdk/anthropic`) — streaming, chat state, message history [Layer 1]
- **Anthropic API** (Claude) — language model backend
- **localStorage** — per-voice conversation persistence (v1)

### Key SDK decisions
- `streamText()` on the backend API route — handles Anthropic streaming natively
- `useChat()` on the frontend with `id` prop per voice — namespaces per-voice threads automatically
- `createDataStreamResponse()` for Auto-voice: backend sends `{voice: 'swift'}` as a data packet before text tokens; frontend reads via `data` from `useChat()` and updates the tab indicator immediately

## Final File Structure

```
app/
  layout.tsx          — font imports (next/font/google), global CSS, metadata
  page.tsx            — main chat page, composes all components
  globals.css         — CSS variables, dark editorial design tokens
  api/
    chat/
      route.ts        — POST handler: rate limit → classify → streamText() → data stream

components/
  Layout.tsx          — sticky header + voice tabs + mode tabs + chat + input
  VoiceTabs.tsx       — 5 tabs with ARIA, keyboard nav, auto-dot indicator
  ModeTabs.tsx        — 5 mode tabs with ARIA, keyboard nav
  ChatArea.tsx        — scrollable message list + ThinkingIndicator
  Message.tsx         — single component, role prop branches styles (no BotMessage/UserMessage split)
  ThinkingIndicator.tsx — rotating phrases, fade, disappear on first token
  InputArea.tsx       — textarea + mode-specific label + submit button
  ErrorMessage.tsx    — in-character error + Retry link

lib/
  prompts.ts          — buildSystemPrompt(voice, mode): string — all 20 combinations
  voiceCopy.ts        — { thinkingPhrases, openingLines, errorMessages } — all voice UI copy
  history.ts          — localStorage CRUD: getHistory, saveHistory (100-msg cap), clearAllHistory
  types.ts            — Voice, Mode, Message type definitions

hooks/
  useVoiceHistory.ts  — reads/writes per-voice localStorage on voice/message changes

__tests__/
  lib/history.test.ts — unit tests: all localStorage paths
  lib/prompts.test.ts — unit tests: all 20 combinations compile
  api/chat.test.ts    — unit tests: rate limit, 429 path, auto-voice data packet
```

## Architecture (Section 1)

### Data flow
```
Browser                        Next.js API Route             Anthropic API
  │                                  │                             │
  │── POST /api/chat ────────────────▶│                             │
  │   {messages[-20:], voice, mode}  │── buildSystemPrompt() ──────▶│
  │                                  │   + sliding window context   │
  │                                  │                             │
  │   ◀── data: {voice:'swift'} ─────│◀─ stream start ─────────────│
  │   ◀── text tokens ───────────────│◀─ token chunks ─────────────│
  │   [tab indicator + attribution]  │                             │
```

### System prompt architecture
Composable template — `buildSystemPrompt(voice: Voice, mode: Mode): string`
```
BASE_RULES          — sharpness level, character break policy, response style
+ VOICE_PERSONA[v]  — Twain / Bierce / Swift / Voltaire persona block
+ MODE_INSTRUCTIONS[m] — Roast / Dictionary / Proposal / Correspondence / Aphorism format
```
File: `lib/prompts.ts` — single source of truth for all satirist behavior.

### Auto-voice behavior
- Re-selects the best voice on EVERY turn (not locked to first pick)
- Backend receives `voice: 'auto'`; classifies the user's prompt; picks the best voice; sends `{voice: 'X'}` as the first data packet before streaming
- Frontend updates the tab indicator (`Twain ·`) for that response, then re-evaluates on the next message
- Auto tab remains selected throughout; voice tabs show a `·` attribution dot for the last auto-selected voice

### Auto thread message schema
```typescript
type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  voice?: Voice;      // populated for assistant messages in the Auto thread only
  mode: Mode;
  timestamp: number;
}
```
Auto thread history displays a `— Twain` byline below each bot response (newspaper attribution style). Non-auto threads have no byline (voice is fixed).

### Context window
Last 20 messages (10 exchanges) sent per API call — sliding window, regardless of total thread length. Bounded cost. Implemented in the API route before calling `streamText()`.

### Rate limiting
IP-based, 20 requests/IP/hour via `@upstash/ratelimit` + `@upstash/redis`. Added to `app/api/chat/route.ts` as the first check before any Anthropic API call. Returns HTTP 429 with an in-character error message body:
```json
{"error": "RATE_LIMIT", "message": "Even I require occasional silence. Return in an hour."}
```
Frontend detects 429 and renders the voice's in-character error + Retry button.

### Prompt caching
System prompt marked with `cache_control: { type: 'ephemeral' }` via `@ai-sdk/anthropic` provider options. Warms on first turn; subsequent turns within the same session pay ~10% of system prompt input tokens. Reduces per-turn cost by 30-50% for engaged users.

### Font loading
Three typefaces loaded via `next/font/google` (self-hosted at build time). No external CDN requests. No FOUT (flash of unstyled text). Zero config beyond the import swap.

### Code quality decisions (Section 2)
- **`lib/voiceCopy.ts`** replaces `thinkingPhrases.ts` + `openingLines.ts` + `errorCopy.ts`. Exports `{ thinkingPhrases, openingLines, errorMessages }`.
- **`Message.tsx`** replaces `BotMessage.tsx` + `UserMessage.tsx`. Single component, role prop branches styles. Accepts `voice?: Voice` for Auto thread attribution.
- **localStorage 100-message cap**: `saveHistory()` trims to the last 100 messages on every write. If `QuotaExceededError` is thrown, aggressively trims to last 50 and retries once.

### Testing (Section 3)
Vitest for unit tests. Three files ship with v1:
- `__tests__/lib/history.test.ts` — all localStorage paths (happy, corrupt JSON, quota exceeded, SSR unavailable, 100-msg trim)
- `__tests__/lib/prompts.test.ts` — all 20 combinations return non-empty strings; shared rules present
- `__tests__/api/chat.test.ts` — rate limit 429 path, auto-voice data packet, sliding window

E2E (Playwright) and LLM evals deferred post-ship.

### Deployment
Deploy to Vercel. Required environment variables:
```
ANTHROPIC_API_KEY=sk-ant-...
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```
Add `.env.example` with placeholder values. No `vercel.json` needed — Next.js App Router deploys with zero config on Vercel.

## NOT in scope (deferred)
- Database-backed history and user auth → v2 if retention data warrants it
- Shareable conversation links → v2
- Social sharing / copy-to-clipboard → v2
- Dark/light mode toggle → dark-only in v1

## What already exists
Greenfield build — no existing patterns to align with. Design system created from scratch in this plan.

## UI Layout (Pass 1 — Information Architecture)

```
+-----------------------------------------------------+
|  THE SATIRIST                                       |  ← Wordmark, top-left
|-----------------------------------------------------|
| [Auto][Twain][Bierce][Swift][Voltaire]  [RESET]     |  ← Voice tabs (primary)
|   (default: Auto tab selected; selected voice       |
|    highlights after first response)                 |
|-----------------------------------------------------|
| [Roast][Dictionary][Proposal][Correspondence][Aph.] |  ← Mode tabs (secondary)
|-----------------------------------------------------|
|                                                     |
|           ← chat messages, scrollable →             |
|           max-width 680px, centered                 |
|                                                     |
|-----------------------------------------------------|
| [Type your prompt here...] [SUBMIT]                 |  ← Sticky bottom input
+-----------------------------------------------------+
```

**IA hierarchy:**
1. Voice tabs — most prominent; who the user is talking to
2. Mode tabs — secondary; what kind of satire they'll get
3. Chat conversation — main content area
4. Input — sticky, always accessible

**Voice selector behavior:**
- 5 tab items: `[Auto] [Twain] [Bierce] [Swift] [Voltaire]`
- `Auto` is selected by default on page load
- After first response, the auto-detected voice tab gets a subtle indicator (e.g., small dot or italic label) showing which voice was chosen
- User can override at any time by clicking any voice tab
- RESET button clears chat history and returns to Auto

**Layout:**
- Single page, no navigation, no sidebar
- Chat column: 680px max-width, horizontally centered
- Input: sticky bottom, full column width
- No history panel (sessions are ephemeral)

## Interaction States (Pass 2)

### Streaming
- All responses streamed token-by-token via Anthropic API streaming
- Text appears immediately as it arrives; no full-response wait
- Streaming cursor visible during generation

### Empty State (before first message)
- Bot opens with an in-character provocation on load, one per voice:
  - **Auto:** "State your predicament. My selection of the appropriate voice of condemnation shall follow."
  - **Twain:** "Well, speak your mind. I've heard worse from senators, and they got paid for it."
  - **Bierce:** "Submit your word or grievance. I have definitions enough for all human folly."
  - **Swift:** "Describe the problem. A modest solution shall be provided at no additional charge to your dignity."
  - **Voltaire:** "What troubles you? All is for the worst in this worst of all possible worlds — but let us examine it."
- Opening provocation is styled identically to bot responses (not a system message)
- Auto mode's provocation disappears (or is replaced) when the actual voice is selected/detected

### Loading State (in-character thinking phrases)
While the API processes (before the first streaming token arrives), the bot position shows rotating in-character "thinking" phrases, cycling every ~1.5 seconds with a fade transition. These appear in the response position (same location the streamed text will fill) and disappear as soon as the first token arrives.

Phrases per voice:
- **Auto:** "Selecting the appropriate instrument of wit..." → "Consulting the taxonomy of human absurdity..." → "Assigning blame..."
- **Twain:** "Gathering sufficient human folly..." → "Consulting my riverboat experiences..." → "Recalling what a senator once told me..."
- **Bierce:** "Consulting the dictionary of human stupidity..." → "Categorizing the applicable failures..." → "Indexing the relevant absurdities..."
- **Swift:** "Drafting the appropriate memorandum..." → "Convening an advisory committee..." → "Calculating the modest proposal..."
- **Voltaire:** "Questioning all assumptions..." → "Applying reason to the unreasonable..." → "Determining what is worst in all possible worlds..."

Styling: DM Sans italic 14px, muted gold (#c4a55a at 70% opacity), same document position as responses. Input is disabled during this phase; submit button becomes inactive; re-enables on completion.

### Error State
- In-character error message appears as a bot bubble, per voice:
  - **Twain:** "I appear to have gone temporarily mute. The irony is not lost on me."
  - **Bierce:** "ERROR, n. The condition of the server which mirrors the condition of the republic."
  - **Swift:** "A most immodest technical failure has occurred. The engineers shall be held accountable."
  - **Voltaire:** "I am silent. Draw what conclusions you will about the state of cloud infrastructure."
- Each error bubble has a `[Retry]` button in plain text below the in-character message
- Retry re-sends the last user message
- Rate limit errors get the same in-character treatment, not a separate UI

### Character Break State
- When user asks a direct meta-question (e.g., "Are you an AI?"), bot breaks character briefly
- No special UI treatment — plain response styled identically to in-character responses
- System prompt handles the break logic, not the UI

### History Persistence
- **v1: localStorage** — messages saved to `localStorage` on the user's device; survive page refresh
- No auth, no database required in v1
- API context: when sending a request, filter `localStorage` history to only include messages from the current active mode (not the full cross-mode log); this prevents mode-contamination of API context
- v2 path: database + auth for cross-device sync; localStorage history can be migrated

### Mode Switching
- Switching modes does NOT clear the visual chat history
- A visual divider ("— Switched to [Mode Name] —") is inserted into the chat at the switch point
- API call after a mode switch uses only messages from the new mode as context (clean slate for the API, not the display)
- Mode tabs: Roast is the default selected mode on page load

### Per-Voice Chat Threads
Each voice has its own independent conversation thread:
- localStorage keys: `satirist-history-auto`, `satirist-history-twain`, `satirist-history-bierce`, `satirist-history-swift`, `satirist-history-voltaire`
- Switching voice switches the visible thread — Twain's conversation disappears, Bierce's thread loads
- API context: each request sends only the current voice's message history
- Voice provocation fires when the current voice's thread is empty (first time using that voice, or after RESET)
- Switching back to Twain restores Twain's full history exactly as left
- Mode switches happen within a voice thread (with visual dividers); they do not create separate threads
- RESET button clears all voice threads globally and returns to Auto, empty state

### Return Visitor Behavior
- Opening provocation fires ONLY when the current voice's thread is empty
- Returning users land directly in their existing conversation, no re-introduction

## Design System (Passes 4 & 5 — Visual Identity)

### Aesthetic direction
Dark editorial broadsheet. The UI frames the satirist's words as printed text, not chat messages.

### Typography
```css
/* Bot responses */
font-family: 'EB Garamond', Georgia, serif;
font-size: 18px;
line-height: 1.8;
color: #e8dcc8;  /* warm cream */

/* User messages */
font-family: 'DM Sans', system-ui, sans-serif;
font-size: 15px;
font-style: italic;
color: #a09880;  /* muted, deferential — the correspondent's voice */

/* Wordmark / headers */
font-family: 'Playfair Display', Georgia, serif;
font-size: 22px;
letter-spacing: 0.08em;
color: #e8dcc8;

/* Voice/mode tabs */
font-family: 'DM Sans', system-ui, sans-serif;
font-size: 13px;
letter-spacing: 0.05em;
text-transform: uppercase;
```
Google Fonts used: EB Garamond, Playfair Display, DM Sans — all free, no license cost.

### Color palette
```css
--bg-primary:    #111111;   /* near-black background */
--bg-secondary:  #1a1a1a;   /* input area, slightly lighter */
--bg-surface:    #222222;   /* voice/mode tab bar */
--text-primary:  #e8dcc8;   /* cream — bot text, wordmark */
--text-muted:    #a09880;   /* user messages, secondary text */
--accent-gold:   #c4a55a;   /* active voice tab, user msg left border, SUBMIT button */
--divider:       #333333;   /* horizontal rules between sections */
--error-text:    #c4a55a;   /* in-character error messages use gold, not red */
```

### Message layout (no bubbles)
Document layout — messages render as a typeset column, not speech bubbles.

**Bot response:**
```
[full column width, left-aligned]
EB Garamond 18px, cream
No background, no border, no bubble
Preceded by a thin horizontal rule (#333333) separating exchanges
```

**User message:**
```
[full column width, left-aligned]
DM Sans italic 15px, muted (#a09880)
Left border: 2px solid #c4a55a (gold)
Padding-left: 16px
No background, no bubble
```

**Mode divider (on mode switch):**
```
— Switched to Devil's Dictionary —
Centered, DM Sans 11px uppercase, #555 color
Thin divider lines left and right of text
```

### Voice tab design
- Horizontal pill row: `[Auto] [Twain] [Bierce] [Swift] [Voltaire]`
- Tab: DM Sans 13px uppercase, 8px 16px padding
- Inactive: `#333` background, `#888` text
- Active: `#c4a55a` (gold) bottom border or background tint, `#e8dcc8` text
- Active-auto-detected: active voice tab gets a small `·` dot indicator after label

### Input area
- Background: `#1a1a1a`
- Border-top: `1px solid #333`
- Textarea, no border, `#111` background, `#e8dcc8` text, EB Garamond 16px, no bubble styling
- Submit button: `#c4a55a` gold background, `#111` text, DM Sans uppercase, 0 border-radius (sharp corners — editorial, not rounded)
- Placeholder text: voice-appropriate (see Interaction States section)

## Responsive & Accessibility (Pass 6)

### Breakpoints
- **Desktop** (≥1024px): 680px centered chat column, full tab rows visible
- **Tablet** (640–1023px): 100% column width, 32px horizontal padding
- **Mobile** (<640px): 100% width, 16px horizontal padding

### Mobile tab behavior
Both voice and mode tab rows: `overflow-x: auto; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch`
No scrollbar visible (hide with CSS). Fade-right gradient indicates more tabs exist.

### Mobile font adjustments
- Bot responses: 16px (down from 18px) on mobile
- User messages: 14px on mobile
- Input field: 16px minimum (prevents iOS auto-zoom on focus)

### Touch targets
- All tabs: minimum 44px touch target height
- Submit button: minimum 44px height
- RESET button: minimum 44px touch target

### Keyboard navigation (ARIA)
- Voice tabs: `role="tablist"`, each tab `role="tab"`, `aria-selected="true/false"`
- Arrow keys move focus between tabs; Enter/Space activates
- Mode tabs: same ARIA pattern
- Tab order: voice tablist → mode tablist → chat area → input → submit

### Input label
- Visible `<label>` element, 11px uppercase, muted gold (`#c4a55a` 60% opacity), positioned above the input area
- Label text changes by active mode:
  - Roast: `SUBJECT:`
  - Devil's Dictionary: `YOUR WORD:`
  - Modest Proposal: `THE PROBLEM:`
  - Correspondence: `YOUR LETTER:`
  - Aphorism Engine: `YOUR THEME:`
- `htmlFor` links label to textarea via id
- Placeholder text is supplementary, not the sole identifier

### Streaming / ARIA live region
- Chat message container: `aria-live="polite"` so screen readers announce new bot responses
- Thinking phrases: inside the same live region; announced once per phrase change

### Color contrast
- Bot text (#e8dcc8 on #111111): ~13:1 contrast ratio ✓ WCAG AAA
- User text (#a09880 on #111111): ~3.4:1 — **fails** AA for small text; adjust to `#b8a888` (~4.6:1) ✓
- Gold accent (#c4a55a on #111111): ~6:1 ✓ WCAG AA
- No information conveyed by color alone (voice indicator uses both color + dot symbol)

## User Journey (Pass 3 — Emotional Arc)

| Step | User Does | User Feels | What the UI Delivers |
|------|-----------|------------|---------------------|
| 1. First load | Lands on page | Curious, slightly intimidated | Header + Auto tab selected + Roast mode + bot's opening provocation already waiting |
| 2. Reads the opener | Reads the in-character greeting | Amused, oriented | The satirist's personality is established before a single keystroke |
| 3. First prompt | Types something, hits Submit | Anticipation | Input disables, streaming indicator appears, then text flows token by token |
| 4. First response | Reads the satirical take | Delight or mild outrage (both correct) | Formatted response, in character, no hedging |
| 5. Explores modes | Clicks "Devil's Dictionary" | Playful | Mode divider appears; new mode context; new in-character response style |
| 6. Returns tomorrow | Comes back next day | Recognized, comfortable | Existing history is there; provocation does not re-fire |
| 7. Shares it | Wants to show someone | Evangelical | ← Not designed in v1; noted as v2 opportunity |

**Time-horizon design:**
- 5 seconds (visceral): Literary aesthetic + in-character provocation = immediately distinct from generic chatbots
- 5 minutes (behavioral): Voice tabs + mode tabs are immediately discoverable; trying all 4 voices and 5 modes is a natural affordance
- 5 years (reflective): localStorage history as a record of wit consumed; voice as a personality pairing

## Implementation Tasks

Synthesized from this review's findings. Each task derives from a specific finding above.

- [ ] **T1 (P1, human: ~2h / CC: ~30min)** — Layout — Scaffold Next.js page with sticky header (wordmark), voice tab row, mode tab row, scrollable chat area, sticky input footer
  - Surfaced by: Pass 1 — IA layout ASCII diagram
  - Files: `app/page.tsx`, `components/Layout.tsx`, `components/VoiceTabs.tsx`, `components/ModeTabs.tsx`
  - Verify: renders correctly at 1440px, 768px, 375px

- [ ] **T2 (P1, human: ~1h / CC: ~20min)** — Design system — Implement CSS variables, import Google Fonts (EB Garamond, Playfair Display, DM Sans), apply dark editorial color palette
  - Surfaced by: Pass 4/5 — full design system specification
  - Files: `app/globals.css`, `tailwind.config.ts` (or `styles/tokens.css`)
  - Verify: no Inter/system font visible; background is #111111; bot text is cream serif

- [ ] **T3 (P1, human: ~1.5h / CC: ~25min)** — Message display — Document-style message layout, no bubbles; bot = EB Garamond full-width; user = DM Sans italic with gold left border
  - Surfaced by: Pass 4 — message layout decision (document, no bubbles)
  - Files: `components/MessageList.tsx`, `components/BotMessage.tsx`, `components/UserMessage.tsx`
  - Verify: no rounded chat bubbles visible in UI

- [ ] **T4 (P1, human: ~2h / CC: ~30min)** — Streaming — Anthropic API streaming via Next.js API route; streaming cursor in document position; input disabled during stream
  - Surfaced by: Pass 2 — streaming decision
  - Files: `app/api/chat/route.ts`
  - Verify: text appears token-by-token; input disables during response; re-enables on complete

- [ ] **T5 (P1, human: ~1h / CC: ~20min)** — Per-voice localStorage threads — 5 separate localStorage keys; voice switch loads that voice's thread; each voice fires provocation on empty thread
  - Surfaced by: Pass 7 — per-voice thread decision
  - Files: `lib/history.ts`, `hooks/useVoiceHistory.ts`
  - Verify: switch Twain → Bierce → Twain; Twain's history is restored; Bierce's is independent

- [ ] **T6 (P1, human: ~1h / CC: ~20min)** — In-character thinking phrases — Rotating phrases (3 per voice) shown in response position before first streaming token; fade transition; disappear on first token
  - Surfaced by: Pass 2 / Pass 6 — in-character loading state
  - Files: `components/ThinkingIndicator.tsx`, `lib/thinkingPhrases.ts`
  - Verify: phrases cycle at 1.5s; disappear as soon as streaming starts

- [ ] **T7 (P1, human: ~1h / CC: ~15min)** — In-character error state — Error bubble (no button styling) + [Retry] plain text link below, per-voice copy
  - Surfaced by: Pass 2 — error state decision
  - Files: `components/ErrorMessage.tsx`, `lib/errorCopy.ts`
  - Verify: simulate API failure; correct voice's error message appears; retry re-sends last message

- [ ] **T8 (P1, human: ~1h / CC: ~15min)** — Auto-voice detection indicator — After first response in Auto mode, highlight the detected voice tab with a dot indicator
  - Surfaced by: Pass 1 — Auto tab + live indicator spec
  - Files: `components/VoiceTabs.tsx`, `lib/autoVoiceDetect.ts`
  - Verify: Auto tab selected on load; after first response, a dot appears on the detected voice tab

- [ ] **T9 (P2, human: ~1h / CC: ~15min)** — Mobile responsive — Horizontal scroll tabs with snap, 44px touch targets, 16px min font on input, correct padding at each breakpoint
  - Surfaced by: Pass 6 — mobile spec
  - Files: `app/globals.css`, `components/VoiceTabs.tsx`, `components/ModeTabs.tsx`
  - Verify: no horizontal page overflow at 375px; tabs swipe left on mobile

- [ ] **T10 (P2, human: ~1h / CC: ~15min)** — ARIA + keyboard nav — `role="tablist/tab"`, `aria-selected`, arrow key navigation, `aria-live="polite"` on chat area, visible input label
  - Surfaced by: Pass 6 — a11y spec
  - Files: `components/VoiceTabs.tsx`, `components/ModeTabs.tsx`, `components/ChatArea.tsx`, `components/InputArea.tsx`
  - Verify: tab row navigable by arrow keys; screen reader announces new bot messages

- [ ] **T11 (P2, human: ~30min / CC: ~10min)** — Mode-specific input label — `<label>` above textarea changes by active mode: "SUBJECT:", "YOUR WORD:", "THE PROBLEM:", "YOUR LETTER:", "YOUR THEME:"
  - Surfaced by: Pass 6 — input label decision
  - Files: `components/InputArea.tsx`
  - Verify: label text updates on mode switch; `htmlFor` links label to textarea

- [ ] **T12 (P2, human: ~30min / CC: ~10min)** — User text contrast fix — Change user message color from #a09880 to #b8a888 (achieves 4.6:1 contrast ratio against #111111)
  - Surfaced by: Pass 6 — contrast ratio check
  - Files: `app/globals.css` (`--text-muted` token)
  - Verify: run against WCAG contrast checker; ≥4.5:1

- [ ] **T13 (P3, human: ~2h / CC: ~30min)** — Opening provocations — 5 per-voice opening lines (including Auto); fire on empty thread only; in-character phrasing
  - Surfaced by: Pass 2/3 — empty state and return visitor spec
  - Files: `lib/openingLines.ts`
  - Verify: new user sees provocation; returning user sees existing history; no double-fire

_No new tasks from Pass 5 (design tokens already in T2). No new tasks from voice/mode system prompt (covered by eng review)._

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | — | — |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | — | — |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | CLEAR | 10 issues, 0 critical gaps |
| Design Review | `/plan-design-review` | UI/UX gaps | 1 | CLEAR | score: 2/10 → 9/10, 13 decisions |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | — | — |

**UNRESOLVED:** 0 decisions remain open.
**VERDICT:** ENG + DESIGN CLEARED — ready to implement.
