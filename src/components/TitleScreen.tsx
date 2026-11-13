import React, { useState } from 'react';
import { BookOpen, Compass, Play, Sparkles } from 'lucide-react';
import { formatMoney } from '../services/rgsClient';
import { RgsConfig } from '../types/game';

interface TitleScreenProps {
  balance: number;
  rgsConfig: RgsConfig;
  authLoading: boolean;
  onPlay: () => void;
  onOpenRules: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  balance,
  rgsConfig,
  authLoading,
  onPlay,
  onOpenRules,
}) => {
  const [logoError, setLogoError] = useState(false);

  return (
    <div className="relative z-10 flex h-full w-full flex-col justify-between overflow-hidden pb-6">
      {/* Top Bar: Isolated Large Logo (Top-Left) + Guide & Balance (Top-Right) */}
      <div className="relative z-10 flex items-start justify-between gap-3 px-4 pt-3 sm:px-8 sm:pt-4">
        <div className="shrink-0">
          {!logoError ? (
            <img
              src="./assets/aistudio/Gemini_Generated_Image_y5spcxy5spcxy5sp-removebg-preview_40cf27e5.png"
              alt="Compass Gaming"
              referrerPolicy="no-referrer"
              onError={() => setLogoError(true)}
              className="h-20 sm:h-28 w-auto max-w-[260px] sm:max-w-[360px] object-contain drop-shadow-[0_4px_18px_rgba(0,0,0,0.92)]"
            />
          ) : (
            <Compass className="h-16 w-16 sm:h-20 sm:w-20 text-orange-400 drop-shadow-[0_4px_14px_rgba(0,0,0,0.9)]" />
          )}
        </div>

        <div className="flex items-center gap-2 pt-1.5">
          <button
            type="button"
            onClick={onOpenRules}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-amber-400/50 bg-stone-900/90 px-3.5 text-xs sm:text-sm font-bold text-amber-100 shadow-md transition-colors hover:border-amber-300 hover:bg-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 cursor-pointer"
          >
            <BookOpen className="h-4 w-4 text-amber-300" />
            <span>Guide</span>
          </button>

          <div className="flex h-10 items-center rounded-xl border border-amber-500/45 bg-stone-950/85 px-3.5 text-xs sm:text-sm font-black text-emerald-400 tabular-nums shadow-md">
            {authLoading
              ? '...'
              : formatMoney(balance, rgsConfig.currency, rgsConfig.unitScale)}
          </div>
        </div>
      </div>

      {/* Center Heroic Showcase: Title + Radiant Chest + PLAY Button (centered vertically) */}
      <div className="relative z-10 mx-auto my-auto -mt-2 sm:-mt-4 flex max-w-2xl flex-1 flex-col items-center justify-center px-4 text-center">
        <div className="mb-1 flex items-center gap-3">
          <span className="h-px w-10 sm:w-16 bg-gradient-to-r from-transparent to-amber-400/80" />
          <Sparkles className="h-4 w-4 text-amber-300" />
          <span className="h-px w-10 sm:w-16 bg-gradient-to-l from-transparent to-amber-400/80" />
        </div>

        <h1 className="font-serif text-5xl sm:text-7xl font-black tracking-[0.18em] text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-400 to-orange-600 drop-shadow-[0_6px_22px_rgba(245,158,11,0.45)] select-none">
          TORCH
        </h1>
        <p className="mt-1.5 text-xs sm:text-sm font-medium tracking-wide text-stone-200 drop-shadow">
          Brave the crypt, wield flame &amp; steel, and clear floors to claim your multiplier.
        </p>

        {/* Central Glowing Chest Illustration with Golden Light Rays */}
        <div className="relative my-3 sm:my-5 flex items-center justify-center">
          <svg
            viewBox="0 0 260 220"
            className="h-40 w-48 sm:h-54 sm:w-64 drop-shadow-[0_12px_30px_rgba(245,158,11,0.38)]"
            fill="none"
            aria-hidden="true"
          >
            <defs>
              <radialGradient id="chestBeam" cx="50%" cy="60%" r="55%">
                <stop offset="0%" stopColor="#fef08a" stopOpacity="0.92" />
                <stop offset="45%" stopColor="#f59e0b" stopOpacity="0.36" />
                <stop offset="100%" stopColor="#78350f" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="rayGrad" x1="0.5" y1="1" x2="0.5" y2="0">
                <stop offset="0%" stopColor="#fde047" stopOpacity="0.58" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
              </linearGradient>
            </defs>

            <circle cx="130" cy="128" r="98" fill="url(#chestBeam)" />
            <polygon points="130,126 88,18 118,12" fill="url(#rayGrad)" />
            <polygon points="130,126 142,12 172,18" fill="url(#rayGrad)" />
            <polygon points="130,126 32,58 58,34" fill="url(#rayGrad)" />
            <polygon points="130,126 202,34 228,58" fill="url(#rayGrad)" />

            <path
              d="M58 108 L74 60 L186 64 L198 112 Z"
              fill="#5c280e"
              stroke="#fbbf24"
              strokeWidth="4"
            />
            <path d="M74 60 Q130 44 186 64" stroke="#fde68a" strokeWidth="3" fill="none" />

            <circle cx="96" cy="102" r="13" fill="#fbbf24" stroke="#fef08a" strokeWidth="2" />
            <circle cx="118" cy="95" r="14" fill="#f59e0b" stroke="#fef08a" strokeWidth="2" />
            <circle cx="142" cy="96" r="14" fill="#fbbf24" stroke="#fef08a" strokeWidth="2" />
            <circle cx="164" cy="103" r="13" fill="#f59e0b" stroke="#fef08a" strokeWidth="2" />
            <circle cx="108" cy="111" r="13" fill="#f59e0b" stroke="#fef08a" strokeWidth="2" />
            <circle cx="130" cy="109" r="15" fill="#fde047" stroke="#ffffff" strokeWidth="2" />
            <circle cx="152" cy="111" r="13" fill="#fbbf24" stroke="#fef08a" strokeWidth="2" />

            <path
              d="M54 112 L206 112 L198 184 L62 184 Z"
              fill="#7c3614"
              stroke="#fbbf24"
              strokeWidth="4"
            />
            <path d="M84 112 L88 184 M176 112 L172 184" stroke="#fbbf24" strokeWidth="6" />
            <path d="M58 144 L202 144" stroke="#451a03" strokeWidth="4" />
            <rect
              x="116"
              y="116"
              width="28"
              height="34"
              rx="5"
              fill="#fbbf24"
              stroke="#78350f"
              strokeWidth="3"
            />
            <circle cx="130" cy="131" r="4.5" fill="#78350f" />
            <path d="M128 134 L132 134 L133 143 L127 143 Z" fill="#78350f" />
          </svg>
        </div>

        <button
          type="button"
          disabled={authLoading}
          onClick={onPlay}
          className="group relative inline-flex min-h-[54px] min-w-[220px] items-center justify-center gap-3 rounded-xl border-2 border-amber-200/80 bg-gradient-to-b from-amber-400 via-orange-500 to-amber-700 px-10 py-3.5 text-lg font-black tracking-[0.16em] text-stone-950 shadow-[0_0_32px_rgba(249,115,22,0.55),inset_0_2px_0_rgba(255,255,255,0.45)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 disabled:opacity-60 cursor-pointer"
        >
          <Play className="h-5 w-5 fill-stone-950 transition-transform group-hover:scale-110" />
          <span>{authLoading ? 'LOADING...' : 'PLAY'}</span>
        </button>
      </div>
    </div>
  );
};
