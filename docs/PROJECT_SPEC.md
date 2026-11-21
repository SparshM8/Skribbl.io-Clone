# Project Spec

## Goal
Build an end-to-end clone of skribbl.io: players join a room, take turns drawing a chosen word while others guess it in chat, earn points, and the highest score wins. The app must work locally and be publicly deployed, with the full flow (create room → draw → guess → score) working in production.

## Success criteria
1. Two or more people on different devices can play a full game through the deployed URL.
2. Drawing appears on every guesser's screen with no noticeable lag.
3. The author can explain how strokes, game state, WebSockets, word matching and deployment work.

## Requirements checklist

### Must have
- [x] Create room with configurable settings
- [x] Join room via link or code
- [x] Lobby with player list; host starts game
- [x] Turn-based rounds: one drawer, others guess
- [x] Real-time drawing sync
- [x] Word selection for the drawer (1–5 choices)
- [x] Guessing with points for correct guesses
- [x] Scoring and leaderboard
- [x] Game end with winner
- [x] Brush, colors, undo, clear

### Should have
- [x] Hints (letters revealed over time)
- [x] Chat (guesses plus general chat)
- [x] Draw-time countdown
- [x] Private rooms (invite link)

### Nice to have
- [x] Word categories
- [x] Eraser
- [x] Kick / ban
- [x] Votekick
- [ ] Multiple word-list languages

### Bonus ideas (pick a few)
- [x] OOP server structure (Player, Room, RoomStore, Game, WordService, GuessMatcher, scoring)
- [x] Word modes: Normal, Hidden, Combination
- [x] Custom word list from host
- [x] Avatars (customizer with colors, eyes, mouths)
- [ ] Spectator mode
- [ ] Replay of last round

## Room settings (host-configurable, server clamps to range)
| Setting | Range | Default |
|---|---|---|
| `maxPlayers` | 2–20 | 8 |
| `rounds` | 2–10 | 3 |
| `drawTime` (s) | 15–240 | 80 |
| `wordCount` | 1–5 | 3 |
| `hints` | 0–5 (0 = disabled) | 2 |
| `wordMode` | `normal` / `hidden` / `combination` | `normal` |
| `isPrivate` | boolean | true |

## Screens
1. **Home**: enter name, create room, join by code, browse public rooms.
2. **Lobby**: room code and copy-invite-link button, player list with ready state, host settings panel, Start button (host only).
3. **Game**: canvas, toolbar (drawer only), player list with scores, chat/guess box, word hint bar, countdown, round indicator.
4. **Word pick overlay**: shown to the drawer; others see "X is choosing a word".
5. **Round end overlay**: reveals the word, shows points gained this round.
6. **Game over**: podium and full leaderboard, play-again button for host.

## Out of scope
Accounts and login, persistent database, payments, mobile native apps, voice chat.

## Original touches (differentiators)
- Plain `ws` with our own typed protocol instead of Socket.IO
- Batched, throttled stroke points with quadratic-curve smoothing on render
- Server-held stroke list so undo, late join and reconnect all restore the canvas
- Time-based scoring with order bonus and streak bonus
- Private "so close!" feedback for guesses within edit distance 1
- Session-token reconnect with smart seat-holding grace periods (10m in lobby, 60s in-game)

## Deliverables
1. Working app running locally and deployed
2. `README.md` with setup steps and live URL
3. Architecture overview (`docs/ARCHITECTURE.md`)
4. Author is ready to walk through the code
