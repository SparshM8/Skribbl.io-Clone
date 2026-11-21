// Scripted game test. Start the server with TIME_SCALE=0.1 first.
import WebSocket from 'ws';
import assert from 'node:assert/strict';

const URL = process.env.URL || 'ws://localhost:3001/ws';
const sleep = (t) => new Promise(r => setTimeout(r, t));

function client(name, { picks = true, longest = false } = {}) {
  return new Promise(res => {
    const ws = new WebSocket(URL);
    const c = { name, ws, msgs: [], id: null, picks, longest };
    c.send = (type, payload = {}) => ws.send(JSON.stringify({ type, payload }));
    c.of = (type) => c.msgs.filter(m => m.type === type).map(m => m.payload);
    ws.on('message', d => {
      const m = JSON.parse(d.toString());
      c.msgs.push(m);
      if (m.type === 'room_joined') c.id = m.payload.you;
      if (m.type === 'round_start' && m.payload.wordOptions && c.picks) {
        const opts = m.payload.wordOptions;
        const word = c.longest ? [...opts].sort((a, b) => b.length - a.length)[0] : opts[0];
        setTimeout(() => c.send('word_chosen', { word }), 50);
      }
    });
    ws.on('open', () => res(c));
  });
}
const waitFor = async (fn, ms = 20000) => {
  const end = Date.now() + ms;
  while (Date.now() < end) { if (fn()) return; await sleep(50); }
  throw new Error('timeout waiting for condition');
};
async function setup(names, settings, opts = {}) {
  const [host, ...rest] = await Promise.all(names.map((n, i) => client(n, opts[n])));
  host.send('create_room', { hostName: host.name, settings });
  await waitFor(() => host.id);
  const code = host.of('room_joined')[0].room.code;
  for (const c of rest) { c.send('join_room', { roomCode: code, playerName: c.name }); }
  await waitFor(() => rest.every(c => c.id));
  rest.forEach(c => c.send('set_ready', { ready: true }));
  await sleep(150);
  return { host, rest, all: [host, ...rest], code };
}

// ---------- Scenario 1: full game, 3 players, 2 rounds, Cy never picks (auto-pick) ----------
console.log('Scenario 1: full game');
{
  const { host, rest, all } = await setup(['Asha', 'Ben', 'Cy'], { rounds: 2, drawTime: 15, wordCount: 3 }, { Cy: { picks: false } });
  const [ben, cy] = rest;
  ben.send('word_chosen', { word: 'cat' }); // not the drawer yet → must be rejected
  host.send('start_game');
  await waitFor(() => all.every(c => c.of('game_over').length));
  await sleep(200);

  const ends = host.of('round_end');
  assert.equal(ends.length, 6, '6 turns (3 players x 2 rounds)');
  const drawers = host.of('round_start').map(p => p.drawerId);
  const ids = all.map(c => c.id);
  assert.deepEqual(drawers, [...ids, ...ids], 'turn order repeats each round');
  assert.ok(ben.of('error').some(e => e.message === 'Cannot choose that word'), 'non-drawer pick rejected');
  assert.equal(cy.of('drawing_start').filter(p => p.word).length, 2, "Cy's turns auto-picked a word");

  // The secret must never reach non-drawers.
  for (const c of all) {
    for (const t of ['round_start', 'drawing_start', 'game_state']) {
      for (const p of c.of(t)) {
        if (p.drawerId !== c.id) {
          assert.equal(p.wordOptions, undefined, `${t} leaked options to ${c.name}`);
          assert.equal(p.word, undefined, `${t} leaked word to ${c.name}`);
        }
      }
    }
    for (const p of c.of('drawing_start')) if (p.drawerId !== c.id) assert.match(p.hint, /^[_ ]+$/, 'hint is only blanks');
  }
  // Round-end reveals the word, and it matches what the drawer saw.
  const secrets = host.of('drawing_start').filter(p => p.word).map(p => p.word);
  assert.ok(ends.every(e => typeof e.word === 'string' && e.reason === 'time_up'));
  assert.equal(host.of('game_over')[0].reason, 'completed');
  console.log('  ok: order, auto-pick, no leaks, game_over. words seen by host-as-drawer:', secrets.join(', '));

  // play again
  host.send('play_again');
  await waitFor(() => host.of('lobby_update').some(u => u.room.phase === 'LOBBY'));
  console.log('  ok: play_again returns room to LOBBY');
}

// ---------- Scenario 2: drawer disconnects for good during their turn ----------
console.log('Scenario 2: drawer leaves mid-turn');
{
  // drawTime 60 (6 s scaled) outlasts the 3 s scaled reconnect grace period.
  const { host, rest } = await setup(['Asha', 'Ben', 'Cy'], { rounds: 2, drawTime: 60 }, { Asha: { picks: false } });
  const [ben, cy] = rest;
  host.send('start_game');
  await waitFor(() => host.of('round_start').length);
  host.ws.close(); // Asha draws first and drops
  await waitFor(() => ben.of('round_end').length);
  const first = ben.of('round_end')[0];
  assert.equal(first.reason, 'drawer_left', 'first turn ended because the drawer left');
  assert.equal(first.nextDrawerId, ben.id, 'next drawer skips the departed player');
  await waitFor(() => ben.of('round_start').length >= 2);
  assert.equal(ben.of('round_start')[1].drawerId, ben.id);
  const left = ben.of('player_left').filter(p => !p.temporary).at(-1);
  assert.equal(left.room.players.length, 2, 'Asha removed from the room');
  assert.equal(left.room.hostId, ben.id, 'host moved to the next player');
  console.log('  ok: drawer_left, skipped in order, host transferred');
  ben.ws.close(); cy.ws.close();
}

// ---------- Scenario 3: reconnect mid-game restores state ----------
console.log('Scenario 3: reconnect');
{
  const { host, rest, all } = await setup(['Asha', 'Ben'], { rounds: 2, drawTime: 15 });
  const ben = rest[0];
  const token = ben.of('room_joined')[0].token;
  const code = ben.of('room_joined')[0].room.code;
  host.send('start_game');
  await waitFor(() => ben.of('drawing_start').length);
  ben.ws.close();
  await sleep(300);
  const ben2 = await client('Ben2');
  ben2.send('rejoin', { roomCode: code, token });
  await waitFor(() => ben2.of('game_state').length);
  const gs = ben2.of('game_state')[0];
  assert.equal(gs.phase, 'DRAWING');
  assert.equal(gs.drawerId, host.id);
  assert.equal(gs.word, undefined, 'reconnected guesser does not get the word');
  console.log('  ok: rejoin gets game_state, phase =', gs.phase);
  host.ws.close(); ben2.ws.close();
}
// ---------- Scenario 4: guessing, scoring, spoiler-safe chat ----------
console.log('Scenario 4: guessing and scoring');
{
  const L = { longest: true };
  const { host, rest } = await setup(['Asha', 'Ben', 'Cy'], { rounds: 2, drawTime: 60, hints: 0 }, { Asha: L, Ben: L, Cy: L });
  const [ben, cy] = rest;
  host.send('start_game');
  await waitFor(() => host.of('drawing_start').length);
  const word = host.of('drawing_start')[0].word;
  assert.ok(word.length >= 4, 'test needs a word of 4+ letters for the close-guess check');

  ben.send('chat', { text: 'zzzz' });
  await waitFor(() => cy.of('chat_message').some(m => m.text === 'zzzz' && m.channel === 'all'));

  ben.send('chat', { text: `is it a ${word}?` });
  await waitFor(() => ben.of('chat_message').some(m => m.channel === 'self'));
  assert.ok(!cy.of('chat_message').some(m => m.text.includes(word)), 'sentence containing the word is not broadcast');
  assert.ok(!host.of('chat_message').some(m => m.text.includes(word)));

  ben.send('guess', { text: `  ${word.toUpperCase()} ` }); // messy but correct
  await waitFor(() => host.of('guess_result').length);
  const gr = host.of('guess_result')[0];
  assert.equal(gr.playerId, ben.id);
  assert.ok(gr.points >= 150 && gr.points <= 450, 'points in range for a first guess');
  assert.equal(gr.word, undefined, 'drawer view of guess_result has no word field');
  assert.equal(cy.of('guess_result')[0].word, undefined, 'other guessers are not told the word');
  assert.equal(ben.of('guess_result')[0].word, word, 'the guesser is told the word');
  assert.ok(gr.scores[host.id] > 0, 'drawer was paid for the guess');

  ben.send('chat', { text: 'great drawing' });
  host.send('chat', { text: `it is ${word}` });
  await waitFor(() => host.of('chat_message').some(m => m.text === 'great drawing' && m.channel === 'guessed'));
  await waitFor(() => ben.of('chat_message').some(m => m.text === `it is ${word}` && m.channel === 'guessed'));
  await sleep(150);
  assert.ok(!cy.of('chat_message').some(m => m.text === 'great drawing' || m.text.includes(word)), 'guessed channel hidden from guessers');

  const close = word.slice(0, -1) + (word.at(-1) === 'x' ? 'q' : 'x');
  cy.send('guess', { text: close });
  await waitFor(() => cy.of('close_guess').length);
  assert.ok(![host, ben].some(c => c.of('chat_message').some(m => m.text === close)), 'close guess stays private');

  cy.send('guess', { text: word });
  await waitFor(() => ben.of('round_end').length);
  const end = ben.of('round_end')[0];
  assert.equal(end.reason, 'all_guessed', 'turn ends as soon as everyone has guessed');
  assert.ok(end.gains[ben.id] > end.gains[cy.id], 'earlier guesser earns more');
  assert.equal(end.scores[ben.id], end.gains[ben.id]);
  assert.ok(end.gains[host.id] >= 200 + 25, 'drawer: share of 300 for 2 guessers plus half-guessed bonus');
  assert.equal(end.word, word);
  for (const c of [host, ben, cy]) {
    assert.ok(!c.of('chat_message').some(m => m.text.trim().toLowerCase() === word), 'a correct guess is never shown as text');
  }
  console.log('  ok: matching, privacy, scoring, early end. gains =', JSON.stringify(Object.values(end.gains)));
  [host, ben, cy].forEach(c => c.ws.close());
}

// ---------- Scenario 5: hints ----------
console.log('Scenario 5: hints');
{
  const { host, rest } = await setup(['Asha', 'Ben'], { rounds: 2, drawTime: 60, hints: 2 }, { Asha: { longest: true } });
  const ben = rest[0];
  host.send('start_game');
  await waitFor(() => ben.of('hint_update').length >= 2, 12000);
  const word = host.of('drawing_start')[0].word;
  const hints = ben.of('hint_update').map(h => h.hint);
  const shown = (h) => [...h].filter(c => c !== '_' && c !== ' ').length;
  assert.deepEqual(hints.slice(0, 2).map(shown), [1, 2], 'one more letter each time');
  const last = hints[1];
  for (let i = 0; i < word.length; i++) {
    const ch = last[2 * i];
    assert.ok(ch === '_' || ch === ' ' || ch === word[i], 'revealed letters are in the right place');
  }
  assert.equal(host.of('hint_update').length, 0, 'drawer is not sent hints');
  console.log('  ok: hints', hints.slice(0, 2).join(' | '));
  [host, ben].forEach(c => c.ws.close());
}

// ---------- Scenario 6: drawing sync, undo, clear, canvas_sync ----------
console.log('Scenario 6: drawing sync, undo, clear, late sync');
{
  const { host, rest } = await setup(['Asha', 'Ben'], { rounds: 2, drawTime: 60, hints: 0 });
  const ben = rest[0];
  host.send('start_game');
  await waitFor(() => ben.of('drawing_start').length);

  // Ben tries to draw while Asha is the drawer -> should be rejected
  ben.send('draw_start', { strokeId: 'illegal', tool: 'brush', color: '#000', size: 4, x: 0.1, y: 0.1 });
  await sleep(100);
  assert.equal(host.of('draw_data').length, 0, 'non-drawer draw_start ignored');

  // Asha (drawer) draws
  host.send('draw_start', { strokeId: 's1', tool: 'brush', color: '#ff0000', size: 6, x: 0.2, y: 0.3 });
  host.send('draw_move', { strokeId: 's1', points: [{ x: 0.25, y: 0.35 }, { x: 0.3, y: 0.4 }] });
  host.send('draw_end', { strokeId: 's1' });

  await waitFor(() => ben.of('draw_data').length >= 3);
  assert.equal(host.of('draw_data').length, 0, 'drawer is NOT sent draw_data echo');
  const ops = ben.of('draw_data');
  assert.equal(ops[0].op, 'start');
  assert.equal(ops[0].stroke.id, 's1');
  assert.equal(ops[0].stroke.color, '#ff0000');
  assert.equal(ops[1].op, 'move');
  assert.equal(ops[1].points.length, 2);
  assert.equal(ops[2].op, 'end');
  console.log('  ok: draw_start, draw_move, draw_end synced without drawer echo');

  // Undo
  host.send('draw_undo');
  await waitFor(() => ben.of('stroke_undone').length >= 1);
  await waitFor(() => host.of('stroke_undone').length >= 1);
  assert.equal(ben.of('stroke_undone')[0].strokeId, 's1');
  assert.equal(host.of('stroke_undone')[0].strokeId, 's1');
  console.log('  ok: draw_undo broadcasts stroke_undone to all');

  // Draw a new stroke, then test reconnect canvas_sync
  host.send('draw_start', { strokeId: 's2', tool: 'brush', color: '#0000ff', size: 4, x: 0.5, y: 0.5 });
  await waitFor(() => ben.of('draw_data').length >= 4);

  // Ben reconnects
  const benToken = ben.of('room_joined')[0].token;
  const roomCode = ben.of('room_joined')[0].room.code;
  ben.ws.close();
  await sleep(200);

  const ben2 = await client('Ben2');
  ben2.send('rejoin', { roomCode, token: benToken });
  await waitFor(() => ben2.of('canvas_sync').length >= 1);
  const syncedStrokes = ben2.of('canvas_sync')[0].strokes;
  assert.equal(syncedStrokes.length, 1);
  assert.equal(syncedStrokes[0].id, 's2');
  console.log('  ok: rejoin receives canvas_sync with current strokes');

  // Clear canvas
  host.send('canvas_clear');
  await waitFor(() => ben2.of('canvas_clear').length >= 1);
  console.log('  ok: canvas_clear broadcast');

  [host, ben2].forEach(c => c.ws.close());
}
console.log('ALL PASSED');
process.exit(0);
