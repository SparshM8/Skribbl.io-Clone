# WebSocket Protocol

Endpoint: `/ws` (same origin as the app in production; `ws://localhost:3001/ws` in dev).
Every message in both directions is JSON: `{ "type": "<name>", "payload": { ... } }`.
Invalid JSON or an unknown type gets `error { message }` back.

Legend: **C→S** client to server, **S→C** server to client. ✅ = implemented, 🔜 = planned.

## Types
```ts
type Phase = 'LOBBY' | 'WORD_PICK' | 'DRAWING' | 'ROUND_END' | 'GAME_OVER';
interface PublicPlayer { id: string; name: string; score: number; ready: boolean; connected: boolean; isHost: boolean }
interface RoomSnapshot { code: string; phase: Phase; hostId: string; settings: RoomSettings; players: PublicPlayer[] }
interface Point { x: number; y: number }                 // normalized 0..1
interface Stroke { id: string; tool: 'brush' | 'eraser'; color: string; size: number; points: Point[] }
```

## Room and lobby
| Type | Dir | Payload | Notes |
|---|---|---|---|
| `create_room` ✅ | C→S | `{ hostName, settings?, customWords? }` | Settings are clamped. Replies `room_joined`. |
| `join_room` ✅ | C→S | `{ roomCode, playerName, avatar? }` | Code is case-insensitive. Errors: not found, full, started, name taken. |
| `leave_room` ✅ | C→S | `{}` | Permanent exit from room. Broadcasts `player_left`. |
| `update_avatar` ✅ | C→S | `{ avatar }` | Updates player avatar. Broadcasts `lobby_update`. |
| `rejoin` ✅ | C→S | `{ roomCode, token }` | Replies `room_joined` or `rejoin_failed`. |
| `list_public_rooms` ✅ | C→S | `{}` | Replies `public_rooms`. |
| `set_ready` ✅ | C→S | `{ ready: boolean }` | Lobby only. |
| `update_settings` ✅ | C→S | `{ settings, customWords? }` | Host only, lobby only. Custom words are sanitized and never broadcast; the snapshot only has `customWordCount`. |
| `start_game` ✅ | C→S | `{}` | Host only, needs ≥2 players, all non-hosts ready. |
| `kick_player` ✅ | C→S | `{ playerId }` | Host only. Immediately removes player and broadcasts `player_left`. |
| `vote_kick` ✅ | C→S | `{ playerId }` | Non-host vote to kick. Kicks player if > 50% majority votes. |
| `vote_kick_update` ✅ | S→C | `{ targetId, targetName, votes, needed }` | Broadcast to all when someone votes to kick. |
| `room_joined` ✅ | S→C | `{ you: playerId, token, room: RoomSnapshot }` | Sent only to the joining player. Keep `token` private. |
| `player_joined` ✅ | S→C | `{ player, room }` | To everyone else. |
| `player_left` ✅ | S→C | `{ playerId, temporary, room }` | `temporary: true` during the 30 s grace period. |
| `player_reconnected` ✅ | S→C | `{ playerId, room }` | |
| `lobby_update` ✅ | S→C | `{ room }` | Ready or settings changed. |
| `public_rooms` ✅ | S→C | `{ rooms: [{ code, players, max, rounds }] }` | |
| `rejoin_failed` ✅ | S→C | `{}` | Token or room no longer valid. |
| `kicked` ✅ | S→C | `{ message }` | Sent to a player who was kicked or votekicked. |
| `error` ✅ | S→C | `{ message }` | |

## Game flow
| Type | Dir | Payload | Notes |
|---|---|---|---|
| `game_state` ✅ | S→C | `{ phase, round, totalRounds, turn, totalTurns, drawerId, hint, endsAt, scores, guessedIds, wordOptions?, word? }` | Full state for a **reconnecting** player (normal transitions use the events below). `wordOptions` only for the drawer during `WORD_PICK`; `word` only for the drawer, or a player who already guessed, during `DRAWING`. `scores` is `{ [playerId]: number }`. `hint` is the masked word (e.g. `"_ _ a _ _"`), never the real word for non-drawers. |
| `round_start` ✅ | S→C | `{ round, totalRounds, turn, totalTurns, drawerId, endsAt }` to all; **drawer additionally** gets `{ wordOptions: string[] }` | Phase `WORD_PICK`. |
| `word_chosen` ✅ | C→S | `{ word }` | Drawer only; wrong sender, phase or word → `error { message: 'Cannot choose that word' }`. Must be one of the offered options. Auto-picked after 15 s. |
| `drawing_start` ✅ | S→C | `{ hint, endsAt }` | Phase `DRAWING`. `endsAt` is an epoch ms timestamp so clients render the countdown without drift. Drawer also gets `{ word }`. |
| `hint_update` ✅ | S→C | `{ hint }` | A letter was revealed. Sent to everyone except the drawer. |
| `round_end` ✅ | S→C | `{ word, reason: 'all_guessed' \| 'time_up' \| 'drawer_left', gains: {playerId: points}, scores, nextDrawerId }` | Reveals the word. |
| `game_over` ✅ | S→C | `{ reason: 'completed' \| 'not_enough_players', winner, winners: PublicPlayer[], leaderboard: PublicPlayer[] }` | `winners` holds everyone tied for the top score. |
| `play_again` ✅ | C→S | `{}` | Host only; resets scores and returns to lobby. |

## Drawing
Only the current drawer may send these, only in phase `DRAWING`.
| Type | Dir | Payload | Notes |
|---|---|---|---|
| `draw_start` ✅ | C→S | `{ strokeId, tool, color, size, x, y }` | |
| `draw_move` ✅ | C→S | `{ strokeId, points: Point[] }` | Batched, ≤ ~30 ms of points, max 100 points per message. |
| `draw_end` ✅ | C→S | `{ strokeId }` | |
| `canvas_clear` ✅ | C→S and S→C | `{}` | Server clears its buffer then broadcasts to others. |
| `draw_undo` ✅ | C→S | `{}` | Server pops the last stroke. |
| `draw_data` ✅ | S→C | `{ op: 'start', stroke } \| { op: 'move', strokeId, points } \| { op: 'end', strokeId }` | Sent to everyone except the drawer. |
| `stroke_undone` ✅ | S→C | `{ strokeId }` | Sent to everyone including the drawer. |
| `canvas_sync` ✅ | S→C | `{ strokes: Stroke[] }` | Late join or reconnect. |

> Deviation from the suggested spec: the server does not echo `draw_data` back to the drawer, because the drawer already rendered the stroke locally. This avoids double drawing and halves outbound traffic for that client.

## Chat and guessing
| Type | Dir | Payload | Notes |
|---|---|---|---|
| `chat` ✅ | C→S | `{ text }` | General chat (≤200 chars). During `DRAWING` the server runs the text through the guess pipeline (see `GAME_RULES.md`). |
| `guess` ✅ | C→S | `{ text }` | Alias of `chat`; the server decides if it is a guess. |
| `chat_message` ✅ | S→C | `{ playerId, playerName, text, channel }` | `all`: everyone. `guessed`: only the drawer and players who already guessed. `self`: echo to the sender only (their message contained the secret word, so it was not broadcast). |
| `guess_result` ✅ | S→C | `{ correct: true, playerId, playerName, points, scores }` + `word` **only in the guesser's own copy** | Broadcast on a correct guess; the guess text is never included. Clients render "PlayerX guessed the word!". `scores` is `{ [playerId]: number }` and already includes the drawer's share. |
| `close_guess` ✅ | S→C | `{ text }` | Sent only to the guesser whose text was within edit distance 1 (word ≥ 4 letters). Client shows "So close!". Not shown to anyone else. |

## Rules for the server when handling messages
1. Parse, then check `type` exists.
2. Check the sender is in a room (except `create_room`, `join_room`, `rejoin`, `list_public_rooms`).
3. Check role (host or drawer) and phase.
4. Clamp or trim all fields.
5. Mutate state, then broadcast.
