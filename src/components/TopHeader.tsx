import React from 'react';
import { BookOpen, Flame, Menu, Sparkles } from 'lucide-react';
import { RgsConfig } from '../types/game';
import { formatMoney } from '../services/rgsClient';

interface TopHeaderProps {
  balance: number;
  multiplier: number;
  pendingGain?: number;
  multiplierPopKey: number;
  streak: number;
  rgsConfig: RgsConfig;
  onOpenMenu: () => void;
  onOpenRules: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  balance,
  multiplier,
  pendingGain = 0,
  multiplierPopKey,
  streak,
  rgsConfig,
  onOpenMenu,
  onOpenRules,
}) => {
  return (
    <header className="relative z-20 mx-auto w-full max-w-4xl rounded-xl border border-stone-600/80 bg-obsidian-900/92 px-2.5 py-1.5 backdrop-blur-md shadow-xl">
      <div className="flex items-center justify-between gap-2">
        {/* Left: Menu + Brand + Balance (Always visible on mobile & desktop) */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <button
            type="button"
            onClick={onOpenMenu}
            aria-label="Open Game Menu"
            title="Menu"
            className="flex h-9 sm:h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-amber-400/55 bg-stone-800/95 px-2.5 sm:px-3 text-xs sm:text-sm font-black text-amber-100 shadow-sm transition-all hover:border-amber-300 hover:bg-stone-700 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 cursor-pointer"
          >
            <Menu className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-amber-300" />
            <span className="hidden sm:inline">Menu</span>
          </button>

          <div className="flex items-center gap-1.5 shrink-0">
            <div className="flex h-7 w-7 items-center justify-center rounded-md border border-amber-300/60 bg-gradient-to-br from-orange-500 to-amber-700 shadow-sm">
              <Flame className="h-4 w-4 text-amber-100" />
            </div>
            <span className="font-serif text-sm font-black tracking-widest text-amber-200 hidden md:inline">
              TORCH
            </span>
          </div>

          <span className="h-5 w-px bg-stone-700 shrink-0" aria-hidden="true" />

          <div className="flex shrink-0 items-baseline gap-1.5 text-xs sm:text-sm tabular-nums whitespace-nowrap">
            <span className="text-stone-400 font-semibold hidden md:inline">Bal</span>
            <span className="font-black text-emerald-400">
              {formatMoney(balance, rgsConfig.currency, rgsConfig.unitScale)}
            </span>
          </div>
        </div>

        {/* Right: Multiplier & Guide */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {streak >= 2 && (
            <div className="hidden md:flex items-center gap-1 rounded-lg border border-orange-400/60 bg-orange-950/70 px-2 py-1 text-xs font-black text-orange-300 tabular-nums">
              <Flame className="h-3.5 w-3.5 text-orange-400" />
              <span>{streak}x</span>
            </div>
          )}

          <div
            key={multiplierPopKey}
            className="animate-mult-pop flex h-9 sm:h-10 items-center gap-1 rounded-lg border border-amber-400/70 bg-gradient-to-r from-orange-500/25 to-amber-500/25 px-2 sm:px-2.5 text-xs sm:text-sm font-black text-amber-200 tabular-nums shadow-torch whitespace-nowrap"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-300 shrink-0" />
            <span>{multiplier.toFixed(2)}x</span>
            {pendingGain > 0 && (
              <span
                title="Pending floor earnings — banks when you pass this floor"
                className="ml-0.5 rounded bg-amber-300/20 px-1 py-0.5 text-[10px] font-black text-emerald-300"
              >
                +{pendingGain.toFixed(2)}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onOpenRules}
            aria-label="Open Game Guide"
            title="Guide"
            className="flex h-9 sm:h-10 items-center justify-center gap-1.5 rounded-lg border border-amber-400/55 bg-stone-800/95 px-2.5 sm:px-3 text-xs sm:text-sm font-black text-amber-100 shadow-sm transition-all hover:border-amber-300 hover:bg-stone-700 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 cursor-pointer whitespace-nowrap"
          >
            <BookOpen className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-amber-300 shrink-0" />
            <span>Guide</span>
          </button>
        </div>
      </div>
    </header>
  );
};
