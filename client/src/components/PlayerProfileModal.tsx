import React from 'react';
import {
  X,
  UserX,
  Volume2,
  VolumeX,
  ThumbsUp,
  Vote,
  Crown,
  Shirt,
} from 'lucide-react';
import { Avatar } from './Avatar';
import type { PublicPlayer } from '../types';

interface PlayerProfileModalProps {
  player: PublicPlayer | null;
  isSelf: boolean;
  isHost: boolean;
  isMuted: boolean;
  kickVotes?: { votes: number; needed: number };
  onClose: () => void;
  onKick: (playerId: string) => void;
  onVoteKick: (playerId: string) => void;
  onToggleMute: (playerId: string) => void;
  onSendKudos?: (playerName: string) => void;
  onOpenWardrobe?: () => void;
}

export const PlayerProfileModal: React.FC<PlayerProfileModalProps> = ({
  player,
  isSelf,
  isHost,
  isMuted,
  kickVotes,
  onClose,
  onKick,
  onVoteKick,
  onToggleMute,
  onSendKudos,
  onOpenWardrobe,
}) => {
  if (!player) return null;

  const votesCount = kickVotes?.votes ?? 0;
  const neededCount = kickVotes?.needed ?? 2;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="neo-card-lg p-5 sm:p-6 max-w-md w-full bg-white border-[3px] border-black shadow-[6px_6px_0px_#000] space-y-4 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-black pb-3">
          <div className="flex items-center space-x-2 truncate">
            <h3 className="text-lg sm:text-xl font-fun font-black text-black truncate">
              {player.name}
            </h3>
            {player.isHost && (
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md border border-black bg-[#FACC15] text-black text-[10px] font-black font-fun shadow-[1px_1px_0px_#000]">
                <Crown size={12} className="fill-[#FACC15] stroke-black stroke-[1.5]" />
                <span>HOST</span>
              </span>
            )}
            {isSelf && (
              <span className="px-2 py-0.5 rounded-md border border-black bg-[#8B5CF6] text-white text-[10px] font-black font-fun shadow-[1px_1px_0px_#000]">
                YOU
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl border-2 border-black bg-white hover:bg-slate-100 text-black shadow-[2px_2px_0px_#000] cursor-pointer"
            title="Close"
          >
            <X size={18} className="stroke-[2.5]" />
          </button>
        </div>

        {/* Modal Body: Left Avatar Preview + Right Action Column (Matching skribbl.io layout!) */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
          {/* Avatar Showcase */}
          <div className="sm:col-span-5 flex flex-col items-center justify-center p-3 rounded-2xl border-2 border-black bg-[#FBF8F3] shadow-[3px_3px_0px_#000]">
            <div className="p-2 rounded-full border-2 border-black bg-white shadow-[2px_2px_0px_#000] mb-2">
              <Avatar config={player.avatar} size="xl" animate />
            </div>
            <div className="text-center font-fun">
              <div className="text-xs font-black text-black">{player.score} pts</div>
              <div className="text-[10px] font-bold text-slate-500 uppercase">
                {player.connected ? 'Online' : 'Disconnected'}
              </div>
            </div>
          </div>

          {/* Action Buttons Column */}
          <div className="sm:col-span-7 flex flex-col space-y-2.5">
            {!isSelf ? (
              <>
                {/* 1. Host Instant Kick OR Guest Votekick */}
                {isHost ? (
                  <button
                    type="button"
                    onClick={() => {
                      onKick(player.id);
                      onClose();
                    }}
                    className="w-full py-2.5 px-3 neo-btn bg-[#F43F5E] hover:bg-[#E11D48] text-white text-xs sm:text-sm flex items-center justify-center space-x-2"
                  >
                    <UserX size={16} className="stroke-[2.5]" />
                    <span>KICK PLAYER (HOST)</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onVoteKick(player.id)}
                    className="w-full py-2.5 px-3 neo-btn neo-btn-yellow text-xs sm:text-sm flex items-center justify-center space-x-2"
                  >
                    <Vote size={16} className="stroke-[2.5]" />
                    <span>
                      VOTEKICK {votesCount > 0 ? `(${votesCount}/${neededCount})` : ''}
                    </span>
                  </button>
                )}

                {/* 2. Mute / Unmute Player */}
                <button
                  type="button"
                  onClick={() => onToggleMute(player.id)}
                  className={`w-full py-2.5 px-3 neo-btn text-xs sm:text-sm flex items-center justify-center space-x-2 ${
                    isMuted
                      ? 'bg-[#EDE9FE] text-[#6D28D9] border-black shadow-[2px_2px_0px_#000]'
                      : 'neo-btn-white'
                  }`}
                >
                  {isMuted ? (
                    <>
                      <Volume2 size={16} className="stroke-[2.5]" />
                      <span>UNMUTE CHAT</span>
                    </>
                  ) : (
                    <>
                      <VolumeX size={16} className="stroke-[2.5]" />
                      <span>MUTE PLAYER</span>
                    </>
                  )}
                </button>

                {/* 3. Send Kudos / Thumbs Up Reaction */}
                {onSendKudos && (
                  <button
                    type="button"
                    onClick={() => {
                      onSendKudos(player.name);
                      onClose();
                    }}
                    className="w-full py-2.5 px-3 neo-btn neo-btn-cyan text-xs sm:text-sm flex items-center justify-center space-x-2"
                  >
                    <ThumbsUp size={16} className="stroke-[2.5]" />
                    <span>GIVE THUMBS UP 👍</span>
                  </button>
                )}
              </>
            ) : (
              /* If clicked on self */
              <div className="space-y-2.5 text-center sm:text-left">
                <div className="p-3 rounded-xl border border-black bg-slate-50 text-xs font-bold text-slate-700 font-fun">
                  This is your character. You can customize your style and wardrobe anytime!
                </div>
                {onOpenWardrobe && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenWardrobe();
                    }}
                    className="w-full py-3 px-3 neo-btn neo-btn-violet text-xs sm:text-sm flex items-center justify-center space-x-2"
                  >
                    <Shirt size={16} className="stroke-[2.5]" />
                    <span>CHANGE OUTFIT</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
