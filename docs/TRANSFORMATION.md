# FriendGuess transformation

## Audit and design

The September 2026 client opened on a room form. Four solo implementations coexisted; the active one injected a launcher with a MutationObserver and rendered a second full-screen game. Hints, kicking, leave behavior, and audio also depended on DOM observers or button text. This made layout changes risky and doubled room-state polling.

The backend is already real multiplayer. Public RPCs verify a per-player random secret against a private SHA-256 hash. Host actions check host credentials; answer locking checks the Answerer; a database trigger atomically claims the first correct guess and awards points. `get_room_state` returns a secret only to its Answerer. The AI context function is service-role-only. Public tables have RLS. Keep these boundaries and the existing project.

### Product plan

- A game-native home: instant Solo, Friends, daily challenge, and personal progress.
- One ten-round solo state machine. Milo always picks; only the human earns points.
- Preserve 200 questions per difficulty. Give every answer two authored semantic clues, then reveal spelling clues on a timeline. Early reveals cost points. Later rounds tighten the clock.
- Score = solve + speed + clue economy + first guess + streak, with a visible difficulty multiplier.
- Browser-local XP, levels, badges, theme unlocks, records, run history, and resumable runs. Daily decks use UTC date and a seeded shuffle. No claim of cheat-proof or global leaderboards.
- Unified React multiplayer: lobby, sharing, secret entry and hint, live guesses, scoreboards, rotation, final scores, kicking and leaving. One polling owner, no response rewriting or DOM injection.
- Dark arcade palette, violet/lime accents, custom Milo expression assets, lightweight CSS motion and synthesized sounds. Reduced-motion and mute controls.

### Verification gates

Production build; pure solo engine tests including every question, aliases, timing, duplicate guesses, score and progression; real Supabase integration covering room lifecycle and security; browser gameplay and responsive inspection. Deploy through the existing GitHub/Vercel connection, then verify production.
