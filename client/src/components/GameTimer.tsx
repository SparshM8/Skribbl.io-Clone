import React, { useEffect, useState } from 'react';
import { Clock, Eye, Sparkles, LogOut } from 'lucide-react';

interface GameTimerProps {
  round: number;
  totalRounds: number;
  endsAt: number;
  hints: string;
  isDrawer: boolean;
  drawerWord?: string | null;
  hasGuessed?: boolean;
  onLeave?: () => void;
}

export const GameTimer: React.FC<GameTimerProps> = ({
  round,
  totalRounds,
  endsAt,
  hints,
  isDrawer,
  drawerWord,
  hasGuessed,
  onLeave,
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const update = () => {
      const remaining = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      setTimeLeft(remaining);
    };

    update();
    const interval = setInterval(update, 250);
    return () => clearInterval(interval);
  }, [endsAt]);

  const tokens = hints ? hints.split(' ') : [];
  const isTimeCritical = timeLeft <= 10 && timeLeft > 0;

  return (
    <div className="neo-card p-2 sm:p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 select-none">
      {/* Top Row on mobile / Left group on desktop */}
      <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto space-x-2 shrink-0">
        <div className="flex items-center space-x-2">
          {/* Clock Countdown Timer */}
          <div
            className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border-2 border-black font-fun font-black text-xs sm:text-sm shadow-[2px_2px_0px_#000] transition-colors ${
              isTimeCritical
                ? 'bg-[#F43F5E] text-white animate-pulse'
                : 'bg-[#FACC15] text-black'
            }`}
          >
            <Clock size={15} className={isTimeCritical ? 'text-white' : 'text-black stroke-[2.5]'} />
            <span className="font-mono text-sm sm:text-base font-black w-5 sm:w-6 text-center">{timeLeft}</span>
          </div>

          {/* Round Badge */}
          <div className="flex items-center space-x-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border-2 border-black bg-[#8B5CF6] text-white text-[11px] sm:text-xs font-fun font-black shadow-[2px_2px_0px_#000]">
            <span className="uppercase tracking-wider">Round</span>
            <span className="font-black">{round}</span>
            <span>/</span>
            <span>{totalRounds}</span>
          </div>
        </div>

        {/* Mobile Leave Button (visible on mobile only, in the top row) */}
        {onLeave && (
          <button
            type="button"
            onClick={onLeave}
            className="sm:hidden neo-btn neo-btn-white text-xs px-2.5 py-1 flex items-center space-x-1 hover:bg-rose-50 hover:text-rose-600 transition-colors"
            title="Leave Match"
          >
            <LogOut size={14} className="stroke-[2.5]" />
            <span className="text-[10px] font-fun font-bold">LEAVE</span>
          </button>
        )}
      </div>

      {/* Center: Secret Word (Drawer/Guessed) OR Hints Tiles (Guessers) */}
      <div className="w-full sm:flex-1 flex items-center justify-center py-0.5 sm:py-0 overflow-x-auto">
        {isDrawer || hasGuessed ? (
          <div className="flex items-center space-x-2 text-xs sm:text-base font-fun font-black text-black bg-[#10B981] px-3 sm:px-4 py-1 sm:py-1.5 rounded-xl border-2 border-black shadow-[2px_2px_0px_#000]">
            <Eye size={15} className="text-black shrink-0 stroke-[2.5]" />
            <span className="tracking-widest uppercase font-black">
              {drawerWord || '...'}
            </span>
            {hasGuessed && !isDrawer && (
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded border border-black bg-white text-black uppercase shadow-[1px_1px_0px_#000]">
                GUESSED!
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center space-x-1.5 sm:space-x-2 overflow-x-auto max-w-full py-0.5">
            <div className="flex items-center space-x-1 sm:space-x-1.5 shrink-0">
              {tokens.length > 0 ? (
                tokens.map((char, idx) => (
                  <span
                    key={idx}
                    className={`inline-flex items-center justify-center min-w-[1.65rem] h-8 sm:min-w-[2rem] sm:h-10 px-1 rounded-lg border-2 border-black font-fun font-black text-sm sm:text-lg shadow-[2px_2px_0px_#000] uppercase ${
                      char === '_'
                        ? 'bg-white border-dashed text-transparent'
                        : 'bg-[#06B6D4] text-black'
                    }`}
                  >
                    {char === '_' ? ' ' : char}
                  </span>
                ))
              ) : (
                <span className="text-slate-500 text-xs font-black font-fun uppercase tracking-wider">
                  Waiting for drawer to start...
                </span>
              )}
            </div>
            {hints && (
              <span className="text-xs font-black text-black font-mono px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md border border-black bg-white shadow-[1px_1px_0px_#000] shrink-0">
                {tokens.filter((t) => t !== ' ').length}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Right: Actions & Brand (Desktop only) */}
      <div className="hidden sm:flex items-center space-x-2 shrink-0">
        <div className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border-2 border-black bg-white text-xs font-fun font-black shadow-[2px_2px_0px_#000]">
          <Sparkles size={14} className="text-[#8B5CF6]" />
          <span>skribbl.io</span>
        </div>

        {onLeave && (
          <button
            type="button"
            onClick={onLeave}
            className="neo-btn neo-btn-white text-xs px-2.5 sm:px-3 py-1.5 flex items-center space-x-1.5 hover:bg-rose-50 hover:text-rose-600 transition-colors"
            title="Leave Match & Return to Home"
          >
            <LogOut size={14} className="stroke-[2.5]" />
            <span className="font-fun">LEAVE</span>
          </button>
        )}
      </div>
    </div>
  );
};
