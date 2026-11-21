import React from 'react';
import { Sparkles, Clock } from 'lucide-react';

interface WordModalProps {
  words: string[];
  isDrawer: boolean;
  drawerName?: string;
  onSelectWord: (word: string) => void;
}

export const WordModal: React.FC<WordModalProps> = ({
  words,
  isDrawer,
  drawerName,
  onSelectWord,
}) => {
  const BUTTON_STYLES = ['neo-btn-violet', 'neo-btn-cyan', 'neo-btn-emerald'];

  return (
    <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="neo-card-lg p-6 sm:p-7 max-w-sm w-full text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
        {isDrawer ? (
          <>
            <div className="space-y-1">
              <h2 className="text-xl font-fun font-black text-black flex items-center justify-center space-x-1.5">
                <Sparkles size={20} className="text-[#8B5CF6] stroke-[2.5]" />
                <span>Choose a Word!</span>
              </h2>
              <p className="text-xs font-bold text-slate-600">Pick what you want to draw this round:</p>
            </div>

            <div className="space-y-3 pt-2">
              {words.map((word, idx) => (
                <button
                  key={word}
                  onClick={() => onSelectWord(word)}
                  type="button"
                  className={`w-full py-3.5 px-4 neo-btn ${BUTTON_STYLES[idx % BUTTON_STYLES.length]} text-base uppercase tracking-wider`}
                >
                  {word}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="py-4 space-y-3">
            <div className="w-14 h-14 rounded-2xl border-2 border-black bg-[#FACC15] flex items-center justify-center mx-auto shadow-[3px_3px_0px_#000] animate-bounce">
              <Clock size={28} className="text-black stroke-[2.5]" />
            </div>
            <h2 className="text-lg font-fun font-black text-black">
              <span className="text-[#8B5CF6]">{drawerName || 'The drawer'}</span> is choosing a word...
            </h2>
            <p className="text-xs font-bold text-slate-600">Get ready to type your guess rapidly in chat!</p>
          </div>
        )}
      </div>
    </div>
  );
};
