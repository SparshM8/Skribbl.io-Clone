import React, { useState } from 'react';
import {
  Shuffle,
  RotateCcw,
  Check,
  Sparkles,
  Scissors,
  Glasses,
  Shirt,
  User,
  X,
} from 'lucide-react';
import {
  Avatar,
  type AvatarConfig,
  SKIN_TONES,
  HAIR_STYLES,
  HAIR_COLORS,
  EYE_STYLES,
  EYEWEAR_STYLES,
  OUTFIT_STYLES,
  OUTFIT_COLORS,
  saveAvatar,
} from './Avatar';

interface CharacterStudioProps {
  config: AvatarConfig;
  playerName?: string;
  onSave?: (config: AvatarConfig) => void;
  onClose?: () => void;
  inline?: boolean;
}

type TabType = 'HAIR' | 'EYEWEAR' | 'OUTFIT' | 'SKIN';

export const CharacterStudio: React.FC<CharacterStudioProps> = ({
  config,
  playerName = 'Artist',
  onSave,
  onClose,
  inline = false,
}) => {
  const [currentConfig, setCurrentConfig] = useState<AvatarConfig>({ ...config });
  const [activeTab, setActiveTab] = useState<TabType>('HAIR');

  const update = (partial: Partial<AvatarConfig>) => {
    const updated = { ...currentConfig, ...partial };
    setCurrentConfig(updated);
    saveAvatar(updated);
    if (onSave) onSave(updated);
  };

  const handleRandomize = () => {
    const randomConfig: AvatarConfig = {
      colorIndex: Math.floor(Math.random() * HAIR_COLORS.length),
      eyesIndex: Math.floor(Math.random() * EYE_STYLES.length),
      mouthIndex: 0,
      skinIndex: Math.floor(Math.random() * SKIN_TONES.length),
      hairStyle: Math.floor(Math.random() * HAIR_STYLES.length),
      hairColor: Math.floor(Math.random() * HAIR_COLORS.length),
      eyesStyle: Math.floor(Math.random() * EYE_STYLES.length),
      eyewearStyle: Math.floor(Math.random() * EYEWEAR_STYLES.length),
      outfitStyle: Math.floor(Math.random() * OUTFIT_STYLES.length),
      outfitColor: Math.floor(Math.random() * OUTFIT_COLORS.length),
    };
    setCurrentConfig(randomConfig);
    saveAvatar(randomConfig);
    if (onSave) onSave(randomConfig);
  };

  const handleReset = () => {
    const defaultCfg: AvatarConfig = {
      colorIndex: 0,
      eyesIndex: 0,
      mouthIndex: 0,
      skinIndex: 0,
      hairStyle: 0,
      hairColor: 0,
      eyesStyle: 0,
      eyewearStyle: 1,
      outfitStyle: 0,
      outfitColor: 0,
    };
    setCurrentConfig(defaultCfg);
    saveAvatar(defaultCfg);
    if (onSave) onSave(defaultCfg);
  };

  const content = (
    <div className="w-full neo-card-lg p-4 sm:p-6 bg-[#FAF7F2] border-[3px] border-black shadow-[6px_6px_0px_#000] space-y-4">
      {/* Studio Header Bar */}
      <div className="flex items-center justify-between border-b-2 border-black pb-3">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-[#FACC15] border-2 border-black shadow-[2px_2px_0px_#000]">
            <Sparkles size={18} className="text-black stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-base sm:text-xl font-fun font-black uppercase text-black">
              Character Wardrobe Studio
            </h2>
            <p className="text-[11px] font-bold text-slate-600 font-fun">
              Design your personalized Chibi 3D player avatar
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl border-2 border-black bg-white hover:bg-slate-100 text-black shadow-[2px_2px_0px_#000] cursor-pointer"
          >
            <X size={18} className="stroke-[2.5]" />
          </button>
        )}
      </div>

      {/* 2-Panel Split Layout (Matching Reference Images 2 & 3!) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left Panel: Hero Character Showcase & Spotlight */}
        <div className="lg:col-span-5 flex flex-col items-center justify-between p-4 sm:p-5 rounded-2xl border-2 border-black bg-white shadow-[3px_3px_0px_#000] relative">
          {/* Level & Title Pill (From Image 2) */}
          <div className="w-full flex items-center justify-between gap-2">
            <span className="px-3 py-1 rounded-full border border-black bg-[#FACC15] text-black text-[11px] font-black font-fun shadow-[1px_1px_0px_#000]">
              LVL 1 • PRO ARTIST
            </span>
            <span className="text-xs font-mono font-black text-black">
              {playerName}
            </span>
          </div>

          {/* Large Hero Character with circular shadow platform */}
          <div className="relative my-4 flex items-center justify-center">
            {/* Pedestal Shadow */}
            <div className="absolute -bottom-2 w-32 h-6 bg-black/15 rounded-full blur-[2px]" />
            <Avatar config={currentConfig} size="hero" animate />
          </div>

          {/* Quick Action Buttons (Randomize & Reset) */}
          <div className="w-full grid grid-cols-2 gap-2 pt-2 border-t-2 border-black">
            <button
              type="button"
              onClick={handleRandomize}
              className="py-2.5 px-3 neo-btn neo-btn-cyan text-xs flex items-center justify-center space-x-1.5"
              title="Generate Random Stylish Outfit"
            >
              <Shuffle size={14} className="stroke-[2.5]" />
              <span>RANDOMIZE 🎲</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="py-2.5 px-3 neo-btn neo-btn-white text-xs flex items-center justify-center space-x-1.5"
              title="Reset to Default"
            >
              <RotateCcw size={14} className="stroke-[2.5]" />
              <span>RESET</span>
            </button>
          </div>
        </div>

        {/* Right Panel: Category Tabs & Selectable Items Grid */}
        <div className="lg:col-span-7 flex flex-col space-y-3.5">
          {/* Top Category Tabs (Hair, Eyewear, Outfit, Skin) */}
          <div className="grid grid-cols-4 gap-1.5 p-1 rounded-xl border-2 border-black bg-white shadow-[2px_2px_0px_#000]">
            <button
              type="button"
              onClick={() => setActiveTab('HAIR')}
              className={`py-2 px-1 rounded-lg text-xs font-fun font-black flex items-center justify-center space-x-1 transition-all cursor-pointer ${
                activeTab === 'HAIR'
                  ? 'bg-[#8B5CF6] text-white border-2 border-black shadow-[1px_1px_0px_#000]'
                  : 'text-black hover:bg-slate-100'
              }`}
            >
              <Scissors size={14} className="stroke-[2.5]" />
              <span className="hidden sm:inline">Hair</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('EYEWEAR')}
              className={`py-2 px-1 rounded-lg text-xs font-fun font-black flex items-center justify-center space-x-1 transition-all cursor-pointer ${
                activeTab === 'EYEWEAR'
                  ? 'bg-[#06B6D4] text-black border-2 border-black shadow-[1px_1px_0px_#000]'
                  : 'text-black hover:bg-slate-100'
              }`}
            >
              <Glasses size={14} className="stroke-[2.5]" />
              <span className="hidden sm:inline">Glasses</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('OUTFIT')}
              className={`py-2 px-1 rounded-lg text-xs font-fun font-black flex items-center justify-center space-x-1 transition-all cursor-pointer ${
                activeTab === 'OUTFIT'
                  ? 'bg-[#10B981] text-black border-2 border-black shadow-[1px_1px_0px_#000]'
                  : 'text-black hover:bg-slate-100'
              }`}
            >
              <Shirt size={14} className="stroke-[2.5]" />
              <span className="hidden sm:inline">Outfit</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('SKIN')}
              className={`py-2 px-1 rounded-lg text-xs font-fun font-black flex items-center justify-center space-x-1 transition-all cursor-pointer ${
                activeTab === 'SKIN'
                  ? 'bg-[#FACC15] text-black border-2 border-black shadow-[1px_1px_0px_#000]'
                  : 'text-black hover:bg-slate-100'
              }`}
            >
              <User size={14} className="stroke-[2.5]" />
              <span className="hidden sm:inline">Face</span>
            </button>
          </div>

          {/* TAB 1: HAIR & DYE */}
          {activeTab === 'HAIR' && (
            <div className="space-y-3.5 bg-white p-3.5 sm:p-4 rounded-2xl border-2 border-black shadow-[2px_2px_0px_#000]">
              <div>
                <span className="text-xs font-black uppercase text-black font-fun block mb-2">
                  1. Choose Hairstyle
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {HAIR_STYLES.map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => update({ hairStyle: style.id })}
                      className={`p-2.5 rounded-xl border-2 transition-all flex items-center space-x-2 text-left cursor-pointer ${
                        currentConfig.hairStyle === style.id
                          ? 'border-black bg-[#EDE9FE] shadow-[2px_2px_0px_#000] ring-1 ring-black'
                          : 'border-slate-200 hover:border-black bg-slate-50'
                      }`}
                    >
                      <span className="text-lg">{style.icon}</span>
                      <span className="text-xs font-bold text-black font-fun truncate">
                        {style.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-xs font-black uppercase text-black font-fun block mb-2">
                  2. Hair Dye Color
                </span>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {HAIR_COLORS.map((col, idx) => (
                    <button
                      key={col.name}
                      type="button"
                      onClick={() => update({ hairColor: idx, colorIndex: idx })}
                      title={col.name}
                      className={`h-9 rounded-xl border-2 border-black transition-all flex items-center justify-center cursor-pointer ${
                        currentConfig.hairColor === idx
                          ? 'scale-110 shadow-[2px_2px_0px_#000] ring-2 ring-black -translate-y-0.5'
                          : 'hover:scale-105 opacity-90'
                      }`}
                      style={{ backgroundColor: col.base }}
                    >
                      {currentConfig.hairColor === idx && (
                        <Check size={14} className="text-white drop-shadow stroke-[3]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EYEWEAR & ACCESSORIES (Signature Feature from Image 1!) */}
          {activeTab === 'EYEWEAR' && (
            <div className="space-y-3.5 bg-white p-3.5 sm:p-4 rounded-2xl border-2 border-black shadow-[2px_2px_0px_#000]">
              <div>
                <span className="text-xs font-black uppercase text-black font-fun block mb-2">
                  1. Cyberpunk Visors &amp; Glasses
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {EYEWEAR_STYLES.map((ew) => (
                    <button
                      key={ew.id}
                      type="button"
                      onClick={() => update({ eyewearStyle: ew.id })}
                      className={`p-2.5 rounded-xl border-2 transition-all flex items-center space-x-2 text-left cursor-pointer ${
                        currentConfig.eyewearStyle === ew.id
                          ? 'border-black bg-[#CFFAFE] shadow-[2px_2px_0px_#000] ring-1 ring-black'
                          : 'border-slate-200 hover:border-black bg-slate-50'
                      }`}
                    >
                      <span className="text-lg">{ew.icon}</span>
                      <span className="text-xs font-bold text-black font-fun truncate">
                        {ew.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-xs font-black uppercase text-black font-fun block mb-2">
                  2. Eyes Expression
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {EYE_STYLES.map((e) => (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => update({ eyesStyle: e.id, eyesIndex: e.id })}
                      className={`p-2 rounded-xl border-2 transition-all flex items-center space-x-2 text-left cursor-pointer ${
                        currentConfig.eyesStyle === e.id
                          ? 'border-black bg-[#FEF08A] shadow-[2px_2px_0px_#000]'
                          : 'border-slate-200 hover:border-black bg-slate-50'
                      }`}
                    >
                      <span className="text-base">{e.icon}</span>
                      <span className="text-xs font-bold text-black font-fun truncate">
                        {e.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: OUTFIT & STREETWEAR */}
          {activeTab === 'OUTFIT' && (
            <div className="space-y-3.5 bg-white p-3.5 sm:p-4 rounded-2xl border-2 border-black shadow-[2px_2px_0px_#000]">
              <div>
                <span className="text-xs font-black uppercase text-black font-fun block mb-2">
                  1. Streetwear Style
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {OUTFIT_STYLES.map((outfit) => (
                    <button
                      key={outfit.id}
                      type="button"
                      onClick={() => update({ outfitStyle: outfit.id })}
                      className={`p-2.5 rounded-xl border-2 transition-all flex items-center space-x-2 text-left cursor-pointer ${
                        currentConfig.outfitStyle === outfit.id
                          ? 'border-black bg-[#D1FAE5] shadow-[2px_2px_0px_#000] ring-1 ring-black'
                          : 'border-slate-200 hover:border-black bg-slate-50'
                      }`}
                    >
                      <span className="text-lg">{outfit.icon}</span>
                      <span className="text-xs font-bold text-black font-fun truncate">
                        {outfit.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-xs font-black uppercase text-black font-fun block mb-2">
                  2. Jacket Color
                </span>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {OUTFIT_COLORS.map((col, idx) => (
                    <button
                      key={col.name}
                      type="button"
                      onClick={() => update({ outfitColor: idx })}
                      title={col.name}
                      className={`h-9 rounded-xl border-2 border-black transition-all flex items-center justify-center cursor-pointer ${
                        currentConfig.outfitColor === idx
                          ? 'scale-110 shadow-[2px_2px_0px_#000] ring-2 ring-black -translate-y-0.5'
                          : 'hover:scale-105 opacity-90'
                      }`}
                      style={{ backgroundColor: col.base }}
                    >
                      {currentConfig.outfitColor === idx && (
                        <Check size={14} className="text-white drop-shadow stroke-[3]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SKIN & FACE */}
          {activeTab === 'SKIN' && (
            <div className="space-y-3.5 bg-white p-3.5 sm:p-4 rounded-2xl border-2 border-black shadow-[2px_2px_0px_#000]">
              <span className="text-xs font-black uppercase text-black font-fun block">
                Skin Tone &amp; Rosy Blush
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {SKIN_TONES.map((tone, idx) => (
                  <button
                    key={tone.name}
                    type="button"
                    onClick={() => update({ skinIndex: idx })}
                    className={`p-3 rounded-xl border-2 transition-all flex items-center space-x-2.5 text-left cursor-pointer ${
                      currentConfig.skinIndex === idx
                        ? 'border-black bg-[#FEF08A] shadow-[2px_2px_0px_#000] ring-1 ring-black'
                        : 'border-slate-200 hover:border-black bg-slate-50'
                    }`}
                  >
                    <span
                      className="w-6 h-6 rounded-full border border-black shadow-xs shrink-0"
                      style={{ backgroundColor: tone.base }}
                    />
                    <span className="text-xs font-bold text-black font-fun truncate">
                      {tone.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Lock In / Save Button (Matching Image 3!) */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 neo-btn neo-btn-violet text-sm flex items-center justify-center space-x-2"
            >
              <Check size={18} className="stroke-[2.5]" />
              <span>LOCK IN &amp; READY TO PLAY</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (inline) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="max-w-4xl w-full my-auto animate-in zoom-in-95 duration-200">
        {content}
      </div>
    </div>
  );
};
