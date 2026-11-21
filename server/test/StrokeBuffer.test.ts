import test from 'node:test';
import assert from 'node:assert/strict';
import { StrokeBuffer, MAX_STROKES_PER_TURN } from '../src/StrokeBuffer.js';

test('StrokeBuffer: starts empty', () => {
  const sb = new StrokeBuffer();
  assert.equal(sb.count, 0);
  assert.deepEqual(sb.snapshot(), []);
});

test('StrokeBuffer: records strokes and points', () => {
  const sb = new StrokeBuffer();
  const s = sb.addStart('s1', 'brush', '#ff0000', 5, { x: 0.1, y: 0.2 });
  assert.ok(s);
  assert.equal(sb.count, 1);
  assert.equal(s.id, 's1');
  assert.equal(s.color, '#ff0000');
  assert.equal(s.size, 5);
  assert.equal(s.tool, 'brush');
  assert.deepEqual(s.points, [{ x: 0.1, y: 0.2 }]);

  const ok = sb.addPoints('s1', [{ x: 0.2, y: 0.3 }, { x: 0.3, y: 0.4 }]);
  assert.ok(ok);
  assert.equal(sb.snapshot()[0].points.length, 3);
});

test('StrokeBuffer: undo removes the last stroke and returns it', () => {
  const sb = new StrokeBuffer();
  sb.addStart('s1', 'brush', '#000', 4, { x: 0, y: 0 });
  sb.addStart('s2', 'eraser', '#fff', 10, { x: 0.5, y: 0.5 });
  assert.equal(sb.count, 2);

  const undone = sb.undo();
  assert.equal(undone?.id, 's2');
  assert.equal(sb.count, 1);
  assert.equal(sb.snapshot()[0].id, 's1');

  const undone2 = sb.undo();
  assert.equal(undone2?.id, 's1');
  assert.equal(sb.count, 0);

  const undone3 = sb.undo();
  assert.equal(undone3, undefined);
});

test('StrokeBuffer: clear wipes all strokes', () => {
  const sb = new StrokeBuffer();
  sb.addStart('s1', 'brush', '#000', 4, { x: 0, y: 0 });
  sb.addStart('s2', 'brush', '#111', 4, { x: 0, y: 0 });
  assert.equal(sb.count, 2);
  sb.clear();
  assert.equal(sb.count, 0);
  assert.deepEqual(sb.snapshot(), []);
});

test('StrokeBuffer: clamps to MAX_STROKES_PER_TURN', () => {
  const sb = new StrokeBuffer();
  for (let i = 0; i < MAX_STROKES_PER_TURN; i++) {
    const s = sb.addStart(`s${i}`, 'brush', '#000', 2, { x: 0, y: 0 });
    assert.ok(s);
  }
  assert.equal(sb.count, MAX_STROKES_PER_TURN);
  const overflow = sb.addStart('overflow', 'brush', '#000', 2, { x: 0, y: 0 });
  assert.equal(overflow, null);
  assert.equal(sb.count, MAX_STROKES_PER_TURN);
});
