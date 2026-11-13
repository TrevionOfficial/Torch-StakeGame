import React from 'react';
import {
  AlertTriangle,
  Crown,
  Flame,
  Shield,
  Sparkles,
  Timer,
  X,
  Zap,
} from 'lucide-react';
import { BONUS_BUY_OPTIONS } from '../engine/dungeonEngine';
import { BonusBuyOption, RgsConfig } from '../types/game';
import { formatMoney } from '../services/rgsClient';

interface BonusBuyModalProps {
  open: boolean;
  onClose: () => void;
  baseBet: number;
  balance: number;
  rgsConfig: RgsConfig;
  onSelectBonusBuy: (option: BonusBuyOption) => void;
}

export const BonusBuyModal: React.FC<BonusBuyModalProps> = ({
  open,
  onClose,
  baseBet,
  balance,
  rgsConfig,
  onSelectBonusBuy,
}) => {
  if (!open) return null;

  const standardPackages = BONUS_BUY_OPTIONS.filter((opt) => !opt.speedMode);
  const hordePackage = BONUS_BUY_OPTIONS.find((opt) => opt.speedMode);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="torch-bonus-buy-title"
    >
      <div className="relative max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-2xl border-2 border-amber-500/60 bg-obsidian-900 p-4 sm:p-5 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Bonus Buy"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-800 hover:text-white cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-3.5 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-amber-400/50 bg-gradient-to-br from-violet-600 to-amber-500">
            <Crown className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2
              id="torch-bonus-buy-title"
              className="font-serif text-xl font-black tracking-wide text-amber-300 leading-none"
            >
              Bonus Buy Vault
            </h2>
            <p className="mt-0.5 text-xs text-stone-400 tabular-nums">
              Base Bet: {formatMoney(baseBet, rgsConfig.currency, rgsConfig.unitScale)} ·
              Payouts scale against Base Bet
            </p>
          </div>
        </div>

        {/* TOP HALF: 3 Standard Packages */}
        <div className="space-y-2">
          {standardPackages.map((opt) => {
            const cost = baseBet * opt.costMultiplier;
            const affordable = balance >= cost;

            const borderStyle =
              opt.accent === 'orange'
                ? 'border-orange-500/50 bg-gradient-to-r from-[#24130b] to-[#140e0b]'
                : opt.accent === 'violet'
                ? 'border-violet-500/60 bg-gradient-to-r from-[#211133] to-[#130d1f]'
                : 'border-amber-400/70 bg-gradient-to-r from-[#2b1e0a] to-[#171108]';

            return (
              <div
                key={opt.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl border-2 p-3 ${borderStyle}`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-stone-100">
                      {opt.name}
                    </span>
                    <span className="rounded bg-black/40 px-1.5 py-0.5 text-[11px] font-bold text-amber-300 tabular-nums">
                      {opt.costMultiplier}× Bet
                    </span>
                  </div>
                  <p className="text-xs text-stone-400">{opt.subtitle}</p>
                  <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[11px] font-bold text-stone-200">
                    <span className="inline-flex items-center gap-1 text-orange-300">
                      <Flame className="h-3 w-3" />
                      {opt.perks[0]}
                    </span>
                    <span className="text-stone-600">·</span>
                    <span className="inline-flex items-center gap-1 text-sky-300">
                      <Shield className="h-3 w-3" />
                      {opt.perks[1]}
                    </span>
                    <span className="text-stone-600">·</span>
                    <span className="inline-flex items-center gap-1 text-emerald-300">
                      <Sparkles className="h-3 w-3" />
                      {opt.perks[2]}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!affordable}
                  onClick={() => onSelectBonusBuy(opt)}
                  className={[
                    'shrink-0 rounded-xl border-2 px-4 py-2 text-xs font-black tabular-nums transition-all whitespace-nowrap',
                    affordable
                      ? 'cursor-pointer border-amber-300/80 bg-gradient-to-b from-amber-400 to-orange-600 text-stone-950 shadow-torch hover:brightness-110 active:scale-95'
                      : 'cursor-not-allowed border-stone-700 bg-stone-900 text-stone-500',
                  ].join(' ')}
                >
                  Buy {formatMoney(cost, rgsConfig.currency, rgsConfig.unitScale)}
                </button>
              </div>
            );
          })}
        </div>

        {/* BOTTOM HALF: 4th Package — Horde Escape (Speed Mode) */}
        {hordePackage && (() => {
          const hordeCost = baseBet * hordePackage.costMultiplier;
          const hordeAffordable = balance >= hordeCost;
          return (
            <div className="mt-4 border-t border-rose-500/35 pt-3.5">
              <div className="mb-2 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 font-black uppercase tracking-wider text-rose-400">
                  <Zap className="h-3.5 w-3.5" />
                  <span>Speed Challenge · Horde Mode</span>
                </div>
                <span className="text-[11px] font-bold text-rose-300/85 tabular-nums">
                  4.5s Pick · 1-Hit Lethal
                </span>
              </div>

              <div className="rounded-xl border-2 border-rose-500/75 bg-gradient-to-br from-[#350d16] via-[#220a10] to-[#12070a] p-3.5 shadow-[0_0_26px_-6px_rgba(244,63,94,0.5)]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-serif text-base font-black text-rose-100">
                        {hordePackage.name}
                      </span>
                      <span className="rounded bg-black/50 px-1.5 py-0.5 text-[11px] font-black text-rose-300 tabular-nums">
                        {hordePackage.costMultiplier}× Bet
                      </span>
                    </div>
                    <p className="text-xs text-rose-100/80">
                      {hordePackage.subtitle}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={!hordeAffordable}
                    onClick={() => onSelectBonusBuy(hordePackage)}
                    className={[
                      'shrink-0 rounded-xl border-2 px-4 py-2.5 text-xs font-black tabular-nums transition-all whitespace-nowrap',
                      hordeAffordable
                        ? 'cursor-pointer border-rose-300/80 bg-gradient-to-b from-rose-500 to-red-700 text-white shadow-[0_0_18px_-3px_rgba(244,63,94,0.75)] hover:brightness-110 active:scale-95'
                        : 'cursor-not-allowed border-stone-700 bg-stone-900 text-stone-500',
                    ].join(' ')}
                  >
                    Enter Horde · {formatMoney(hordeCost, rgsConfig.currency, rgsConfig.unitScale)}
                  </button>
                </div>

                <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-rose-500/25 pt-2 text-[11px] font-bold">
                  <span className="inline-flex items-center gap-1 text-orange-300">
                    <Flame className="h-3 w-3" />
                    6 Power + 5 Armor
                  </span>
                  <span className="text-stone-600">·</span>
                  <span className="inline-flex items-center gap-1 text-amber-300">
                    <Timer className="h-3 w-3" />
                    &lt;2.0s Pick = Escalating Mult
                  </span>
                  <span className="text-stone-600">·</span>
                  <span className="inline-flex items-center gap-1 text-rose-300">
                    <AlertTriangle className="h-3 w-3" />
                    Any HP Loss or Timeout = Death
                  </span>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
