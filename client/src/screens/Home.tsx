import React, { useState } from 'react';
import { LogIn, Wifi, WifiOff, Sparkles, Palette, Zap, ShieldCheck } from 'lucide-react';
import { useGame } from '../store/useGame';
import { AvatarCustomizer } from '../components/AvatarCustomizer';
import { socket } from '../net/socket';

interface HomeProps {
  onNavigate: (view: 'HOME' | 'CREATE' | 'JOIN') => void;
}

export const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const { nickname, setNickname, avatar, setAvatar, errorToast, setErrorToast } = useGame();
  const [localName, setLocalName] = useState(nickname);
  const [nameError, setNameError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(socket.isOpen);

  React.useEffect(() => {
    socket.connect().then(() => setIsConnected(true));
    const unsubOn = socket.on('_connected', () => setIsConnected(true));
    const unsubOff = socket.on('_disconnected', () => setIsConnected(false));
    return () => {
      unsubOn();
      unsubOff();
    };
  }, []);

  const handleAction = (view: 'CREATE' | 'JOIN') => {
    const trimmed = localName.trim();
    if (!trimmed) {
      setNameError('Choose a nickname to jump into the action!');
      return;
    }
    setNameError(null);
    setNickname(trimmed);
    onNavigate(view);
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-6 py-6 px-4">
      {/* Header & Neo-Brutalist Logo */}
      <div className="text-center space-y-3.5 select-none">
        {/* Connection status badge */}
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border-2 border-black bg-white shadow-[2px_2px_0px_#000] text-xs font-bold font-fun">
          {isConnected ? (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse border border-black" />
              <Wifi size={13} className="text-[#059669]" />
              <span className="text-black uppercase tracking-wider text-[11px]">Server Live &amp; Ready</span>
            </>
          ) : (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-[#FACC15] border border-black" />
              <WifiOff size={13} className="text-amber-700" />
              <span className="text-black uppercase tracking-wider text-[11px]">Connecting...</span>
            </>
          )}
        </div>

        {/* Pop Art Blocky Skribbl.io Logo */}
        <div className="flex items-center justify-center space-x-1.5 sm:space-x-2 pt-1">
          <span className="w-12 h-14 sm:w-14 sm:h-16 flex items-center justify-center font-fun text-3xl sm:text-4xl font-black bg-[#FACC15] text-black border-[3px] border-black rounded-xl shadow-[3px_3px_0px_#000] transform -rotate-3 hover:rotate-0 transition-transform">
            s
          </span>
          <span className="w-12 h-14 sm:w-14 sm:h-16 flex items-center justify-center font-fun text-3xl sm:text-4xl font-black bg-[#06B6D4] text-black border-[3px] border-black rounded-xl shadow-[3px_3px_0px_#000] transform rotate-2 hover:rotate-0 transition-transform">
            k
          </span>
          <span className="w-12 h-14 sm:w-14 sm:h-16 flex items-center justify-center font-fun text-3xl sm:text-4xl font-black bg-[#F43F5E] text-white border-[3px] border-black rounded-xl shadow-[3px_3px_0px_#000] transform -rotate-2 hover:rotate-0 transition-transform">
            r
          </span>
          <span className="w-12 h-14 sm:w-14 sm:h-16 flex items-center justify-center font-fun text-3xl sm:text-4xl font-black bg-[#10B981] text-black border-[3px] border-black rounded-xl shadow-[3px_3px_0px_#000] transform rotate-3 hover:rotate-0 transition-transform">
            i
          </span>
          <span className="w-12 h-14 sm:w-14 sm:h-16 flex items-center justify-center font-fun text-3xl sm:text-4xl font-black bg-[#8B5CF6] text-white border-[3px] border-black rounded-xl shadow-[3px_3px_0px_#000] transform -rotate-1 hover:rotate-0 transition-transform">
            b
          </span>
          <span className="w-12 h-14 sm:w-14 sm:h-16 flex items-center justify-center font-fun text-3xl sm:text-4xl font-black bg-[#FB923C] text-black border-[3px] border-black rounded-xl shadow-[3px_3px_0px_#000] transform rotate-2 hover:rotate-0 transition-transform">
            b
          </span>
          <span className="w-12 h-14 sm:w-14 sm:h-16 flex items-center justify-center font-fun text-3xl sm:text-4xl font-black bg-[#06B6D4] text-black border-[3px] border-black rounded-xl shadow-[3px_3px_0px_#000] transform -rotate-2 hover:rotate-0 transition-transform">
            l
          </span>
          <span className="h-10 sm:h-12 px-2.5 sm:px-3 flex items-center justify-center font-fun text-lg sm:text-xl font-black bg-black text-[#FACC15] border-2 border-black rounded-xl shadow-[3px_3px_0px_#000] self-end mb-1">
            .io
          </span>
        </div>

        <p className="text-xs sm:text-sm font-bold text-slate-700 max-w-md mx-auto">
          Fast-paced multiplayer drawing &amp; guessing game. Draw it quick, guess it first!
        </p>
      </div>

      {/* Global Error Banner */}
      {errorToast && (
        <div className="p-3.5 rounded-2xl border-[2.5px] border-black bg-[#FEE2E2] text-[#991B1B] text-xs font-bold flex items-center justify-between shadow-[3px_3px_0px_#000] animate-in fade-in">
          <span>{errorToast}</span>
          <button
            onClick={() => setErrorToast(null)}
            className="text-xs font-black underline ml-2 cursor-pointer"
          >
            DISMISS
          </button>
        </div>
      )}

      {/* Main Neo-Brutalist Play Card */}
      <div className="neo-card-lg p-6 sm:p-8 space-y-6">
        {/* Avatar Customization Block */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b-2 border-black pb-2">
            <span className="text-xs font-black uppercase tracking-wider text-black font-fun flex items-center space-x-1.5">
              <Palette size={16} className="text-[#8B5CF6]" />
              <span>Customize Character</span>
            </span>
            <span className="text-[11px] font-bold text-slate-500 font-fun">Pick eyes &amp; colors</span>
          </div>
          <AvatarCustomizer config={avatar} playerName={localName || 'Player'} onChange={setAvatar} />
        </div>

        {/* Player Nickname Input */}
        <div className="space-y-2 pt-2">
          <label className="block text-xs font-black uppercase tracking-wider text-black font-fun">
            Your Player Nickname
          </label>
          <div className="relative">
            <input
              type="text"
              maxLength={16}
              value={localName}
              onChange={(e) => {
                setLocalName(e.target.value);
                if (nameError) setNameError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAction('CREATE');
              }}
              placeholder="e.g. MasterArtist"
              className={`w-full px-4 py-3 neo-input text-base text-black placeholder:text-slate-400 ${
                nameError ? 'border-[#F43F5E] shadow-[3px_3px_0px_#F43F5E]' : ''
              }`}
            />
            <span className="absolute right-3.5 top-3.5 text-xs font-mono font-bold text-slate-400 select-none">
              {localName.length}/16
            </span>
          </div>
          {nameError && (
            <p className="text-xs font-bold text-[#F43F5E] font-fun">{nameError}</p>
          )}
        </div>

        {/* Primary Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
          {/* Create Room */}
          <button
            type="button"
            onClick={() => handleAction('CREATE')}
            className="w-full py-3.5 px-4 neo-btn neo-btn-violet text-sm sm:text-base flex items-center justify-center space-x-2"
          >
            <Sparkles size={18} className="stroke-[2.5]" />
            <span>CREATE ROOM</span>
          </button>

          {/* Join Room */}
          <button
            type="button"
            onClick={() => handleAction('JOIN')}
            className="w-full py-3.5 px-4 neo-btn neo-btn-cyan text-sm sm:text-base flex items-center justify-center space-x-2"
          >
            <LogIn size={18} className="stroke-[2.5]" />
            <span>JOIN WITH CODE</span>
          </button>
        </div>
      </div>

      {/* Feature Highlights Pills */}
      <div className="grid grid-cols-3 gap-2.5 text-center select-none">
        <div className="p-2.5 rounded-xl border-2 border-black bg-white shadow-[2px_2px_0px_#000] text-xs font-bold font-fun">
          <Zap size={14} className="mx-auto text-[#FACC15] mb-1" />
          <span>Real-time Sync</span>
        </div>
        <div className="p-2.5 rounded-xl border-2 border-black bg-white shadow-[2px_2px_0px_#000] text-xs font-bold font-fun">
          <Sparkles size={14} className="mx-auto text-[#06B6D4] mb-1" />
          <span>Instant Rooms</span>
        </div>
        <div className="p-2.5 rounded-xl border-2 border-black bg-white shadow-[2px_2px_0px_#000] text-xs font-bold font-fun">
          <ShieldCheck size={14} className="mx-auto text-[#10B981] mb-1" />
          <span>Zero Login</span>
        </div>
      </div>
    </div>
  );
};
