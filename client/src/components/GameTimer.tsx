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
    <div className="neo-card p-3 sm:p-3.5 flex flex-wrap items-center justify-between gap-3 select-none">
      {/* Left: Clock Countdown Timer & Round Badge */}
      <div className="flex items-center space-x-2 shrink-0">
        <div
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border-2 border-black font-fun font-black text-sm shadow-[2px_2px_0px_#000] transition-colors ${
            isTimeCritical
              ? 'bg-[#F43F5E] text-white animate-pulse'
              : 'bg-[#FACC15] text-black'
          }`}
        >
          <Clock size={16} className={isTimeCritical ? 'text-white' : 'text-black stroke-[2.5]'} />
          <span className="font-mono text-base font-black w-6 text-center">{timeLeft}</span>
        </div>

        {/* Round Badge */}
        <div className="flex items-center space-x-1 px-3 py-1.5 rounded-xl border-2 border-black bg-[#8B5CF6] text-white text-xs font-fun font-black shadow-[2px_2px_0px_#000]">
          <span className="uppercase tracking-wider">Round</span>
          <span className="font-black">{round}</span>
          <span>/</span>
          <span>{totalRounds}</span>
        </div>
      </div>

      {/* Center: Secret Word (Drawer/Guessed) OR Hints Tiles (Guessers) */}
      <div className="flex-1 flex items-center justify-center truncate px-2">
        {isDrawer || hasGuessed ? (
          <div className="flex items-center space-x-2 text-sm sm:text-base font-fun font-black text-black bg-[#10B981] px-4 py-1.5 rounded-xl border-2 border-black shadow-[2px_2px_0px_#000]">
            <Eye size={17} className="text-black shrink-0 stroke-[2.5]" />
            <span className="tracking-widest uppercase font-black">
              {drawerWord || '...'}
            </span>
            {hasGuessed && !isDrawer && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded border border-black bg-white text-black uppercase shadow-[1px_1px_0px_#000]">
                GUESSED!
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center space-x-2 overflow-x-auto py-1">
            <div className="flex items-center space-x-1.5">
              {tokens.length > 0 ? (
                tokens.map((char, idx) => (
                  <span
                    key={idx}
                    className={`inline-flex items-center justify-center w-7 h-9 sm:w-8 sm:h-10 rounded-lg border-2 border-black font-fun font-black text-base sm:text-lg shadow-[2px_2px_0px_#000] uppercase ${
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
              <span className="text-xs font-black text-black font-mono ml-1 px-2 py-1 rounded-md border border-black bg-white shadow-[1px_1px_0px_#000]">
                {tokens.filter((t) => t !== ' ').length}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Right: Actions & Brand */}
      <div className="flex items-center space-x-2">
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
            <span className="font-fun hidden sm:inline">LEAVE</span>
          </button>
        )}
      </div>
    </div>
  );
};
