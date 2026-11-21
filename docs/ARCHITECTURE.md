# Architecture

## Overview
```
 Browser (React + Canvas + Zustand)
        │   one WebSocket  {type, payload}
        ▼
 Node server (Express + ws)
   index.ts ── MessageRouter ── Room ── Game
                    │             │       ├─ WordService
                    │             │       ├─ GuessMatcher
                    ▼             ▼       └─ scoring
                 RoomStore     Player[]
```
The server holds all game state. Clients render what the server tells them and send only user intent.

## Server classes (`server/src/`)
| File | Responsibility |
|---|---|
| `index.ts` | Starts Express (`/api/health`, serves `client/dist` in production), attaches `ws` at `/ws`, heartbeat ping/pong. |
| `types.ts` | `RoomSettings`, defaults, `sanitizeSettings()`, `Phase`, envelope type. |
| `Player.ts` | id, name, score, ready, socket, connected flag, reconnect token, grace timer, `send()`, `toPublic()`. |
| `Room.ts` | Players map, host id, settings, phase, `broadcast()`, host transfer on leave, `snapshot()`. Owns one `Game`. |
| `timing.ts` ✅ | `ms()` scales every server timer by `TIME_SCALE` so tests can run a full game fast. |
| `RoomStore.ts` | `RoomStore` interface plus `InMemoryRoomStore` (5-char codes, public room listing). Swappable for Redis. |
| `MessageRouter.ts` | Parses JSON, validates sender and phase, dispatches `type → handler`. Handles disconnect and reconnect. |
| `Game.ts` ✅ | State machine and timers. Turn order, word pick, round timer, hints, round end, game over. |
| `WordService.ts` ✅ | Loads `words.json`, picks N random words by category, merges host custom words, builds combination words. |
| `GuessMatcher.ts` ✅ | Normalizes a guess and classifies it as `correct`, `close` or `wrong`. |
| `scoring.ts` ✅ | Pure functions for guesser points, drawer points, streak bonus. |
| `StrokeBuffer.ts` _(step 4)_ | Ordered stroke list per round: append points, undo last, clear, snapshot for late joiners. |

### Design rules
- `Game` receives a `Room` and uses `room.broadcast` / `player.send`. It never touches raw sockets.
- `MessageRouter` is the only place that reads client messages. Handlers do validation then call a method on `Room` or `Game`.
- Pure logic (`GuessMatcher`, `scoring`) has no I/O so it can be unit-tested.

## Game state machine
```
LOBBY ──start_game──▶ WORD_PICK ──word_chosen / 15s timeout──▶ DRAWING
  ▲                       ▲                                       │
  │                       │            all guessed OR time up     ▼
  │                       └──── next drawer ◀──────────────── ROUND_END
  │                                                               │ last drawer of last round
  └──────────── play_again (host) ◀──────────────────────── GAME_OVER
```
- **Turn order**: snapshot of connected players at game start. A full round = every player draws once. Total turns = `rounds × players`. Players who leave are skipped; players who join mid-game are not allowed (v1).
- If fewer than 2 connected players remain, the game ends early and goes to `GAME_OVER`.

## Client structure (`client/src/`)
```
main.tsx
App.tsx                           screen switch on store.screen
net/socket.ts                     WebSocket wrapper: connect, send(type,payload), reconnect with token
store/useGame.ts                  Zustand store: room, you, phase, round, hint, scores, chat, strokes
screens/Home.tsx                  welcome, nickname, character preview, create/join room
screens/CreateRoom.tsx            custom game settings (rounds, time, hints, word modes)
screens/JoinRoom.tsx              join game by 5-char room code
screens/Lobby.tsx                 pre-game room, players list, ready check, start game
screens/Game.tsx                  3-column gameplay layout (leaderboard, canvas, chat)
components/Canvas.tsx             capture + render strokes with quadratic Bézier smoothing
components/Toolbar.tsx            brush, eraser, 14 colors, 4 sizes, undo, clear
components/Leaderboard.tsx        player rankings, scores, medals, drawer indicator
components/Chat.tsx               guesses, system banners, near-miss feedback, mute filter
components/GameTimer.tsx          word hint tiles, countdown bar, leave game trigger
components/WordModal.tsx          drawer word selection overlay
components/GameOver.tsx           podium winners (1st/2nd/3rd), confetti, play-again trigger
components/Avatar.tsx             modular 3D Chibi SVG avatar renderer
components/AvatarCustomizer.tsx   quick randomizer & preview
components/CharacterStudio.tsx    full wardrobe studio (hair, eyewear, outfit, skin)
components/PlayerProfileModal.tsx skribbl.io player modal (kick, votekick, mute, kudos)
```
Flow: `socket.ts` receives a message → calls a store action → components re-render from the store. Components send via `socket.send`. No component talks to the socket directly except through that module.

## Drawing pipeline
**Capture (drawer):**
1. `pointerdown` → create `strokeId`, draw locally immediately, send `draw_start`.
2. `pointermove` → push points into a local buffer, draw locally; a 30 ms interval flushes the buffer as one `draw_move { strokeId, points }`.
3. `pointerup` / `pointerleave` → flush, send `draw_end`.

**Coordinates:** normalized to 0–1 of the canvas width and height, so every screen size renders the same picture. Canvas logical size is fixed at 800×600 and CSS-scaled.

**Server:** appends to `StrokeBuffer`, then broadcasts `draw_data` to everyone **except** the drawer (the drawer already rendered locally).

**Render (guessers):** apply `draw_data` ops to the canvas, joining points with quadratic curves through midpoints for smooth lines. Eraser is a stroke painted in the background color so undo works the same way as for any stroke.

**Undo:** server pops the last stroke and broadcasts `draw_undo { strokeId }`. Clients redraw the canvas from their local stroke list minus that stroke.

**Late join / reconnect:** server sends `canvas_sync { strokes }` with the full stroke list.

## Reconnect
`room_joined` returns a `token`. Client stores `{roomCode, token}` in `localStorage`. On socket reopen it sends `rejoin`. Server reattaches the socket, cancels the grace timer and sends current state plus `canvas_sync`. After 30 s without reconnecting the player is removed.

## Scaling note (for the walkthrough)
State is in one process's memory, which is fine for a demo. To scale, put rooms in Redis behind `RoomStore`, use pub/sub for cross-instance broadcast, and use sticky sessions for WebSocket connections.
