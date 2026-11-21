import React from 'react';
import { Paintbrush, Eraser, Undo2, Trash2 } from 'lucide-react';
import type { Tool } from '../types';

export const PALETTE_COLORS = [
  '#000000', // Black
  '#52525B', // Dark Grey
  '#A1A1AA', // Light Grey
  '#FFFFFF', // White
  '#EF4444', // Red
  '#F97316', // Orange
  '#FACC15', // Yellow
  '#10B981', // Emerald Green
  '#84CC16', // Lime
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
  '#8B5CF6', // Purple / Violet
  '#EC4899', // Pink
  '#78350F', // Brown
];

export const BRUSH_SIZES = [
  { label: 'S', size: 3 },
  { label: 'M', size: 7 },
  { label: 'L', size: 14 },
  { label: 'XL', size: 26 },
];

interface ToolbarProps {
  tool: Tool;
  color: string;
  size: number;
  onToolChange: (tool: Tool) => void;
  onColorChange: (color: string) => void;
  onSizeChange: (size: number) => void;
  onUndo: () => void;
  onClear: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  tool,
  color,
  size,
  onToolChange,
  onColorChange,
  onSizeChange,
  onUndo,
  onClear,
}) => {
  return (
    <div className="neo-card p-2 sm:p-2.5 flex flex-wrap items-center justify-between gap-2.5 select-none">
      {/* Primary Tool Switchers */}
      <div className="flex items-center space-x-1.5 p-1 rounded-xl border-2 border-black bg-white shadow-[2px_2px_0px_#000]">
        <button
          onClick={() => onToolChange('brush')}
          type="button"
          title="Freehand Brush"
          className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-fun font-black transition-all cursor-pointer border border-transparent ${
            tool === 'brush'
              ? 'bg-[#8B5CF6] text-white border-black shadow-[1px_1px_0px_#000]'
              : 'text-black hover:bg-slate-100'
          }`}
        >
          <Paintbrush size={14} className="stroke-[2.5]" />
          <span>Brush</span>
        </button>

        <button
          onClick={() => onToolChange('eraser')}
          type="button"
          title="Eraser"
          className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-fun font-black transition-all cursor-pointer border border-transparent ${
            tool === 'eraser'
              ? 'bg-[#F43F5E] text-white border-black shadow-[1px_1px_0px_#000]'
              : 'text-black hover:bg-slate-100'
          }`}
        >
          <Eraser size={14} className="stroke-[2.5]" />
          <span>Eraser</span>
        </button>
      </div>

      {/* 14-Color Swatches */}
      <div className="flex items-center space-x-1 p-1 rounded-xl border-2 border-black bg-white shadow-[2px_2px_0px_#000] overflow-x-auto">
        {PALETTE_COLORS.map((c) => {
          const isSelected = tool === 'brush' && color.toLowerCase() === c.toLowerCase();
          return (
            <button
              key={c}
              type="button"
              onClick={() => {
                onColorChange(c);
                if (tool === 'eraser') onToolChange('brush');
              }}
              title={c}
              className={`w-6 h-6 rounded-md border-2 border-black transition-all cursor-pointer ${
                isSelected
                  ? 'scale-125 -translate-y-1 shadow-[2px_2px_0px_#000] z-10 ring-1 ring-black'
                  : 'hover:scale-110 opacity-90 hover:opacity-100'
              }`}
              style={{ backgroundColor: c }}
            />
          );
        })}
      </div>

      {/* Brush Sizes */}
      <div className="flex items-center space-x-1 p-1 rounded-xl border-2 border-black bg-white shadow-[2px_2px_0px_#000]">
        {BRUSH_SIZES.map((b) => (
          <button
            key={b.label}
            type="button"
            onClick={() => onSizeChange(b.size)}
            className={`w-7 h-7 rounded-lg text-xs font-fun font-black flex items-center justify-center transition-all cursor-pointer border border-transparent ${
              size === b.size
                ? 'bg-[#06B6D4] text-black border-black shadow-[1px_1px_0px_#000]'
                : 'text-black hover:bg-slate-100'
            }`}
            title={`Size ${b.label} (${b.size}px)`}
          >
            {b.label}
          </button>
        ))}
      </div>

      {/* Canvas Actions: Undo & Clear */}
      <div className="flex items-center space-x-1.5">
        <button
          onClick={onUndo}
          type="button"
          title="Undo Last Stroke"
          className="neo-btn neo-btn-white flex items-center space-x-1 px-3 py-1.5 text-xs font-fun"
        >
          <Undo2 size={14} className="stroke-[2.5]" />
          <span>Undo</span>
        </button>

        <button
          onClick={onClear}
          type="button"
          title="Clear Entire Canvas"
          className="neo-btn neo-btn-pink flex items-center space-x-1 px-3 py-1.5 text-xs font-fun"
        >
          <Trash2 size={14} className="stroke-[2.5]" />
          <span>Clear</span>
        </button>
      </div>
    </div>
  );
};
