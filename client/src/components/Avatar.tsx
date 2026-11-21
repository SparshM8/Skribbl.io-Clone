import React from 'react';
import type { AvatarConfig } from '../types';

export { type AvatarConfig };

// ==========================================
// PALETTES & OPTIONS DEFINITIONS
// ==========================================

export const SKIN_TONES = [
  { name: 'Warm Peach', base: '#FCD3B8', shadow: '#EAA988', blush: '#F43F5E' },
  { name: 'Sunkissed Sand', base: '#F4C29E', shadow: '#D99870', blush: '#E11D48' },
  { name: 'Pale Porcelain', base: '#FDE6D2', shadow: '#E8BF9E', blush: '#FB7185' },
  { name: 'Caramel Bronze', base: '#D99468', shadow: '#B36B3D', blush: '#BE123C' },
  { name: 'Deep Espresso', base: '#8C583E', shadow: '#61361F', blush: '#881337' },
  { name: 'Cyber Lavender', base: '#DDD6FE', shadow: '#C4B5FD', blush: '#A855F7' },
];

export const HAIR_STYLES = [
  { id: 0, name: 'Cyber Chibi Bob', icon: '💇' },
  { id: 1, name: 'Anime Spiky Flow', icon: '⚡' },
  { id: 2, name: 'Curly Cloud Puff', icon: '☁️' },
  { id: 3, name: 'Twin Chibi Tails', icon: '👧' },
  { id: 4, name: 'Slick Undercut', icon: '💈' },
  { id: 5, name: 'Street Beanie Cap', icon: '🧢' },
];

export const HAIR_COLORS = [
  { name: 'Neon Violet', base: '#A855F7', highlight: '#D8B4FE', shadow: '#7E22CE' },
  { name: 'Cyber Mint', base: '#4ADE80', highlight: '#BBF7D0', shadow: '#16A34A' },
  { name: 'Pop Magenta', base: '#F472B6', highlight: '#FCE7F3', shadow: '#DB2777' },
  { name: 'Electric Cyan', base: '#38BDF8', highlight: '#BAE6FD', shadow: '#0284C7' },
  { name: 'Golden Honey', base: '#FBBF24', highlight: '#FEF08A', shadow: '#D97706' },
  { name: 'Sunset Crimson', base: '#F87171', highlight: '#FECACA', shadow: '#DC2626' },
  { name: 'Jet Charcoal', base: '#334155', highlight: '#64748B', shadow: '#0F172A' },
  { name: 'Platinum Ice', base: '#F1F5F9', highlight: '#FFFFFF', shadow: '#94A3B8' },
];

export const EYE_STYLES = [
  { id: 0, name: 'Chibi Sparkle', icon: '✨' },
  { id: 1, name: 'Happy Arc', icon: '😄' },
  { id: 2, name: 'Confident Wink', icon: '😉' },
  { id: 3, name: 'Anime Wonder', icon: '👀' },
  { id: 4, name: 'Chill Low-Lid', icon: '🕶️' },
];

export const EYEWEAR_STYLES = [
  { id: 0, name: 'No Glasses', icon: '❌', tint: 'transparent', frame: 'transparent' },
  { id: 1, name: 'Cyber Goggles (Yellow)', icon: '🥽', tint: '#FACC15', frame: '#000000', opacity: 0.6 },
  { id: 2, name: 'Cyber Goggles (Mint)', icon: '🥽', tint: '#4ADE80', frame: '#000000', opacity: 0.6 },
  { id: 3, name: 'Cyber Goggles (Cyan)', icon: '🥽', tint: '#38BDF8', frame: '#000000', opacity: 0.6 },
  { id: 4, name: 'Cyber Goggles (Rose)', icon: '🥽', tint: '#F472B6', frame: '#000000', opacity: 0.6 },
  { id: 5, name: 'Retro Black Shades', icon: '🕶️', tint: '#0F172A', frame: '#000000', opacity: 0.95 },
  { id: 6, name: 'Round Wire Frames', icon: '👓', tint: 'transparent', frame: '#D97706', opacity: 0 },
];

export const OUTFIT_STYLES = [
  { id: 0, name: 'Street Puffer Jacket', icon: '🧥' },
  { id: 1, name: 'Cozy Oversized Hoodie', icon: '👕' },
  { id: 2, name: 'Adventure Scout Vest', icon: '🦺' },
  { id: 3, name: 'Cyber Track Bomber', icon: '🏁' },
  { id: 4, name: 'Casual Graphic Tee', icon: '👚' },
];

export const OUTFIT_COLORS = [
  { name: 'Cyber Cyan', base: '#06B6D4', highlight: '#67E8F9', shadow: '#0891B2' },
  { name: 'Electric Violet', base: '#8B5CF6', highlight: '#C4B5FD', shadow: '#6D28D9' },
  { name: 'Pop Yellow', base: '#FACC15', highlight: '#FEF08A', shadow: '#CA8A04' },
  { name: 'Neon Rose', base: '#F43F5E', highlight: '#FDA4AF', shadow: '#BE123C' },
  { name: 'Cyber Emerald', base: '#10B981', highlight: '#A7F3D0', shadow: '#047857' },
  { name: 'Midnight Charcoal', base: '#1E293B', highlight: '#475569', shadow: '#0F172A' },
  { name: 'Sunset Orange', base: '#FB923C', highlight: '#FED7AA', shadow: '#EA580C' },
  { name: 'Arctic White', base: '#F8FAFC', highlight: '#FFFFFF', shadow: '#CBD5E1' },
];

export const AVATAR_COLORS = HAIR_COLORS.map(c => ({ name: c.name, bg: c.base, border: '#000000', shadow: c.shadow }));
export const TOTAL_COLORS = HAIR_COLORS.length;
export const TOTAL_EYES = EYE_STYLES.length;
export const TOTAL_MOUTHS = 5;

const AVATAR_STORAGE_KEY = 'skribbl_avatar_config';

export function getSavedAvatar(): AvatarConfig {
  try {
    const raw = localStorage.getItem(AVATAR_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        colorIndex: parsed.colorIndex ?? 0,
        eyesIndex: parsed.eyesIndex ?? 0,
        mouthIndex: parsed.mouthIndex ?? 0,
        skinIndex: parsed.skinIndex ?? 0,
        hairStyle: parsed.hairStyle ?? 0,
        hairColor: parsed.hairColor ?? 0,
        eyesStyle: parsed.eyesStyle ?? 0,
        eyewearStyle: parsed.eyewearStyle ?? 1, // Default to cool goggles!
        outfitStyle: parsed.outfitStyle ?? 0,
        outfitColor: parsed.outfitColor ?? 0,
      };
    }
  } catch (_) {}
  return {
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
}

export function saveAvatar(config: AvatarConfig): void {
  try {
    localStorage.setItem(AVATAR_STORAGE_KEY, JSON.stringify(config));
  } catch (_) {}
}

export function getDeterministicAvatar(seed: string): AvatarConfig {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const pos = Math.abs(hash);
  return {
    colorIndex: pos % TOTAL_COLORS,
    eyesIndex: (pos >> 3) % TOTAL_EYES,
    mouthIndex: (pos >> 5) % TOTAL_MOUTHS,
    skinIndex: pos % SKIN_TONES.length,
    hairStyle: (pos >> 2) % HAIR_STYLES.length,
    hairColor: (pos >> 4) % HAIR_COLORS.length,
    eyesStyle: (pos >> 6) % EYE_STYLES.length,
    eyewearStyle: (pos >> 7) % EYEWEAR_STYLES.length,
    outfitStyle: (pos >> 9) % OUTFIT_STYLES.length,
    outfitColor: (pos >> 11) % OUTFIT_COLORS.length,
  };
}

interface AvatarProps {
  config?: AvatarConfig;
  seed?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'hero' | number;
  className?: string;
  animate?: boolean;
}

const SIZE_MAP: Record<string, string> = {
  xs: 'w-7 h-7',
  sm: 'w-9 h-9',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
  '2xl': 'w-36 h-36',
  hero: 'w-56 h-56 sm:w-64 sm:h-64',
};

export const Avatar: React.FC<AvatarProps> = ({
  config,
  seed,
  size = 'md',
  className = '',
  animate = false,
}) => {
  const effectiveConfig =
    config || (seed ? getDeterministicAvatar(seed) : getSavedAvatar());

  // Resolve styles safely with fallbacks
  const skin = SKIN_TONES[(effectiveConfig.skinIndex ?? 0) % SKIN_TONES.length];
  const hairStyle = (effectiveConfig.hairStyle ?? 0) % HAIR_STYLES.length;
  const hairColor = HAIR_COLORS[(effectiveConfig.hairColor ?? effectiveConfig.colorIndex ?? 0) % HAIR_COLORS.length];
  const eyesStyle = (effectiveConfig.eyesStyle ?? effectiveConfig.eyesIndex ?? 0) % EYE_STYLES.length;
  const eyewear = EYEWEAR_STYLES[(effectiveConfig.eyewearStyle ?? 1) % EYEWEAR_STYLES.length];
  const outfitStyle = (effectiveConfig.outfitStyle ?? 0) % OUTFIT_STYLES.length;
  const outfitColor = OUTFIT_COLORS[(effectiveConfig.outfitColor ?? 0) % OUTFIT_COLORS.length];

  const sizeClass = typeof size === 'string' ? SIZE_MAP[size] ?? 'w-12 h-12' : '';
  const inlineStyle = typeof size === 'number' ? { width: size, height: size } : undefined;

  return (
    <div
      style={inlineStyle}
      className={`relative inline-flex items-center justify-center shrink-0 select-none overflow-visible ${sizeClass} ${
        animate ? 'hover:scale-105 transition-transform duration-200' : ''
      } ${className}`}
    >
      <svg
        viewBox="0 0 120 140"
        className="w-full h-full overflow-visible drop-shadow-md"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Volumetric Face Lighting Gradient */}
          <radialGradient id="faceGrad" cx="45%" cy="40%" r="55%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.35" />
            <stop offset="60%" stopColor={skin.base} />
            <stop offset="100%" stopColor={skin.shadow} />
          </radialGradient>

          {/* Hair Lighting Gradient */}
          <linearGradient id="hairGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={hairColor.highlight} />
            <stop offset="35%" stopColor={hairColor.base} />
            <stop offset="100%" stopColor={hairColor.shadow} />
          </linearGradient>

          {/* Outfit Streetwear Gradient */}
          <linearGradient id="outfitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={outfitColor.highlight} />
            <stop offset="50%" stopColor={outfitColor.base} />
            <stop offset="100%" stopColor={outfitColor.shadow} />
          </linearGradient>

          {/* Glass Visor Specular Reflection */}
          <linearGradient id="visorGlint" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.75" />
            <stop offset="30%" stopColor="#FFFFFF" stopOpacity="0.1" />
            <stop offset="60%" stopColor="#FFFFFF" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* ========================================================= */}
        {/* 1. BACK HAIR LAYER (Behind head/shoulders) */}
        {/* ========================================================= */}
        {hairStyle === 0 && (
          /* Cyber Bob flared sides behind shoulders */
          <g fill={hairColor.shadow} stroke="#000000" strokeWidth="2.5">
            <path d="M 24 55 Q 12 75 16 95 Q 26 95 34 85 Z" />
            <path d="M 96 55 Q 108 75 104 95 Q 94 95 86 85 Z" />
          </g>
        )}
        {hairStyle === 3 && (
          /* Twin Pigtails */
          <g fill="url(#hairGrad)" stroke="#000000" strokeWidth="2.5">
            <ellipse cx="14" cy="72" rx="10" ry="16" transform="rotate(-15 14 72)" />
            <ellipse cx="106" cy="72" rx="10" ry="16" transform="rotate(15 106 72)" />
            {/* Pigtail Ties */}
            <circle cx="21" cy="62" r="4" fill="#F43F5E" stroke="#000000" strokeWidth="1.5" />
            <circle cx="99" cy="62" r="4" fill="#F43F5E" stroke="#000000" strokeWidth="1.5" />
          </g>
        )}

        {/* ========================================================= */}
        {/* 2. BODY & STREETWEAR OUTFIT (Quilted Puffer / Hoodie / Vest) */}
        {/* ========================================================= */}
        {/* Base Neck */}
        <rect x="52" y="80" width="16" height="18" rx="4" fill={skin.shadow} stroke="#000000" strokeWidth="2.5" />

        {/* Outfit Torso Base */}
        <g stroke="#000000" strokeWidth="3" strokeLinejoin="round">
          {outfitStyle === 0 && (
            /* Street Puffer Jacket */
            <g>
              {/* Shoulders */}
              <path d="M 22 135 L 22 106 Q 28 92 60 92 Q 92 92 98 106 L 98 135 Z" fill="url(#outfitGrad)" />
              {/* Puffer Quilted Rib Lines */}
              <path d="M 23 105 Q 60 110 97 105" stroke="#000000" strokeWidth="2" fill="none" opacity="0.6" />
              <path d="M 22 118 Q 60 124 98 118" stroke="#000000" strokeWidth="2" fill="none" opacity="0.6" />
              {/* Puffer High Collar & Scarf */}
              <path d="M 38 90 Q 60 98 82 90 Q 78 82 60 84 Q 42 82 38 90 Z" fill="#FACC15" />
              {/* Center Zipper Line */}
              <line x1="60" y1="92" x2="60" y2="135" stroke="#000000" strokeWidth="2" strokeDasharray="3 2" />
              {/* Iconic Chest Smiley Badge (from Image 1!) */}
              <circle cx="42" cy="112" r="5" fill="#FFFFFF" stroke="#000000" strokeWidth="1.5" />
              <circle cx="40.5" cy="110.5" r="0.8" fill="#000000" />
              <circle cx="43.5" cy="110.5" r="0.8" fill="#000000" />
              <path d="M 40.5 113 Q 42 115 43.5 113" stroke="#000000" strokeWidth="0.8" fill="none" />
            </g>
          )}

          {outfitStyle === 1 && (
            /* Cozy Street Hoodie */
            <g>
              <path d="M 22 135 L 24 106 Q 30 94 60 94 Q 90 94 96 106 L 98 135 Z" fill="url(#outfitGrad)" />
              {/* Hoodie Neck Rims */}
              <path d="M 36 94 Q 48 108 60 108 Q 72 108 84 94" fill="none" stroke="#000000" strokeWidth="3" />
              {/* Cords */}
              <line x1="53" y1="108" x2="52" y2="124" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
              <line x1="67" y1="108" x2="68" y2="124" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
            </g>
          )}

          {outfitStyle === 2 && (
            /* Adventure Scout Vest & Tied Scarf (from Image 3!) */
            <g>
              {/* Inner Shirt */}
              <path d="M 22 135 L 22 106 Q 30 94 60 94 Q 90 94 98 106 L 98 135 Z" fill="#F8FAFC" />
              {/* Vest Outer */}
              <path d="M 22 110 L 22 135 L 45 135 L 42 104 Z" fill="url(#outfitGrad)" />
              <path d="M 98 110 L 98 135 L 75 135 L 78 104 Z" fill="url(#outfitGrad)" />
              {/* Tied Adventure Scarf */}
              <path d="M 42 93 Q 60 102 78 93 L 64 108 L 60 114 L 56 108 Z" fill="#F97316" stroke="#000000" strokeWidth="2" />
            </g>
          )}

          {outfitStyle === 3 && (
            /* Cyber Track Bomber */
            <g>
              <path d="M 22 135 L 22 106 Q 30 94 60 94 Q 90 94 98 106 L 98 135 Z" fill="url(#outfitGrad)" />
              {/* Shoulder Contrast Stripes */}
              <path d="M 26 104 L 38 96 L 41 135 L 32 135 Z" fill="#FACC15" />
              <path d="M 94 104 L 82 96 L 79 135 L 88 135 Z" fill="#FACC15" />
              <line x1="60" y1="96" x2="60" y2="135" stroke="#000000" strokeWidth="2.5" />
            </g>
          )}

          {outfitStyle === 4 && (
            /* Casual Graphic Tee */
            <g>
              <path d="M 24 135 L 24 108 Q 30 96 60 96 Q 90 96 96 108 L 96 135 Z" fill="url(#outfitGrad)" />
              {/* Bolt Graphic */}
              <polygon points="61,108 55,119 60,119 59,127 67,116 62,116" fill="#FACC15" stroke="#000000" strokeWidth="1.5" />
            </g>
          )}
        </g>

        {/* ========================================================= */}
        {/* 3. HEAD & CHIBI FACE BASE */}
        {/* ========================================================= */}
        <g stroke="#000000" strokeWidth="3">
          {/* Rounded Chibi Head Contour */}
          <path
            d="M 28 55 C 26 28, 94 28, 92 55 C 92 78, 78 90, 60 90 C 42 90, 28 78, 28 55 Z"
            fill="url(#faceGrad)"
          />
        </g>

        {/* Ears with cute ear lines */}
        <g stroke="#000000" strokeWidth="2.5" fill={skin.base}>
          <ellipse cx="26" cy="56" rx="5" ry="8" />
          <ellipse cx="94" cy="56" rx="5" ry="8" />
        </g>

        {/* Soft Rosy Blush Cheeks (Signature Chibi Feature) */}
        <ellipse cx="38" cy="67" rx="8" ry="4.5" fill={skin.blush} opacity="0.45" />
        <ellipse cx="82" cy="67" rx="8" ry="4.5" fill={skin.blush} opacity="0.45" />

        {/* Cute Button Nose */}
        <circle cx="60" cy="62" r="1.5" fill={skin.shadow} />

        {/* ========================================================= */}
        {/* 4. EYES & EXPRESSIONS */}
        {/* ========================================================= */}
        {eyesStyle === 0 && (
          /* Chibi Sparkle Eyes */
          <g>
            {/* Left Eye */}
            <ellipse cx="44" cy="54" rx="7" ry="9" fill="#0F172A" stroke="#000000" strokeWidth="1.5" />
            <circle cx="42" cy="51" r="3" fill="#FFFFFF" />
            <circle cx="47" cy="57" r="1.5" fill="#FFFFFF" />
            {/* Right Eye */}
            <ellipse cx="76" cy="54" rx="7" ry="9" fill="#0F172A" stroke="#000000" strokeWidth="1.5" />
            <circle cx="74" cy="51" r="3" fill="#FFFFFF" />
            <circle cx="79" cy="57" r="1.5" fill="#FFFFFF" />
            {/* Cute mini brows */}
            <path d="M 38 43 Q 44 40 50 42" stroke="#000000" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M 70 42 Q 76 40 82 43" stroke="#000000" strokeWidth="2" strokeLinecap="round" fill="none" />
          </g>
        )}

        {eyesStyle === 1 && (
          /* Happy Arc Curved Eyes */
          <g stroke="#000000" strokeWidth="3.5" strokeLinecap="round" fill="none">
            <path d="M 37 54 Q 44 46 51 54" />
            <path d="M 69 54 Q 76 46 83 54" />
            <path d="M 38 44 Q 44 41 50 44" strokeWidth="2" />
            <path d="M 70 44 Q 76 41 82 44" strokeWidth="2" />
          </g>
        )}

        {eyesStyle === 2 && (
          /* Confident Wink */
          <g>
            {/* Left open sparkle eye */}
            <ellipse cx="44" cy="54" rx="7" ry="9" fill="#0F172A" />
            <circle cx="42" cy="51" r="3" fill="#FFFFFF" />
            <circle cx="47" cy="57" r="1.5" fill="#FFFFFF" />
            {/* Right wink arc */}
            <path d="M 69 54 Q 76 60 83 54" stroke="#000000" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            {/* Brows */}
            <path d="M 38 42 Q 44 39 50 42" stroke="#000000" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M 70 41 Q 76 44 82 43" stroke="#000000" strokeWidth="2" strokeLinecap="round" fill="none" />
          </g>
        )}

        {eyesStyle === 3 && (
          /* Anime Wonder */
          <g>
            <circle cx="44" cy="53" r="8.5" fill="#0F172A" />
            <circle cx="42" cy="50" r="3.5" fill="#FFFFFF" />
            <circle cx="47" cy="56" r="2" fill="#FFFFFF" />
            <circle cx="76" cy="53" r="8.5" fill="#0F172A" />
            <circle cx="74" cy="50" r="3.5" fill="#FFFFFF" />
            <circle cx="79" cy="56" r="2" fill="#FFFFFF" />
          </g>
        )}

        {eyesStyle === 4 && (
          /* Chill Low-Lid Cool Eyes */
          <g>
            <ellipse cx="44" cy="55" rx="7" ry="6" fill="#0F172A" />
            <circle cx="43" cy="54" r="2" fill="#FFFFFF" />
            <line x1="36" y1="51" x2="52" y2="51" stroke="#000000" strokeWidth="3" strokeLinecap="round" />
            <ellipse cx="76" cy="55" rx="7" ry="6" fill="#0F172A" />
            <circle cx="75" cy="54" r="2" fill="#FFFFFF" />
            <line x1="68" y1="51" x2="84" y2="51" stroke="#000000" strokeWidth="3" strokeLinecap="round" />
          </g>
        )}

        {/* Cute Smile Mouth */}
        <path
          d="M 52 72 Q 60 79 68 72"
          stroke="#000000"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />

        {/* ========================================================= */}
        {/* 5. FRONT HAIR LAYER */}
        {/* ========================================================= */}
        <g stroke="#000000" strokeWidth="3" strokeLinejoin="round">
          {hairStyle === 0 && (
            /* Cyber Chibi Bob (Signature from Image 1!) */
            <g fill="url(#hairGrad)">
              {/* Full Head Dome */}
              <path d="M 22 55 C 20 22, 100 22, 98 55 Q 98 68 94 76 Q 84 45 74 48 Q 60 38 46 48 Q 36 45 26 76 Q 22 68 22 55 Z" />
              {/* Swept Bangs */}
              <path d="M 30 38 Q 45 48 55 42 Q 62 48 76 40 Q 86 44 92 48 Q 78 30 60 30 Q 42 30 30 38 Z" fill={hairColor.highlight} />
            </g>
          )}

          {hairStyle === 1 && (
            /* Anime Spiky Wavy Flow */
            <g fill="url(#hairGrad)">
              <path d="M 24 55 Q 16 35 30 25 Q 40 12 58 18 Q 75 10 88 24 Q 102 34 96 55 Q 86 44 74 46 Q 62 38 52 46 Q 40 40 24 55 Z" />
              {/* Spikes Highlight */}
              <polygon points="56,18 64,30 50,30" fill={hairColor.highlight} />
              <polygon points="76,14 82,28 70,28" fill={hairColor.highlight} />
            </g>
          )}

          {hairStyle === 2 && (
            /* Curly Cloud Puff */
            <g fill="url(#hairGrad)">
              <circle cx="34" cy="32" r="15" />
              <circle cx="52" cy="22" r="16" />
              <circle cx="70" cy="22" r="16" />
              <circle cx="86" cy="32" r="15" />
              <circle cx="24" cy="48" r="12" />
              <circle cx="96" cy="48" r="12" />
              {/* Front Bang Curls */}
              <path d="M 35 40 Q 48 48 60 40 Q 72 48 85 40 Q 80 30 60 30 Q 40 30 35 40 Z" fill={hairColor.highlight} />
            </g>
          )}

          {hairStyle === 3 && (
            /* Twin Pigtails - Front Bangs */
            <g fill="url(#hairGrad)">
              <path d="M 26 50 C 26 26, 94 26, 94 50 Q 84 42 72 44 Q 60 38 48 44 Q 36 42 26 50 Z" />
              <path d="M 44 32 Q 60 42 76 32 Q 60 26 44 32 Z" fill={hairColor.highlight} />
            </g>
          )}

          {hairStyle === 4 && (
            /* Slick Street Undercut */
            <g fill="url(#hairGrad)">
              <path d="M 28 50 L 28 40 Q 35 18 60 18 Q 85 18 92 38 L 92 50 Q 82 42 60 40 Q 38 42 28 50 Z" />
              {/* Fade Texture lines */}
              <line x1="26" y1="46" x2="30" y2="52" stroke="#000000" strokeWidth="1.5" />
              <line x1="90" y1="46" x2="94" y2="52" stroke="#000000" strokeWidth="1.5" />
            </g>
          )}

          {hairStyle === 5 && (
            /* Street Beanie / Knit Cap */
            <g>
              {/* Beanie Crown */}
              <path d="M 26 46 C 24 16, 96 16, 94 46 Z" fill="#F43F5E" />
              {/* Turn-up Cuff Rib */}
              <rect x="22" y="38" width="76" height="14" rx="6" fill="#E11D48" stroke="#000000" strokeWidth="3" />
              {/* Mini Pom-pom / Beanie Tag */}
              <rect x="54" y="40" width="12" height="8" rx="2" fill="#FACC15" stroke="#000000" strokeWidth="1.5" />
              {/* Tufts peeking out */}
              <path d="M 30 52 Q 40 58 48 54" stroke="#000000" strokeWidth="2.5" fill="none" />
              <path d="M 72 54 Q 80 58 90 52" stroke="#000000" strokeWidth="2.5" fill="none" />
            </g>
          )}
        </g>

        {/* ========================================================= */}
        {/* 6. EYEWEAR & ACCESSORIES (Cyberpunk Visor / Goggles / Shades) */}
        {/* ========================================================= */}
        {eyewear.id >= 1 && eyewear.id <= 4 && (
          /* Chunky Cyberpunk Transparent Tinted Goggles (DIRECTLY FROM IMAGE 1!) */
          <g>
            {/* Dark Cyber Frame & Temples */}
            <path
              d="M 24 53 L 34 46 L 86 46 L 96 53 L 90 67 L 66 65 L 60 67 L 54 65 L 30 67 Z"
              fill="#000000"
              stroke="#000000"
              strokeWidth="3.5"
              strokeLinejoin="round"
            />
            {/* Left Tinted Lens with Opacity */}
            <polygon
              points="34,48 56,48 53,63 32,64"
              fill={eyewear.tint}
              opacity={eyewear.opacity}
              stroke="#000000"
              strokeWidth="2"
            />
            {/* Right Tinted Lens with Opacity */}
            <polygon
              points="64,48 86,48 88,64 67,63"
              fill={eyewear.tint}
              opacity={eyewear.opacity}
              stroke="#000000"
              strokeWidth="2"
            />
            {/* Diagonal Specular Reflection Slash (Key 3D Gloss Effect) */}
            <line x1="38" y1="50" x2="48" y2="62" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" opacity="0.85" />
            <line x1="70" y1="50" x2="80" y2="62" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" opacity="0.85" />
          </g>
        )}

        {eyewear.id === 5 && (
          /* Retro Black Sunglasses */
          <g stroke="#000000" strokeWidth="3" strokeLinejoin="round">
            {/* Thick Frame */}
            <polygon points="26,48 56,48 52,64 30,64" fill="#0F172A" />
            <polygon points="64,48 94,48 90,64 68,64" fill="#0F172A" />
            <line x1="56" y1="51" x2="64" y2="51" stroke="#000000" strokeWidth="4" />
            {/* White Glint */}
            <line x1="34" y1="51" x2="44" y2="60" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="72" y1="51" x2="82" y2="60" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        )}

        {eyewear.id === 6 && (
          /* Round Wire Geek Glasses */
          <g stroke="#D97706" strokeWidth="2.5" fill="none">
            <circle cx="43" cy="54" r="10" />
            <circle cx="77" cy="54" r="10" />
            <line x1="53" y1="54" x2="67" y2="54" strokeWidth="2" />
            <line x1="36" y1="50" x2="40" y2="56" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
          </g>
        )}
      </svg>
    </div>
  );
};
