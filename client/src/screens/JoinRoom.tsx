import React, { useState } from 'react';
import { ArrowLeft, LogIn, Hash, Sparkles } from 'lucide-react';
import { useGame } from '../store/useGame';
import { Avatar } from '../components/Avatar';
import { extractInviteRoomCode } from '../utils/invite';

interface JoinRoomProps {
  onBack: () => void;
}

export const JoinRoom: React.FC<JoinRoomProps> = ({ onBack }) => {
  const { nickname, setNickname, avatar, joinRoom, errorToast } = useGame();
  const [playerName, setPlayerName] = useState(nickname);
  const inviteCode = extractInviteRoomCode();
  const [roomCode, setRoomCode] = useState(() => inviteCode || '');
  const [fieldErrors, setFieldErrors] = useState<{ room?: string; name?: string }>({});
  const [joining, setJoining] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { room?: string; name?: string } = {};

    const trimmedRoom = roomCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const trimmedName = playerName.trim();

    if (!trimmedRoom) {
      errors.room = 'Please enter the room code.';
    } else if (trimmedRoom.length < 4) {
      errors.room = 'Room code should be at least 4 characters.';
    }

    if (!trimmedName) {
      errors.name = 'Please enter your nickname.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setJoining(true);
    setNickname(trimmedName);
    joinRoom(trimmedRoom, trimmedName);
    setTimeout(() => setJoining(false), 3000);
  };

  return (
    <div className="w-full max-w-lg mx-auto space-y-5 py-6 px-4">
      {/* Back button */}
      <button
        onClick={onBack}
        type="button"
        className="inline-flex items-center space-x-1.5 text-xs font-black text-black px-3 py-1.5 rounded-xl border-2 border-black bg-white shadow-[2px_2px_0px_#000] hover:-translate-y-0.5 active:translate-y-0.5 transition-all cursor-pointer font-fun"
      >
        <ArrowLeft size={15} className="stroke-[2.5]" />
        <span>BACK TO HOME</span>
      </button>

      {/* Main Container */}
      <div className="neo-card-lg p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-3 border-b-2 border-black pb-4">
          <div className="w-12 h-12 rounded-xl bg-[#06B6D4] text-black border-2 border-black shadow-[3px_3px_0px_#000] flex items-center justify-center">
            <LogIn size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-fun font-black text-black">
              {inviteCode ? 'Match Invitation' : 'Join a Room'}
            </h2>
            <p className="text-xs font-bold text-slate-600">
              {inviteCode ? `You've been invited to room #${inviteCode}` : 'Enter the room code shared by your host.'}
            </p>
          </div>
        </div>

        {inviteCode && (
          <div className="p-3.5 rounded-xl border-2 border-black bg-[#FEF08A] text-black text-xs font-bold shadow-[2px_2px_0px_#000] flex items-center space-x-2 font-fun">
            <Sparkles size={18} className="text-[#8B5CF6] shrink-0" />
            <span>
              Invited to match <strong>#{inviteCode}</strong>! Pick a nickname to jump in.
            </span>
          </div>
        )}

        {errorToast && (
          <div className="p-3.5 rounded-xl border-2 border-black bg-[#FEE2E2] text-[#991B1B] text-xs font-bold shadow-[2px_2px_0px_#000]">
            {errorToast}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Room Code */}
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-wider text-black font-fun">
              Room Code
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-black">
                <Hash size={20} className="stroke-[2.5]" />
              </div>
              <input
                type="text"
                maxLength={6}
                value={roomCode}
                onChange={(e) => {
                  setRoomCode(e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase());
                  if (fieldErrors.room) setFieldErrors((prev) => ({ ...prev, room: undefined }));
                }}
                placeholder="e.g. 8AB3X9"
                className={`w-full pl-12 pr-4 py-3 font-mono text-xl font-black tracking-widest uppercase neo-input text-black ${
                  fieldErrors.room ? 'border-[#F43F5E] shadow-[3px_3px_0px_#F43F5E]' : ''
                }`}
              />
            </div>
            {fieldErrors.room && <p className="text-xs text-[#F43F5E] font-bold mt-1 font-fun">{fieldErrors.room}</p>}
          </div>

          {/* Nickname & Avatar */}
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-wider text-black font-fun">
              Your Player Nickname
            </label>
            <div className="flex items-center space-x-3">
              <div className="p-1 rounded-full border-2 border-black bg-white shadow-[2px_2px_0px_#000]">
                <Avatar config={avatar} size="md" />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  maxLength={16}
                  value={playerName}
                  onChange={(e) => {
                    setPlayerName(e.target.value);
                    if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                  placeholder="Enter your name"
                  className={`w-full px-4 py-2.5 neo-input text-sm text-black ${
                    fieldErrors.name ? 'border-[#F43F5E] shadow-[3px_3px_0px_#F43F5E]' : ''
                  }`}
                />
              </div>
            </div>
            {fieldErrors.name && <p className="text-xs text-[#F43F5E] font-bold mt-1 font-fun">{fieldErrors.name}</p>}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={joining}
            className="w-full py-4 neo-btn neo-btn-cyan text-base flex items-center justify-center space-x-2"
          >
            <Sparkles size={20} className="stroke-[2.5]" />
            <span>{joining ? 'JOINING ROOM...' : 'JOIN GAME LOBBY'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
