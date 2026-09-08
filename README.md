# FriendGuess

FriendGuess is a multiplayer party-game concept where one friend secretly answers a personal question and everyone else races to guess the hidden answer first.

## Core game loop

1. A player becomes the Answerer.
2. FriendGuess shows a question such as **“What is your favorite color?”**
3. The Answerer privately enters an answer such as **“blue.”**
4. Everyone else repeatedly submits guesses without seeing the secret answer.
5. The first correct guess wins the round's points.
6. The Answerer rotates and the next round begins.
7. The highest score at the end wins.

## Current MVP

The repository currently contains a playable local prototype built with Next.js. It includes:

- Original colorful party-game UI inspired by the feel of browser party games
- Create-room and join-room screens
- Five-character room codes
- Lobby and player cards
- Adjustable round count
- Secret-answer entry screen
- 60-second round timer
- Guess feed
- Correct-answer detection
- First-winner scoring
- Answerer rotation
- Round result screens
- Final leaderboard and rematch flow
- Responsive desktop/mobile layouts
- Demo friends so the full flow can be tested before the multiplayer backend is connected

## Important: multiplayer status

The current version is a **local interactive prototype**. Room codes are visual/demo room codes and do not yet synchronize players across different phones or computers.

The next backend milestone is Supabase Realtime. The secret answer must be protected so guessing players cannot retrieve it from their browsers before the round ends.

## Run locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Production roadmap

- Supabase room/player database
- Realtime room presence and guesses
- Secure server-side secret-answer checking
- Host controls
- Reconnect support
- Shareable room URLs
- Custom and built-in question packs
- Kick/inactive-player controls
- Profanity/safety filtering for public-facing text
- Vercel deployment

## Tech

- Next.js 16
- React 19
- CSS
- Planned: Supabase Realtime + PostgreSQL
