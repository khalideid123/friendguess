# FriendGuess

A fast browser guessing game built with Next.js 16, React 19, and Supabase. Play ten-round solo runs with Milo the fox, or race friends to guess a hidden personal answer. No account required.

## Play

- **Solo:** Choose Easy, Medium or Hard, then play immediately. Milo is always the Answerer, never an opponent. Each difficulty has 200 questions with two authored semantic clues followed by three spelling clues.
- **Clues:** One clue is available immediately. More unlock on the visible timeline. An early clue costs 60 points before the difficulty multiplier; using more clues also lowers the clue bonus.
- **Scoring:** 400 solve points, up to 300 speed points, up to 300 clue points, 100 for a first guess, and up to 200 for a streak. Medium multiplies the total by 1.4; Hard by 1.8. Incorrect rounds score zero and do not subtract earned points.
- **Runs:** Ten questions. The timer gets five seconds tighter after rounds four and eight. Results show accuracy, best streak, score, XP and earned badges.
- **Progress:** XP, levels, six badges, three theme options, personal records and recent runs are stored in this browser. Unfinished runs can be resumed; the active round's clock keeps running while away.
- **Daily:** A date-seeded deck, shared across players, with four Easy, four Medium and two Hard questions. Resets at 00:00 UTC. Daily personal records stay on the device; there is no global or cheat-proof leaderboard.
- **Friends:** Two to ten players. Create a room or join using a nickname and five-character code. One player locks an answer and optional clue. The first correct guess wins 100 points plus up to 60 speed points. The Answerer rotates, with final scores and rematches.

## Development

```sh
npm ci
npm run dev
npm test
npm run build
```

The production build is a static Next.js export in `out/`. Vercel builds the existing GitHub integration. The GitHub Pages workflow uses the `/friendguess` base path.

### Live multiplayer integration checks

```sh
npm run test:multiplayer
```

This creates isolated QA rooms in the existing Supabase project using its publishable API key. It tests validation, protected answers, a first-winner race, real timer expiration, scoring, rotation, kicking, leaving, host transfer and reset. It removes all test identities with the normal leave RPC in `finally`. It does not need a service-role key. Allow a few minutes for the real round timer and network calls.

## Architecture

- `components/GameHub.js`: home, shared controls, local profile and mode navigation.
- `components/SoloGame.js`: the single solo UI.
- `lib/solo-engine.js`: pure, tested run state machine, deterministic daily decks and scoring.
- `lib/progress.js`: versioned local profile and idempotent XP awards.
- `components/soloQuestionBank.js` and `components/clues-*.js`: all 600 questions and authored clues. Missing content fails the build.
- `components/MultiplayerGame.js`: room entry, lobby, secret entry, live guesses and results.
- `lib/use-room.js`: one owner for polling, room actions, presence and leave cleanup.
- `lib/supabase.js`: publishable configuration and optional close-guess service with secure RPC fallback.
- `components/GameUI.js`, `components/AudioProvider.js`: shared game UI and lightweight synthesized audio.
- `public/art/`: four optimized Milo WebP expression assets, generated for this project.

No DOM observers, injected controls, parallel abandoned solo modes or client-side multiplayer answer matching remain.

## Multiplayer security

The server owns game state, answers, authorization and scoring. Every relevant RPC verifies a random per-player secret against a private SHA-256 hash. Host actions validate the host. Answer entry validates the Answerer. The database atomically claims the first correct guess. Guessers receive neither `mySecret` nor `revealed_answer` before completion. The AI context function is service-role-only, and direct secret-table access is blocked for public clients.

Only the publishable Supabase key is included in the client. Never put a service-role key, AI key, database password or other privileged secret in client code or a `NEXT_PUBLIC_` variable.

Audio starts after user interaction, can be muted, and respects tab visibility. CSS animations respect reduced-motion preferences. No heavy animation or game framework is required.

## Assets

Milo's four expressions were created with the built-in image-generation tool as a transparent 2×2 mascot sheet, then cropped and optimized for the game. Brief: an orange fox with cream muzzle and tail tip, violet bandana, in hello, thinking, celebration and encouraging poses. The optimized assets are in `public/art/`. Outfit is locally served under the SIL Open Font License in `public/fonts/OFL.txt`.
