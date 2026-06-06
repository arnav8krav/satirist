# Changelog

## [0.1.1] — 2026-06-06

### Fixed
- Stream is now aborted when switching voice tabs or resetting, preventing state from a stale request corrupting another voice's history
- Empty responses (network drop, early stream close) no longer persist a blank assistant message to localStorage or LLM context
- Added `isSendingRef` guard to prevent concurrent `sendMessage` calls from racing
- Added server-side validation for `messages`, `voice`, and `mode` request fields; malformed requests now return 400 instead of crashing

### Improved (Accessibility)
- Mode dropdown description text now uses `--text-muted` (#b8a888) instead of bare `#666` — passes WCAG AA contrast on dark background
- Mode dropdown listbox items are now keyboard-focusable (tabIndex, Enter/Space to select)
- Pressing Escape in the mode dropdown now returns focus to the trigger button
- Streaming cursor `▌` and chevron `▾` marked `aria-hidden` to suppress noisy screen reader announcements
- Input area label color changed from semi-transparent gold (4.1:1) to full `--accent-gold` (7.2:1)
- Mode divider text in chat log changed from `#555` (2.5:1) to `--text-muted` (8.1:1)
- Reset button now has `aria-label="Reset conversation"`
- Retry button minimum touch target increased to 44px height

## [0.1.0] — 2026-06-06

### Added
- Initial release of The Satirist — a dark editorial satire chatbot powered by Claude
- Five satirical voices: Auto-detect, Twain, Bierce, Swift, Voltaire
- Five modes: Roast, Devil's Dictionary, Modest Proposal, Correspondence, Aphorism Engine
- Per-voice conversation history stored in localStorage (100 message cap)
- Streaming responses via Vercel AI SDK
- Optional Upstash Redis rate limiting (20 req/hour per IP)
- Mode dropdown with descriptions
- Keyboard navigation (ArrowLeft/Right voice tabs, ArrowUp/Down mode cycling)
- WCAG-aware dark editorial design system (EB Garamond, Playfair Display, DM Sans)
