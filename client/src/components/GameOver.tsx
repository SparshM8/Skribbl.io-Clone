import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw } from 'lucide-react';
import type { GameOverData } from '../types';
import { Avatar } from './Avatar';

interface GameOverProps {
  data: GameOverData;
  isHost: boolean;
  onPlayAgain: () => void;
}

export const GameOver: React.FC<GameOverProps> = ({ data, isHost, onPlayAgain }) => {
  useEffect(() => {
    // Fireworks confetti effect
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  const sorted = data.leaderboard;
  const top1 = sorted[0];
  const top2 = sorted[1];
  const top3 = sorted[2];

  return (
    <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="neo-card-lg p-6 sm:p-8 max-w-lg w-full text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
        <div className="space-y-1">
          <div className="w-14 h-14 rounded-2xl border-2 border-black bg-[#FACC15] flex items-center justify-center mx-auto shadow-[3px_3px_0px_#000]">
            <Trophy className="w-8 h-8 text-black stroke-[2.5]" />
          </div>
          <h1 className="text-3xl font-black font-fun text-black">Game Over!</h1>
          <p className="text-xs font-bold text-slate-600">Final scores &amp; podium winners</p>
        </div>

        {/* Podium (Top 3) */}
        <div className="flex items-end justify-center gap-3 pt-4 pb-2">
          {/* 2nd place */}
          {top2 && (
            <div className="flex flex-col items-center">
              <div className="p-1 rounded-full border-2 border-black bg-white shadow-[2px_2px_0px_#000] mb-1">
                <Avatar config={top2.avatar} size="lg" />
              </div>
              <span className="text-xs font-black text-black truncate max-w-[80px] font-fun">{top2.name}</span>
              <span className="text-[11px] font-black text-black font-mono">{top2.score} pts</span>
              <div className="w-20 h-20 bg-[#06B6D4] rounded-t-xl border-t-[3px] border-x-[3px] border-black flex items-center justify-center font-black text-black text-lg mt-1 font-fun shadow-[3px_0px_0px_#000]">
                2nd
              </div>
            </div>
          )}

          {/* 1st place */}
          {top1 && (
            <div className="flex flex-col items-center">
              <span className="text-xs font-black text-black uppercase tracking-widest mb-0.5 font-fun px-2 py-0.5 rounded border border-black bg-[#FACC15] shadow-[1px_1px_0px_#000]">
                WINNER
              </span>
              <div className="p-1 rounded-full border-[3px] border-black bg-white shadow-[3px_3px_0px_#000] mb-1">
                <Avatar config={top1.avatar} size="xl" />
              </div>
              <span className="text-sm font-black text-black truncate max-w-[90px] font-fun">{top1.name}</span>
              <span className="text-xs font-black text-black font-mono">{top1.score} pts</span>
              <div className="w-24 h-28 bg-[#FACC15] border-t-[3px] border-x-[3px] border-black rounded-t-xl flex items-center justify-center font-black text-black text-2xl mt-1 font-fun shadow-[3px_0px_0px_#000]">
                1st
              </div>
            </div>
          )}

          {/* 3rd place */}
          {top3 && (
            <div className="flex flex-col items-center">
              <div className="p-1 rounded-full border-2 border-black bg-white shadow-[2px_2px_0px_#000] mb-1">
                <Avatar config={top3.avatar} size="lg" />
              </div>
              <span className="text-xs font-black text-black truncate max-w-[80px] font-fun">{top3.name}</span>
              <span className="text-[11px] font-black text-black font-mono">{top3.score} pts</span>
              <div className="w-20 h-16 bg-[#10B981] rounded-t-xl border-t-[3px] border-x-[3px] border-black flex items-center justify-center font-black text-black text-lg mt-1 font-fun shadow-[3px_0px_0px_#000]">
                3rd
              </div>
            </div>
          )}
        </div>

        {/* Full Leaderboard */}
        <div className="bg-white rounded-xl p-3 border-2 border-black shadow-[2px_2px_0px_#000] max-h-40 overflow-y-auto space-y-1.5">
          {sorted.map((p, idx) => (
            <div key={p.id} className="flex items-center justify-between text-xs py-1.5 px-3 rounded-lg border border-black bg-slate-50 font-fun font-bold">
              <div className="flex items-center space-x-2">
                <span className="font-black text-black w-4 font-mono">#{idx + 1}</span>
                <span className="text-black">{p.name}</span>
              </div>
              <span className="font-mono font-black text-black">{p.score} pts</span>
            </div>
          ))}
        </div>

        {/* Action Button */}
        {isHost ? (
          <button
            type="button"
            onClick={onPlayAgain}
            className="w-full py-4 neo-btn neo-btn-violet text-base flex items-center justify-center space-x-2"
          >
            <RotateCcw size={18} className="stroke-[2.5]" />
            <span>PLAY AGAIN (RESET ROOM)</span>
          </button>
        ) : (
          <div className="text-xs font-bold text-slate-600 font-fun">
            Waiting for host to restart match...
          </div>
        )}
      </div>
    </div>
  );
};
