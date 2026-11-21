# Game Rules and Logic

## Lifecycle
1. **Lobby**: host sets options, players ready up, host starts (≥2 players).
2. **Turn** (repeat for `rounds × players` turns):
   1. `WORD_PICK` (15 s): drawer gets `wordCount` options, picks one. Timeout → random option.
   2. `DRAWING` (`drawTime` s): drawer draws; others guess.
   3. `ROUND_END` (5 s): reveal word and points gained, then next drawer.
3. **Game over**: highest total score wins; ties share the win and are ordered by who guessed first more often, then by name.

## Turn order
Taken from the connected players at game start, in join order. Round 1: P1, P2, … Pn. Round 2 repeats. Skip anyone who disconnected for good. If the current drawer leaves, end the turn immediately with reason `drawer_left` (no points for the drawer).

## Turn ends when
- every connected guesser has guessed correctly, or
- the timer reaches zero, or
- the drawer leaves.

## Word modes
| Mode | Hint shown to guessers | Notes |
|---|---|---|
| `normal` | Blanks per letter, spaces kept: `_ _ _ _ _` or `_ _ _   _ _ _ _` | Hints reveal letters. |
| `hidden` | Only a `?` and the word length is hidden too | No letter hints. Harder, so guesser points ×1.25 (rounded). |
| `combination` | Two words from the list joined, e.g. `cat house` | Hint shows two blank groups. Word list entries are single words; the server picks two. |

## Hints
- If `hints = 0` or mode is `hidden`, no letters are revealed.
- Otherwise reveal `hints` letters at evenly spaced times: at `drawTime × i / (hints + 1)` seconds for `i = 1..hints`.
- Pick random hidden letter positions (never spaces).
- Never reveal more than half the letters; if `hints` would exceed that, reveal fewer.
- Broadcast `hint_update { hint }`.

## Guess matching (`GuessMatcher`)
Normalize both the guess and the word:
1. Strip diacritics (`é → e`) using `normalize('NFD')` and removing combining marks.
2. Lowercase.
3. Turn every character that is not a letter, digit or space into a space (so `ice-cream` becomes `ice cream`).
4. Collapse whitespace to one space and `trim()`.

Result:
| Condition | Result | Effect |
|---|---|---|
| normalized strings equal, or equal once spaces are removed (`icecream` = `ice cream`) | `correct` | Score, broadcast `guess_result`, do not show text. |
| normalized word length ≥ 4 and Levenshtein distance = 1 | `close` | Send `close_guess { text }` privately to that player. Text is not shown to others. |
| otherwise | `wrong` | Shown as normal chat (`channel: 'all'`) to everyone, including the drawer and players who already guessed. |

Extra rules:
- A guess that merely **contains** the word as a whole word inside a longer sentence counts as `wrong`, but the message is **not** broadcast (prevents leaking by "is it a cat?"). It is echoed to the sender only (`channel: 'self'`).
- The drawer and players who already guessed chat on the `guessed` channel: only they receive those messages.
- The drawer cannot guess. A player who already guessed cannot score again.

## Scoring (`scoring.ts`, pure functions)
Let `t = timeLeft / drawTime` (0..1) at the moment of the correct guess, `k` = how many players guessed before this one (0 for first), `streak` = this player's consecutive correct turns before this turn.

**Guesser points**
```
base   = 100 + round(300 * t)
order  = [50, 30, 15][k] ?? 0
streak = min(streak, 3) * 10
points = round((base + order + streak) * (mode === 'hidden' ? 1.25 : 1))
```
**Drawer points**: for each correct guesser, `+round(300 / numGuessers)`, so a drawing everyone guesses yields about 300 total plus a flat `+25` if at least half the guessers got it. If nobody guesses, the drawer gets 0.

A player's streak resets to 0 when they fail to guess on a turn where they were a guesser. Turns where they draw do not change their streak.

## Disconnects & Retention
- **Lobby disconnect:** seat and room are held for **10 minutes** so the host can switch to messaging apps (e.g. WhatsApp) to invite friends without losing the room.
- **Mid-game disconnect:** seat is held for **60 seconds**. Disconnected players keep their score; if they reconnect they get `game_state` and `canvas_sync`.
- **After 60 seconds in-game:** removed from turn order and the room. If the host leaves, host moves to the next connected player.
- **If only one connected player remains:** the game ends gracefully with `not_enough_players`.

## Late joiners
Not allowed while a game is in progress (v1). Stretch: spectator mode.

## Validation limits
| Item | Limit |
|---|---|
| Name | 1–20 chars, unique within room (case-insensitive) |
| Chat or guess | 1–200 chars |
| Points per `draw_move` | ≤ 100 |
| Brush size | 1–40 |
| Strokes kept per turn | ≤ 500 |
| Custom words (host) | ≤ 100 words, 2–24 chars each |
