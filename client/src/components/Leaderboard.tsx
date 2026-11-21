import React from 'react';
import { Crown, Pencil, CheckCircle2 } from 'lucide-react';
import { Avatar } from './Avatar';
import type { PublicPlayer } from '../types';

interface LeaderboardProps {
  players: PublicPlayer[];
  currentDrawerId: string | null;
  currentUserId: string | null;
  scores: Record<string, number>;
  guessedIds: string[];
  userAvatar?: any;
  onSelectPlayer?: (player: PublicPlayer) => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  players,
  currentDrawerId,
  currentUserId,
  scores,
  guessedIds,
  userAvatar,
  onSelectPlayer,
}) => {
  const sorted = [...players].sort((a, b) => (scores[b.id] ?? b.score) - (scores[a.id] ?? a.score));

  return (
    <div className="neo-card p-3 sm:p-4 h-full flex flex-col space-y-3 select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b-2 border-black">
        <span className="text-xs uppercase font-black tracking-wider text-black font-fun">
          Leaderboard
        </span>
        <span className="text-xs font-black text-black px-2 py-0.5 rounded-md border border-black bg-[#FACC15] shadow-[1px_1px_0px_#000] font-mono">
          {players.length} Players
        </span>
      </div>

      {/* Players list */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {sorted.map((player, idx) => {
          const isDrawer = player.id === currentDrawerId;
          const hasGuessed = guessedIds.includes(player.id);
          const isSelf = player.id === currentUserId;
          const score = scores[player.id] ?? player.score;

          // Rank styling badges
          const rankColors = [
            'bg-[#FACC15] text-black', // 1st Gold
            'bg-[#E2E8F0] text-black', // 2nd Silver
            'bg-[#FB923C] text-white', // 3rd Bronze
          ];
          const rankBadge = rankColors[idx] || 'bg-slate-100 text-slate-600';

          return (
            <div
              key={player.id}
              onClick={() => onSelectPlayer && onSelectPlayer(player)}
              className={`flex items-center justify-between p-2.5 rounded-xl border-2 border-black transition-all shadow-[2px_2px_0px_#000] cursor-pointer hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#000] ${
                isSelf
                  ? 'bg-[#EDE9FE]'
                  : hasGuessed
                  ? 'bg-[#D1FAE5]'
                  : 'bg-white hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center space-x-2.5 truncate">
                <span className={`text-[11px] font-mono font-black w-5 h-5 rounded flex items-center justify-center border border-black ${rankBadge}`}>
                  #{idx + 1}
                </span>

                <div className="p-0.5 rounded-full border border-black bg-white">
                  <Avatar config={isSelf ? (userAvatar || player.avatar) : player.avatar} size="sm" />
                </div>

                <div className="truncate text-left font-fun">
                  <div className="flex items-center space-x-1">
                    <span className="font-black text-xs text-black truncate">
                      {player.name}
                    </span>
                    {player.isHost && (
                      <span title="Host">
                        <Crown size={12} className="text-[#FACC15] fill-[#FACC15] stroke-black stroke-[1.5] shrink-0" />
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] font-black text-black font-mono">
                    {score} pts
                  </div>
                </div>
              </div>

              {/* Status Icons */}
              <div className="flex items-center space-x-1 shrink-0">
                {isDrawer && (
                  <span className="p-1 rounded-lg border border-black bg-[#FACC15] text-black shadow-[1px_1px_0px_#000] animate-bounce" title="Drawing Now">
                    <Pencil size={13} className="stroke-[2.5]" />
                  </span>
                )}
                {hasGuessed && !isDrawer && (
                  <span className="p-1 rounded-lg border border-black bg-[#10B981] text-black shadow-[1px_1px_0px_#000]" title="Guessed correctly">
                    <CheckCircle2 size={14} className="stroke-[2.5]" />
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
