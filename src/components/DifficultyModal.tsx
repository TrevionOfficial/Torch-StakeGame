import React from 'react';
import { Flame, Heart, Shield, Skull, Sparkles, X } from 'lucide-react';
import { DifficultyMode } from '../types/game';

interface DifficultyModalProps {
  open: boolean;
  betLabel: string;
  onSelectMode: (mode: DifficultyMode) => void;
  onClose: () => void;
}

export const DifficultyModal: React.FC<DifficultyModalProps> = ({
  open,
  betLabel,
  onSelectMode,
  onClose,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="torch-difficulty-title"
    >
      <div className="relative w-full max-w-lg rounded-2xl border-2 border-amber-500/55 bg-obsidian-900 p-4 sm:p-5 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Mode Selection"
          className="absolute right-3.5 top-3.5 flex h-9 w-9 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-800 hover:text-white cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-4 pr-8">
          <h2
            id="torch-difficulty-title"
            className="font-serif text-lg sm:text-xl font-black tracking-wide text-amber-300"
          >
            Choose Run Difficulty
          </h2>
          <p className="mt-0.5 text-xs text-stone-400 tabular-nums">
            Wager: <span className="font-bold text-amber-200">{betLabel}</span> · Select
            your risk level to enter Floor 1
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Standard Mode */}
          <button
            type="button"
            onClick={() => onSelectMode('STANDARD')}
            className="group flex flex-col justify-between rounded-xl border-2 border-amber-500/50 bg-gradient-to-b from-[#1e1a13] to-[#11100d] p-4 text-left transition-all hover:border-amber-300 hover:-translate-y-0.5 hover:shadow-torch active:scale-95 cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-base font-black text-amber-200">
                  <Flame className="h-4.5 w-4.5 text-orange-400" />
                  Standard
                </span>
                <span className="rounded bg-amber-400/20 border border-amber-400/40 px-1.5 py-0.5 text-[10px] font-black text-amber-300">
                  1.00× Mult
                </span>
              </div>

              <ul className="mt-3 space-y-1.5 text-xs text-stone-300">
                <li className="flex items-center gap-2">
                  <Heart className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>
                    <strong className="text-emerald-300">20 Max HP</strong> starting pool
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                  <span>Balanced enemy scaling</span>
                </li>
              </ul>
            </div>

            <div className="mt-4 rounded-lg bg-gradient-to-b from-orange-500 to-amber-600 py-2 text-center text-xs font-black uppercase tracking-wider text-stone-950 shadow-sm group-hover:brightness-110">
              Play Standard <span className="hidden sm:inline font-mono opacity-80">[1]</span>
            </div>
          </button>

          {/* Hardcore Mode */}
          <button
            type="button"
            onClick={() => onSelectMode('HARDCORE')}
            className="group flex flex-col justify-between rounded-xl border-2 border-rose-500/60 bg-gradient-to-b from-[#2b1018] to-[#14090d] p-4 text-left transition-all hover:border-rose-300 hover:-translate-y-0.5 hover:shadow-crimson active:scale-95 cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-base font-black text-rose-200">
                  <Skull className="h-4.5 w-4.5 text-rose-400" />
                  Hardcore
                </span>
                <span className="rounded bg-rose-500/25 border border-rose-400/50 px-1.5 py-0.5 text-[10px] font-black text-rose-200">
                  1.35× Boost
                </span>
              </div>

              <ul className="mt-3 space-y-1.5 text-xs text-stone-300">
                <li className="flex items-center gap-2">
                  <Heart className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                  <span>
                    <strong className="text-rose-300">15 Max HP</strong> high stakes
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-amber-300 shrink-0" />
                  <span>
                    <strong className="text-rose-200">+2 Foe Power</strong> ·{' '}
                    <strong className="text-emerald-300">+35% Mult</strong>
                  </span>
                </li>
              </ul>
            </div>

            <div className="mt-4 rounded-lg bg-gradient-to-b from-rose-500 to-red-700 py-2 text-center text-xs font-black uppercase tracking-wider text-white shadow-sm group-hover:brightness-110">
              Play Hardcore <span className="hidden sm:inline font-mono opacity-80">[2]</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
