import React, { useState } from 'react';
import { Crown, Copy, Check, Play, Users, Clock, RotateCcw, Sparkles, CheckCircle2, Shirt, LogOut, ArrowLeft, Share2 } from 'lucide-react';
import { useGame } from '../store/useGame';
import { Avatar } from '../components/Avatar';
import { CharacterStudio } from '../components/CharacterStudio';
import { PlayerProfileModal } from '../components/PlayerProfileModal';
import type { PublicPlayer } from '../types';

export const Lobby: React.FC = () => {
  const {
    room,
    youId,
    setReady,
    startGame,
    avatar,
    setAvatar,
    leaveRoom,
    mutedPlayerIds,
    kickVotes,
    kickPlayer,
    voteKick,
    toggleMutePlayer,
  } = useGame();
  const [copied, setCopied] = useState(false);
  const [showWardrobe, setShowWardrobe] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<PublicPlayer | null>(null);

  if (!room) return null;

  const isHost = room.hostId === youId;
  const you = room.players.find((p) => p.id === youId);
  const hostPlayer = room.players.find((p) => p.id === room.hostId);
  const canStart = room.players.length >= 2 && room.players.filter((p) => p.id !== room.hostId).every((p) => p.ready);

  const inviteUrl = `${window.location.origin}/?room=${room.code}`;

  const copyInviteLink = async () => {
    let success = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(inviteUrl);
        success = true;
      }
    } catch {}

    if (!success) {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = inviteUrl;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        success = document.execCommand('copy');
        document.body.removeChild(textarea);
      } catch {}
    }

    if (!success) {
      window.prompt('Copy room invite link:', inviteUrl);
      success = true;
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareInviteLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Skribbl.io Clone',
          text: `Join my Skribbl.io match! Room code: #${room.code}`,
          url: inviteUrl,
        });
        return;
      } catch (e: any) {
        if (e.name === 'AbortError') return;
      }
    }
    copyInviteLink();
  };

  const emptySlotsCount = Math.max(0, Math.min(room.settings.maxPlayers - room.players.length, 6));

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 py-4 px-4">
      {/* Top Navigation: Leave Room to Home */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={leaveRoom}
          className="neo-btn neo-btn-white inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-fun hover:bg-rose-50 hover:text-rose-600 transition-colors"
          title="Leave Room & Return to Home"
        >
          <ArrowLeft size={15} className="stroke-[2.5]" />
          <span>LEAVE ROOM &amp; HOME</span>
        </button>
      </div>

      {/* Lobby Header Card */}
      <div className="neo-card-lg p-6 sm:p-7 space-y-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-2 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start space-x-2">
              <span className="text-xs font-black uppercase tracking-wider text-black font-fun">
                Room Code
              </span>
              <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full border border-black bg-[#8B5CF6] text-white shadow-[1px_1px_0px_#000] font-fun uppercase">
                Private Match
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="text-3xl sm:text-4xl font-mono font-black tracking-widest px-3 py-1 rounded-xl bg-[#FACC15] text-black border-[2.5px] border-black shadow-[3px_3px_0px_#000]">
                #{room.code}
              </span>
              <button
                onClick={shareInviteLink}
                className="neo-btn bg-[#8B5CF6] text-white hover:bg-[#7C3AED] inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-fun"
                title="Share Invite via WhatsApp, Telegram, etc."
              >
                <Share2 size={15} className="stroke-[2.5]" />
                <span>SHARE INVITE</span>
              </button>
              <button
                onClick={copyInviteLink}
                className="neo-btn neo-btn-white inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-fun"
                title="Copy Room Link"
              >
                {copied ? <Check size={15} className="text-[#059669] stroke-[3]" /> : <Copy size={15} className="stroke-[2.5]" />}
                <span>{copied ? 'COPIED LINK!' : 'COPY LINK'}</span>
              </button>
            </div>
          </div>

          {/* Room Leader info card */}
          <div className="flex items-center space-x-3 p-3 rounded-2xl border-2 border-black bg-white shadow-[3px_3px_0px_#000]">
            <div className="p-1 rounded-full border-2 border-black bg-white shadow-[1px_1px_0px_#000]">
              <Avatar config={hostPlayer?.id === youId ? (avatar || hostPlayer?.avatar) : hostPlayer?.avatar} size="sm" />
            </div>
            <div className="text-left text-xs font-fun">
              <div className="text-slate-500 font-bold text-[10px] uppercase tracking-wider">Room Leader</div>
              <div className="font-black text-black flex items-center space-x-1.5 text-sm">
                <span>{hostPlayer?.name || 'Host'}</span>
                <Crown size={14} className="text-[#FACC15] fill-[#FACC15] stroke-black stroke-[2]" />
              </div>
            </div>
          </div>
        </div>

        {/* Match Settings Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2 text-xs text-black font-fun">
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border-2 border-black bg-white shadow-[2px_2px_0px_#000]">
            <RotateCcw size={14} className="text-[#8B5CF6] stroke-[2.5]" />
            <span>
              <strong>{room.settings.rounds}</strong> Rounds
            </span>
          </div>
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border-2 border-black bg-white shadow-[2px_2px_0px_#000]">
            <Clock size={14} className="text-[#10B981] stroke-[2.5]" />
            <span>
              <strong>{room.settings.drawTime}s</strong> Draw Time
            </span>
          </div>
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border-2 border-black bg-white shadow-[2px_2px_0px_#000]">
            <Users size={14} className="text-[#06B6D4] stroke-[2.5]" />
            <span>
              Max <strong>{room.settings.maxPlayers}</strong> Players
            </span>
          </div>
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border-2 border-black bg-white shadow-[2px_2px_0px_#000]">
            <Sparkles size={14} className="text-[#F43F5E] stroke-[2.5]" />
            <span className="capitalize">
              Mode: <strong>{room.settings.wordMode.replace('_', ' ')}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Players List Grid */}
      <div className="neo-card-lg p-6 sm:p-7 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b-2 border-black">
          <div className="flex items-center space-x-2">
            <Users size={18} className="text-black stroke-[2.5]" />
            <h3 className="text-base sm:text-lg font-fun font-black text-black">
              LOBBY PLAYERS ({room.players.length}/{room.settings.maxPlayers})
            </h3>
          </div>
          <span className="text-xs font-bold text-slate-600 font-fun">
            {canStart ? 'All set to start!' : 'Waiting for everyone to ready up...'}
          </span>
        </div>

        {/* Player Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          {room.players.map((player) => {
            const isSelf = player.id === youId;
            const playerAvatar = isSelf ? (avatar || player.avatar) : player.avatar;
            return (
              <div
                key={player.id}
                onClick={() => setSelectedPlayer(player)}
                className={`flex items-center justify-between p-3.5 rounded-2xl border-[2.5px] border-black transition-all shadow-[3px_3px_0px_#000] cursor-pointer hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#000] ${
                  isSelf ? 'bg-[#EDE9FE]' : 'bg-white'
                }`}
              >
                <div className="flex items-center space-x-3 truncate">
                  <div className="p-1 rounded-full border-2 border-black bg-white shadow-[1px_1px_0px_#000]">
                    <Avatar config={playerAvatar} size="md" />
                  </div>
                  <div className="truncate text-left font-fun">
                    <div className="flex items-center space-x-1">
                      <span className="font-black text-sm text-black truncate">
                        {player.name}
                      </span>
                      {isSelf && (
                        <span className="text-[10px] font-black px-1.5 py-0.2 rounded border border-black bg-[#8B5CF6] text-white">
                          YOU
                        </span>
                      )}
                    </div>
                    {player.isHost && (
                      <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-amber-700">
                        <Crown size={12} className="fill-amber-500 stroke-black stroke-[1.5]" />
                        <span>Host</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Ready Status Badge */}
                <div>
                  {player.isHost ? (
                    <span className="px-2.5 py-1 rounded-lg text-xs font-black uppercase font-fun border-2 border-black bg-[#FACC15] text-black shadow-[1px_1px_0px_#000]">
                      HOST
                    </span>
                  ) : player.ready ? (
                    <span className="px-2.5 py-1 rounded-lg text-xs font-black uppercase font-fun border-2 border-black bg-[#10B981] text-black shadow-[1px_1px_0px_#000] flex items-center space-x-1">
                      <CheckCircle2 size={13} className="stroke-[2.5]" />
                      <span>READY</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase font-fun border border-slate-400 bg-slate-100 text-slate-500">
                      WAITING
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Empty slot placeholder cards */}
          {Array.from({ length: emptySlotsCount }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="flex items-center justify-center p-3.5 rounded-2xl border-2 border-dashed border-slate-400 bg-white/50 text-slate-400 text-xs font-bold font-fun select-none"
            >
              Waiting for player...
            </div>
          ))}
        </div>

        {/* Lobby Actions */}
        <div className="pt-4 border-t-2 border-black flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs font-bold text-slate-600 font-fun text-center sm:text-left">
            {isHost
              ? room.players.length < 2
                ? 'Invite at least 1 more player to begin the game.'
                : canStart
                ? 'All players are ready! Click Start Game to launch round 1.'
                : 'Waiting for guests to toggle their Ready status.'
              : you?.ready
              ? 'You are ready! Waiting for the host to launch the game.'
              : 'Click "Ready Up" when you are set to start!'}
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto">
            {/* Leave Room button */}
            <button
              type="button"
              onClick={leaveRoom}
              className="px-3.5 py-3.5 neo-btn neo-btn-white text-xs sm:text-sm flex items-center justify-center space-x-1.5 hover:bg-rose-50 hover:text-rose-600 transition-colors"
              title="Leave Room & Back to Home"
            >
              <LogOut size={16} className="stroke-[2.5]" />
              <span className="hidden sm:inline">LEAVE</span>
            </button>

            {/* Wardrobe button */}
            <button
              type="button"
              onClick={() => setShowWardrobe(true)}
              className="px-4 py-3.5 neo-btn neo-btn-cyan text-xs sm:text-sm flex items-center justify-center space-x-1.5"
              title="Open Wardrobe & Change Style"
            >
              <Shirt size={16} className="stroke-[2.5]" />
              <span>WARDROBE</span>
            </button>

            {/* Non-host Ready Toggle */}
            {!isHost && (
              <button
                type="button"
                onClick={() => setReady(!you?.ready)}
                className={`w-full sm:w-auto px-6 py-3.5 neo-btn text-sm flex items-center justify-center space-x-2 ${
                  you?.ready ? 'neo-btn-emerald' : 'neo-btn-violet'
                }`}
              >
                <CheckCircle2 size={18} className="stroke-[2.5]" />
                <span>{you?.ready ? "I'M READY (WAITING)" : 'READY UP'}</span>
              </button>
            )}

            {/* Host Start Game Button */}
            {isHost && (
              <button
                type="button"
                disabled={!canStart}
                onClick={startGame}
                className={`w-full sm:w-auto px-7 py-3.5 neo-btn text-sm sm:text-base flex items-center justify-center space-x-2 ${
                  canStart
                    ? 'neo-btn-emerald animate-bounce cursor-pointer'
                    : 'bg-slate-200 text-slate-500 border-2 border-black opacity-60 cursor-not-allowed shadow-none'
                }`}
              >
                <Play size={18} className="stroke-[2.5] fill-black" />
                <span>START GAME</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Wardrobe Studio Modal */}
      {showWardrobe && (
        <CharacterStudio
          config={avatar}
          playerName={you?.name || 'Artist'}
          onSave={setAvatar}
          onClose={() => setShowWardrobe(false)}
        />
      )}

      {/* Player Action Popup Modal (Kick / Votekick / Mute) */}
      {selectedPlayer && (
        <PlayerProfileModal
          player={selectedPlayer}
          isSelf={selectedPlayer.id === youId}
          isHost={isHost}
          isMuted={mutedPlayerIds.includes(selectedPlayer.id)}
          kickVotes={kickVotes[selectedPlayer.id]}
          onClose={() => setSelectedPlayer(null)}
          onKick={kickPlayer}
          onVoteKick={voteKick}
          onToggleMute={toggleMutePlayer}
          onOpenWardrobe={() => setShowWardrobe(true)}
        />
      )}
    </div>
  );
};
