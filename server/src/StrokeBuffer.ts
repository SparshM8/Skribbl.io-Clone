import type { Point, Stroke, Tool } from './types.js';

export const MAX_STROKES_PER_TURN = 500;
export const MAX_POINTS_PER_MOVE = 100;

export class StrokeBuffer {
  private strokes: Stroke[] = [];

  get count(): number {
    return this.strokes.length;
  }

  addStart(id: string, tool: Tool, color: string, size: number, startPoint: Point): Stroke | null {
    if (this.strokes.length >= MAX_STROKES_PER_TURN) return null;
    const stroke: Stroke = {
      id,
      tool,
      color,
      size,
      points: [startPoint],
    };
    this.strokes.push(stroke);
    return stroke;
  }

  addPoints(strokeId: string, points: Point[]): boolean {
    const stroke = this.strokes.find(s => s.id === strokeId) ?? this.strokes[this.strokes.length - 1];
    if (!stroke || stroke.id !== strokeId) return false;
    stroke.points.push(...points);
    return true;
  }

  undo(): Stroke | undefined {
    return this.strokes.pop();
  }

  clear(): void {
    this.strokes = [];
  }

  snapshot(): Stroke[] {
    return this.strokes.map(s => ({
      ...s,
      points: [...s.points],
    }));
  }
}
