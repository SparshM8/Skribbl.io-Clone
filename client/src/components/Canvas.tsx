import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { Point, Stroke, Tool } from '../types';

const LOGICAL_WIDTH = 800;
const LOGICAL_HEIGHT = 600;

interface CanvasProps {
  isDrawer: boolean;
  strokes: Stroke[];
  tool: Tool;
  color: string;
  size: number;
  onDrawStart: (strokeId: string, tool: Tool, color: string, size: number, x: number, y: number) => void;
  onDrawMove: (strokeId: string, points: Point[]) => void;
  onDrawEnd: (strokeId: string) => void;
  onLocalStrokeAdd: (stroke: Stroke) => void;
  onLocalPointsAppend: (strokeId: string, points: Point[]) => void;
}

export const Canvas: React.FC<CanvasProps> = ({
  isDrawer,
  strokes,
  tool,
  color,
  size,
  onDrawStart,
  onDrawMove,
  onDrawEnd,
  onLocalStrokeAdd,
  onLocalPointsAppend,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const currentStrokeIdRef = useRef<string | null>(null);
  const pendingPointsRef = useRef<Point[]>([]);
  const flushTimerRef = useRef<any>(null);

  // Helper to draw a single stroke onto context with smooth curves
  const renderStroke = useCallback((ctx: CanvasRenderingContext2D, stroke: Stroke) => {
    if (!stroke.points || stroke.points.length === 0) return;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = stroke.size;
    ctx.strokeStyle = stroke.tool === 'eraser' ? '#ffffff' : stroke.color;

    const points = stroke.points;
    if (points.length === 1) {
      // Single point: draw a solid dot
      const pt = points[0];
      ctx.beginPath();
      ctx.arc(pt.x * LOGICAL_WIDTH, pt.y * LOGICAL_HEIGHT, stroke.size / 2, 0, Math.PI * 2);
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fill();
    } else {
      // Multiple points: quadratic curve interpolation through midpoints for silky smooth lines
      ctx.beginPath();
      ctx.moveTo(points[0].x * LOGICAL_WIDTH, points[0].y * LOGICAL_HEIGHT);

      for (let i = 1; i < points.length - 1; i++) {
        const xc = ((points[i].x + points[i + 1].x) / 2) * LOGICAL_WIDTH;
        const yc = ((points[i].y + points[i + 1].y) / 2) * LOGICAL_HEIGHT;
        ctx.quadraticCurveTo(points[i].x * LOGICAL_WIDTH, points[i].y * LOGICAL_HEIGHT, xc, yc);
      }

      // Final segment to last point
      const last = points[points.length - 1];
      ctx.lineTo(last.x * LOGICAL_WIDTH, last.y * LOGICAL_HEIGHT);
      ctx.stroke();
    }

    ctx.restore();
  }, []);

  // Redraw entire canvas whenever strokes array changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear background to white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

    // Render all committed strokes
    for (const stroke of strokes) {
      renderStroke(ctx, stroke);
    }
  }, [strokes, renderStroke]);

  // Flush throttled pointermove points to parent and server
  const flushPendingPoints = useCallback(() => {
    const strokeId = currentStrokeIdRef.current;
    if (!strokeId || pendingPointsRef.current.length === 0) return;

    const batch = [...pendingPointsRef.current];
    pendingPointsRef.current = [];

    onLocalPointsAppend(strokeId, batch);
    onDrawMove(strokeId, batch);
  }, [onDrawMove, onLocalPointsAppend]);

  // Convert client pointer event coordinates to normalized [0, 1] canvas coordinates
  const getNormalizedPoint = (e: React.PointerEvent<HTMLCanvasElement>): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const x = Math.max(0, Math.min(1, clientX / rect.width));
    const y = Math.max(0, Math.min(1, clientY / rect.height));

    return {
      x: Number(x.toFixed(4)),
      y: Number(y.toFixed(4)),
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawer) return;
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}

    const pt = getNormalizedPoint(e);
    if (!pt) return;

    const strokeId = `st_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    currentStrokeIdRef.current = strokeId;
    setIsDrawing(true);
    pendingPointsRef.current = [];

    const newStroke: Stroke = {
      id: strokeId,
      tool,
      color,
      size,
      points: [pt],
    };

    // Render immediately locally
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) renderStroke(ctx, newStroke);
    }

    onLocalStrokeAdd(newStroke);
    onDrawStart(strokeId, tool, color, size, pt.x, pt.y);

    if (!flushTimerRef.current) {
      flushTimerRef.current = setInterval(flushPendingPoints, 35);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawer || !isDrawing || !currentStrokeIdRef.current) return;
    const pt = getNormalizedPoint(e);
    if (!pt) return;

    pendingPointsRef.current.push(pt);

    // If buffer gets large, flush immediately
    if (pendingPointsRef.current.length >= 20) {
      flushPendingPoints();
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawer || !isDrawing) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    if (flushTimerRef.current) {
      clearInterval(flushTimerRef.current);
      flushTimerRef.current = null;
    }

    flushPendingPoints();

    if (currentStrokeIdRef.current) {
      onDrawEnd(currentStrokeIdRef.current);
      currentStrokeIdRef.current = null;
    }
    setIsDrawing(false);
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center p-2 bg-white rounded-2xl border-[3px] border-black shadow-[6px_6px_0px_#000] overflow-hidden select-none">
      <canvas
        ref={canvasRef}
        width={LOGICAL_WIDTH}
        height={LOGICAL_HEIGHT}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ touchAction: 'none' }}
        className={`w-full h-auto max-h-full aspect-[4/3] rounded-xl border-2 border-black bg-white ${
          isDrawer ? 'cursor-crosshair' : 'cursor-default'
        }`}
      />
    </div>
  );
};
