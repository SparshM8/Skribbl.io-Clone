import React, { useState } from 'react';
import { ArrowLeft, Sliders, Users, Clock, RotateCcw, Sparkles } from 'lucide-react';
import { useGame } from '../store/useGame';
import { Avatar } from '../components/Avatar';
import type { WordMode } from '../types';

interface CreateRoomProps {
  onBack: () => void;
}

export const CreateRoom: React.FC<CreateRoomProps> = ({ onBack }) => {
  const { nickname, setNickname, avatar, createRoom, errorToast } = useGame();
  const [hostName, setHostName] = useState(nickname);
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [rounds, setRounds] = useState(3);
  const [drawTime, setDrawTime] = useState(80);
  const [wordCount, setWordCount] = useState(3);
  const [hints, setHints] = useState(2);
  const [wordMode, setWordMode] = useState<WordMode>('normal');
  const [customWordsText, setCustomWordsText] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = hostName.trim();
    if (!trimmed) {
      setNameError('Host name is required.');
      return;
    }
    setNickname(trimmed);
    const customWords = customWordsText
      ? customWordsText.split(/[\n,]+/).map((w) => w.trim()).filter(Boolean)
      : undefined;

    createRoom(
      trimmed,
      {
        maxPlayers,
        rounds,
        drawTime,
        wordCount,
        hints,
        wordMode,
        isPrivate: true,
      },
      customWords
    );
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
          <div className="w-12 h-12 rounded-xl bg-[#8B5CF6] text-white border-2 border-black shadow-[3px_3px_0px_#000] flex items-center justify-center">
            <Sliders size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-fun font-black text-black">Create Room</h2>
            <p className="text-xs font-bold text-slate-600">Configure round time, words, and match settings.</p>
          </div>
        </div>

        {errorToast && (
          <div className="p-3.5 rounded-xl border-2 border-black bg-[#FEE2E2] text-[#991B1B] text-xs font-bold shadow-[2px_2px_0px_#000]">
            {errorToast}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Host Nickname & Avatar Preview */}
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-wider text-black font-fun">
              Your Host Nickname
            </label>
            <div className="flex items-center space-x-3">
              <div className="p-1 rounded-full border-2 border-black bg-white shadow-[2px_2px_0px_#000]">
                <Avatar config={avatar} size="md" />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  maxLength={16}
                  value={hostName}
                  onChange={(e) => {
                    setHostName(e.target.value);
                    if (nameError) setNameError(null);
                  }}
                  placeholder="Enter your name"
                  className={`w-full px-4 py-2.5 neo-input text-sm text-black ${
                    nameError ? 'border-[#F43F5E] shadow-[3px_3px_0px_#F43F5E]' : ''
                  }`}
                />
              </div>
            </div>
            {nameError && <p className="text-xs font-bold text-[#F43F5E] font-fun">{nameError}</p>}
          </div>

          {/* Quick Match Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Rounds Selector */}
            <div className="p-3.5 rounded-2xl border-2 border-black bg-white shadow-[3px_3px_0px_#000] space-y-2">
              <div className="flex justify-between items-center text-xs font-black text-black font-fun uppercase">
                <span className="flex items-center space-x-1.5">
                  <RotateCcw size={14} className="text-[#8B5CF6]" />
                  <span>Rounds</span>
                </span>
                <span className="px-2 py-0.5 rounded-md bg-[#8B5CF6] text-white border border-black font-mono">
                  {rounds}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[2, 3, 5, 8].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setRounds(num)}
                    className={`py-1.5 text-xs font-black rounded-lg border-2 border-black transition-all cursor-pointer font-fun ${
                      rounds === num
                        ? 'bg-[#8B5CF6] text-white shadow-[2px_2px_0px_#000]'
                        : 'bg-white hover:bg-slate-100 text-black'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Draw Time Selector */}
            <div className="p-3.5 rounded-2xl border-2 border-black bg-white shadow-[3px_3px_0px_#000] space-y-2">
              <div className="flex justify-between items-center text-xs font-black text-black font-fun uppercase">
                <span className="flex items-center space-x-1.5">
                  <Clock size={14} className="text-[#10B981]" />
                  <span>Draw Time</span>
                </span>
                <span className="px-2 py-0.5 rounded-md bg-[#10B981] text-black border border-black font-mono">
                  {drawTime}s
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[45, 60, 80, 100].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setDrawTime(t)}
                    className={`py-1.5 text-xs font-black rounded-lg border-2 border-black transition-all cursor-pointer font-fun ${
                      drawTime === t
                        ? 'bg-[#10B981] text-black shadow-[2px_2px_0px_#000]'
                        : 'bg-white hover:bg-slate-100 text-black'
                    }`}
                  >
                    {t}s
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Max Players Selector */}
          <div className="p-3.5 rounded-2xl border-2 border-black bg-white shadow-[3px_3px_0px_#000] space-y-2">
            <div className="flex justify-between items-center text-xs font-black text-black font-fun uppercase">
              <span className="flex items-center space-x-1.5">
                <Users size={14} className="text-[#06B6D4]" />
                <span>Max Players</span>
              </span>
              <span className="px-2 py-0.5 rounded-md bg-[#06B6D4] text-black border border-black font-mono">
                {maxPlayers}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {[4, 6, 8, 12, 16].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setMaxPlayers(num)}
                  className={`py-1.5 text-xs font-black rounded-lg border-2 border-black transition-all cursor-pointer font-fun ${
                    maxPlayers === num
                      ? 'bg-[#06B6D4] text-black shadow-[2px_2px_0px_#000]'
                      : 'bg-white hover:bg-slate-100 text-black'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Word Choices & Hints */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-2xl border-2 border-black bg-white shadow-[3px_3px_0px_#000] space-y-2">
              <div className="flex justify-between items-center text-xs font-black text-black font-fun uppercase">
                <span>Words</span>
                <span className="text-[#8B5CF6] font-mono font-black">{wordCount}</span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {[2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setWordCount(num)}
                    className={`py-1 text-xs font-black rounded-lg border-2 border-black transition-all cursor-pointer font-fun ${
                      wordCount === num
                        ? 'bg-[#8B5CF6] text-white shadow-[2px_2px_0px_#000]'
                        : 'bg-white hover:bg-slate-100 text-black'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-2xl border-2 border-black bg-white shadow-[3px_3px_0px_#000] space-y-2">
              <div className="flex justify-between items-center text-xs font-black text-black font-fun uppercase">
                <span>Hints</span>
                <span className="text-[#FACC15] font-mono font-black">{hints}</span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {[0, 1, 2, 3].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setHints(num)}
                    className={`py-1 text-xs font-black rounded-lg border-2 border-black transition-all cursor-pointer font-fun ${
                      hints === num
                        ? 'bg-[#FACC15] text-black shadow-[2px_2px_0px_#000]'
                        : 'bg-white hover:bg-slate-100 text-black'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Word Mode */}
          <div className="p-3.5 rounded-2xl border-2 border-black bg-white shadow-[3px_3px_0px_#000] space-y-2">
            <label className="block text-xs font-black text-black uppercase tracking-wider font-fun">
              Word Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['normal', 'hidden', 'combination'] as WordMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setWordMode(mode)}
                  className={`py-2 px-2 text-xs font-black rounded-xl border-2 border-black capitalize transition-all cursor-pointer font-fun ${
                    wordMode === mode
                      ? 'bg-[#FACC15] text-black shadow-[2px_2px_0px_#000]'
                      : 'bg-white hover:bg-slate-100 text-black'
                  }`}
                >
                  {mode.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Words (Optional) */}
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-wider text-black font-fun">
              Custom Words <span className="text-slate-500 font-normal">(Comma separated, min 4 chars)</span>
            </label>
            <textarea
              rows={2}
              value={customWordsText}
              onChange={(e) => setCustomWordsText(e.target.value)}
              placeholder="banana, telescope, astronaut, pyramid, lightning..."
              className="w-full p-3 neo-input text-xs text-black resize-none"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-4 neo-btn neo-btn-violet text-base flex items-center justify-center space-x-2"
          >
            <Sparkles size={20} className="stroke-[2.5]" />
            <span>CREATE &amp; ENTER LOBBY</span>
          </button>
        </form>
      </div>
    </div>
  );
};
