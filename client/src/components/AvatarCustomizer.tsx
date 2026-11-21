import React, { useState } from 'react';
import { Shuffle, Sparkles, Shirt, Glasses, Scissors } from 'lucide-react';
import {
  Avatar,
  type AvatarConfig,
  HAIR_STYLES,
  HAIR_COLORS,
  EYEWEAR_STYLES,
  OUTFIT_STYLES,
  saveAvatar,
} from './Avatar';
import { CharacterStudio } from './CharacterStudio';

interface AvatarCustomizerProps {
  config: AvatarConfig;
  playerName?: string;
  onChange: (config: AvatarConfig) => void;
}

export const AvatarCustomizer: React.FC<AvatarCustomizerProps> = ({
  config,
  playerName,
  onChange,
}) => {
  const [showStudioModal, setShowStudioModal] = useState(false);


  const handleRandomize = () => {
    const randomized: AvatarConfig = {
      colorIndex: Math.floor(Math.random() * HAIR_COLORS.length),
      eyesIndex: 0,
      mouthIndex: 0,
      skinIndex: Math.floor(Math.random() * 6),
      hairStyle: Math.floor(Math.random() * HAIR_STYLES.length),
      hairColor: Math.floor(Math.random() * HAIR_COLORS.length),
      eyesStyle: Math.floor(Math.random() * 5),
      eyewearStyle: Math.floor(Math.random() * EYEWEAR_STYLES.length),
      outfitStyle: Math.floor(Math.random() * OUTFIT_STYLES.length),
      outfitColor: Math.floor(Math.random() * 8),
    };
    saveAvatar(randomized);
    onChange(randomized);
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* 3D Chibi Spotlight Preview */}
      <div className="relative group flex items-center justify-center p-2">
        {/* Soft Pedestal Shadow */}
        <div className="p-3 rounded-full bg-white border-[3px] border-black shadow-[4px_4px_0px_#000] relative">
          <Avatar config={config} size="xl" animate />
        </div>

        {/* Tactile Randomize button */}
        <button
          type="button"
          onClick={handleRandomize}
          className="absolute -bottom-1 -right-1 p-2.5 rounded-xl bg-[#06B6D4] hover:bg-[#0891B2] text-black border-2 border-black shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
          title="Randomize Outfit & Hair"
        >
          <Shuffle size={16} className="stroke-[2.5]" />
        </button>
      </div>

      {/* Quick Feature Badges Display */}
      <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-fun font-black select-none">
        <span className="px-2.5 py-1 rounded-lg border border-black bg-white shadow-[1px_1px_0px_#000] flex items-center space-x-1">
          <Scissors size={13} className="text-[#8B5CF6]" />
          <span>{HAIR_STYLES[config.hairStyle ?? 0]?.name}</span>
        </span>
        <span className="px-2.5 py-1 rounded-lg border border-black bg-white shadow-[1px_1px_0px_#000] flex items-center space-x-1">
          <Glasses size={13} className="text-[#06B6D4]" />
          <span>{EYEWEAR_STYLES[config.eyewearStyle ?? 1]?.name}</span>
        </span>
        <span className="px-2.5 py-1 rounded-lg border border-black bg-white shadow-[1px_1px_0px_#000] flex items-center space-x-1">
          <Shirt size={13} className="text-[#10B981]" />
          <span>{OUTFIT_STYLES[config.outfitStyle ?? 0]?.name}</span>
        </span>
      </div>

      {/* Button to open the full Wardrobe Studio Modal (Reference Image 2 & 3!) */}
      <button
        type="button"
        onClick={() => setShowStudioModal(true)}
        className="w-full py-3 neo-btn neo-btn-violet text-xs sm:text-sm flex items-center justify-center space-x-2"
      >
        <Sparkles size={16} className="stroke-[2.5]" />
        <span>OPEN WARDROBE STUDIO (OUTFITS &amp; GLASSES)</span>
      </button>

      {/* Full Modal Wardrobe Studio */}
      {showStudioModal && (
        <CharacterStudio
          config={config}
          playerName={playerName}
          onSave={onChange}
          onClose={() => setShowStudioModal(false)}
        />
      )}
    </div>
  );
};
