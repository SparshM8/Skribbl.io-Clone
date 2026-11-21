import React, { useState, useRef, useEffect } from 'react';
import { Send, CheckCircle2, MessageSquare, Sparkles } from 'lucide-react';
import type { ChatMessage } from '../types';

interface ChatProps {
  messages: ChatMessage[];
  isDrawer: boolean;
  hasGuessed: boolean;
  currentUserId: string | null;
  mutedPlayerIds?: string[];
  onSendMessage: (text: string) => void;
}

export const Chat: React.FC<ChatProps> = ({
  messages,
  isDrawer,
  hasGuessed,
  currentUserId,
  mutedPlayerIds = [],
  onSendMessage,
}) => {
  const [text, setText] = useState('');
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  const visibleMessages = messages.filter(
    (msg) => !msg.playerId || !mutedPlayerIds.includes(msg.playerId)
  );

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [visibleMessages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = text.trim();
    if (!clean) return;
    onSendMessage(clean);
    setText('');
  };

  const getPlaceholder = () => {
    if (isDrawer) return 'You are drawing! Chat with guessers...';
    if (hasGuessed) return 'You guessed it! Chat with other guessers...';
    return 'Type your guess here...';
  };

  return (
    <div className="neo-card h-full flex flex-col overflow-hidden select-none">
      {/* Header */}
      <div className="p-3 border-b-2 border-black flex items-center justify-between bg-white">
        <div className="flex items-center space-x-1.5">
          <MessageSquare size={16} className="text-black stroke-[2.5]" />
          <span className="text-xs font-fun font-black uppercase tracking-wider text-black">Chat &amp; Guesses</span>
        </div>
        {hasGuessed && !isDrawer && (
          <div className="flex items-center space-x-1 text-xs font-fun font-black px-2 py-0.5 rounded-lg border-2 border-black bg-[#10B981] text-black shadow-[1px_1px_0px_#000] animate-bounce">
            <CheckCircle2 size={12} className="stroke-[3]" />
            <span className="text-[10px] uppercase">GUESSED!</span>
          </div>
        )}
      </div>

      {/* Messages Stream */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-3 space-y-2 text-xs min-h-[220px]">
        {visibleMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs font-bold font-fun italic py-8 space-y-1">
            <Sparkles size={22} className="text-slate-300 stroke-[2]" />
            <span>No guesses yet. Be the first to guess!</span>
          </div>
        ) : (
          visibleMessages.map((msg) => {
            if (msg.type === 'guess_correct') {
              return (
                <div
                  key={msg.id}
                  className="p-2.5 rounded-xl border-2 border-black bg-[#10B981] text-center font-fun font-black text-black text-xs shadow-[2px_2px_0px_#000] flex items-center justify-center space-x-1.5"
                >
                  <CheckCircle2 size={15} className="text-black stroke-[2.5]" />
                  <span>{msg.text}</span>
                </div>
              );
            }

            if (msg.type === 'close') {
              return (
                <div
                  key={msg.id}
                  className="p-2 rounded-xl border-2 border-black bg-[#FACC15] text-center font-fun font-black text-black text-xs shadow-[2px_2px_0px_#000]"
                >
                  {msg.text}
                </div>
              );
            }

            if (msg.type === 'system' || msg.type === 'join' || msg.type === 'leave') {
              return (
                <div key={msg.id} className="p-1.5 rounded-lg border border-black bg-slate-100 text-center font-fun font-bold text-slate-700 text-[11px]">
                  {msg.text}
                </div>
              );
            }

            const isSelf = msg.playerId === currentUserId;

            return (
              <div key={msg.id} className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-1.5 border-2 border-black shadow-[2px_2px_0px_#000] break-words ${
                    isSelf
                      ? 'bg-[#EDE9FE] text-black font-fun'
                      : 'bg-white text-black font-fun'
                  }`}
                >
                  {!isSelf && msg.playerName && (
                    <div className="text-[10px] font-black uppercase text-[#8B5CF6]">
                      {msg.playerName}
                    </div>
                  )}
                  <div className="font-bold text-xs">{msg.text}</div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input bar */}
      <form onSubmit={handleSubmit} className="p-2.5 border-t-2 border-black bg-white flex items-center space-x-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={isDrawer}
          placeholder={getPlaceholder()}
          maxLength={100}
          className={`flex-1 px-3 py-2 text-xs neo-input ${
            isDrawer ? 'bg-slate-100 cursor-not-allowed opacity-60 shadow-none' : ''
          }`}
        />
        <button
          type="submit"
          disabled={isDrawer || !text.trim()}
          className={`p-2.5 rounded-xl border-2 border-black font-fun font-black transition-all cursor-pointer ${
            isDrawer || !text.trim()
              ? 'bg-slate-200 text-slate-400 opacity-60 shadow-none cursor-not-allowed'
              : 'bg-[#8B5CF6] hover:bg-[#7C3AED] text-white shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'
          }`}
        >
          <Send size={15} className="stroke-[2.5]" />
        </button>
      </form>
    </div>
  );
};
