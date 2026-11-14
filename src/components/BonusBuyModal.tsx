import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
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
import { CardArtworkSVG } from './CardArtworkSVG';

interface BonusBuyModalProps {
  open: boolean;
  onClose: () => void;
  baseBet: number;
  balance: number;
  rgsConfig: RgsConfig;
  onSelectBonusBuy: (option: BonusBuyOption) => void;
}

const ACCENT_STYLES: Record<
  BonusBuyOption['accent'],
  {
    tabActive: string;
    panel: string;
    badge: string;
    cta: string;
    Icon: React.ComponentType<{ className?: string }>;
  }
> = {
  orange: {
    tabActive:
      'border-orange-400 bg-gradient-to-r from-orange-950/90 to-[#1f110a] text-orange-100 shadow-[0_0_18px_-6px_rgba(249,115,22,0.6)]',
    panel:
      'border-orange-500/50 bg-gradient-to-b from-[#29150b] via-[#190e09] to-[#110a07]',
    badge: 'text-orange-300',
    cta: 'border-amber-300/80 bg-gradient-to-b from-amber-400 to-orange-600 text-stone-950 shadow-torch',
    Icon: Flame,
  },
  violet: {
    tabActive:
      'border-violet-400 bg-gradient-to-r from-violet-950/90 to-[#180d29] text-violet-100 shadow-[0_0_18px_-6px_rgba(139,92,246,0.6)]',
    panel:
      'border-violet-500/55 bg-gradient-to-b from-[#231238] via-[#160d24] to-[#10091a]',
    badge: 'text-violet-300',
    cta: 'border-violet-300/80 bg-gradient-to-b from-violet-500 to-purple-700 text-white shadow-[0_0_20px_-4px_rgba(139,92,246,0.65)]',
    Icon: Sparkles,
  },
  amber: {
    tabActive:
      'border-amber-300 bg-gradient-to-r from-amber-950/90 to-[#241908] text-amber-100 shadow-[0_0_20px_-6px_rgba(251,191,36,0.65)]',
    panel:
      'border-amber-400/65 bg-gradient-to-b from-[#2f210a] via-[#1c1408] to-[#120d06]',
    badge: 'text-amber-300',
    cta: 'border-amber-200/85 bg-gradient-to-b from-amber-300 via-amber-400 to-orange-600 text-stone-950 shadow-torch',
    Icon: Crown,
  },
  crimson: {
    tabActive:
      'border-rose-400 bg-gradient-to-r from-rose-950/95 to-[#210910] text-rose-100 shadow-[0_0_20px_-6px_rgba(244,63,94,0.7)]',
    panel:
      'border-rose-500/65 bg-gradient-to-b from-[#360d17] via-[#200910] to-[#13070b]',
    badge: 'text-rose-300',
    cta: 'border-rose-300/85 bg-gradient-to-b from-rose-500 to-red-700 text-white shadow-[0_0_22px_-4px_rgba(244,63,94,0.75)]',
    Icon: Zap,
  },
};

export const BonusBuyModal: React.FC<BonusBuyModalProps> = ({
  open,
  onClose,
  baseBet,
  balance,
  rgsConfig,
  onSelectBonusBuy,
}) => {
  const [selectedId, setSelectedId] = useState<BonusBuyOption['id']>('armory');

  if (!open) return null;

  const activeOption =
    BONUS_BUY_OPTIONS.find((opt) => opt.id === selectedId) ?? BONUS_BUY_OPTIONS[0];
  const theme = ACCENT_STYLES[activeOption.accent];
  const ActiveIcon = theme.Icon;
  const cost = baseBet * activeOption.costMultiplier;
  const affordable = balance >= cost;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="torch-bonus-buy-title"
    >
      <div className="relative max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-2xl border-2 border-amber-500/60 bg-obsidian-900 p-3.5 sm:p-5 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Bonus Buy"
          className="absolute right-3.5 top-3.5 flex h-9 w-9 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-800 hover:text-white cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-3.5 flex items-center gap-2.5 pr-10">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-amber-400/50 bg-gradient-to-br from-violet-600 to-amber-500">
            <Crown className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2
              id="torch-bonus-buy-title"
              className="font-serif text-lg sm:text-xl font-black tracking-wide text-amber-300 leading-none"
            >
              Bonus Buy Vault
            </h2>
            <p className="mt-1 text-[11px] sm:text-xs text-stone-400 tabular-nums">
              Base Bet: {formatMoney(baseBet, rgsConfig.currency, rgsConfig.unitScale)} ·
              Standard 20 HP · Choose a Vault loadout
            </p>
          </div>
        </div>

        {/* Master-Detail Split Layout: 2x2 Selector on Mobile / Left Roster on Desktop + Right Loadout Spotlight */}
        <div className="grid grid-cols-1 md:grid-cols-[245px_1fr] gap-3 sm:gap-4 items-stretch">
          {/* Vault Roster Selector */}
          <div
            role="tablist"
            aria-label="Bonus Buy Vault Packages"
            className="grid grid-cols-2 md:grid-cols-1 gap-2"
          >
            {BONUS_BUY_OPTIONS.map((opt) => {
              const isSelected = opt.id === activeOption.id;
              const optTheme = ACCENT_STYLES[opt.accent];
              const OptIcon = optTheme.Icon;
              const optCost = baseBet * opt.costMultiplier;
              const canBuy = balance >= optCost;

              return (
                <button
                  key={opt.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setSelectedId(opt.id)}
                  className={[
                    'flex flex-col justify-between rounded-xl border-2 px-3 py-2.5 text-left transition-all cursor-pointer',
                    isSelected
                      ? optTheme.tabActive
                      : 'border-stone-700/80 bg-stone-950/75 text-stone-300 hover:border-stone-500 hover:bg-stone-900',
                    !canBuy && !isSelected ? 'opacity-60' : '',
                  ].join(' ')}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <OptIcon className={`h-4 w-4 shrink-0 ${optTheme.badge}`} />
                      <span className="truncate font-serif text-xs sm:text-sm font-black">
                        {opt.name}
                      </span>
                    </div>
                    <span className="shrink-0 text-[11px] font-black text-amber-300 tabular-nums">
                      {opt.costMultiplier}×
                    </span>
                  </div>

                  <div className="mt-1 flex items-center justify-between gap-1 text-[10px] font-bold text-stone-400 tabular-nums">
                    <span>
                      {opt.speedMode ? 'Speed Mode' : `Floor ${opt.startingFloor}`} ·{' '}
                      {opt.startingMultiplier.toFixed(2)}×
                    </span>
                    <span className={canBuy ? 'text-emerald-400' : 'text-rose-400'}>
                      {formatMoney(optCost, rgsConfig.currency, rgsConfig.unitScale)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Loadout Spotlight & Instant Buy */}
          <div
            role="tabpanel"
            className={`flex flex-col justify-between rounded-xl border-2 p-3.5 sm:p-4 ${theme.panel}`}
          >
            <div>
              {/* Active Vault Title + Metrics Row */}
              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-black/35">
                    <ActiveIcon className={`h-5 w-5 ${theme.badge}`} />
                  </div>
                  <div>
                    <h3 className="font-serif text-base sm:text-lg font-black text-stone-100 leading-tight">
                      {activeOption.name}
                    </h3>
                    <p className="text-xs text-stone-300/80">{activeOption.subtitle}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-xs font-black tabular-nums">
                  <span className="text-stone-300">
                    Start <strong className="text-amber-300">F{activeOption.startingFloor}</strong>
                  </span>
                  <span className="text-stone-600">·</span>
                  <span className="text-emerald-400">
                    {activeOption.startingMultiplier.toFixed(2)}× Start
                  </span>
                  {activeOption.multBoost && activeOption.multBoost > 1 && (
                    <>
                      <span className="text-stone-600">·</span>
                      <span className="text-violet-300">
                        {activeOption.multBoost.toFixed(2)}× Speed
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Starting Gear Visual Cards */}
              <div className="mt-3 grid grid-cols-2 gap-2.5">
                <div className="flex items-center gap-2.5 rounded-xl border border-orange-500/35 bg-black/35 p-2.5">
                  <CardArtworkSVG
                    type="WEAPON"
                    variant={activeOption.weapon.variant}
                    className="h-10 w-10 sm:h-12 sm:w-12 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-orange-400">
                      Weapon
                    </div>
                    <div className="truncate text-xs sm:text-sm font-black text-stone-100">
                      {activeOption.weapon.name}
                    </div>
                    <div className="text-xs font-black text-orange-300 tabular-nums">
                      {activeOption.weapon.power} Power
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 rounded-xl border border-sky-500/35 bg-black/35 p-2.5">
                  <CardArtworkSVG
                    type="SHIELD"
                    variant={activeOption.shield.variant}
                    className="h-10 w-10 sm:h-12 sm:w-12 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
                      Shield
                    </div>
                    <div className="truncate text-xs sm:text-sm font-black text-stone-100">
                      {activeOption.shield.name}
                    </div>
                    <div className="text-xs font-black text-sky-300 tabular-nums">
                      {activeOption.shield.armor} Armor
                    </div>
                  </div>
                </div>
              </div>

              {/* Vault Perks & Rules */}
              <div className="mt-3 space-y-1.5 text-xs font-semibold">
                {activeOption.perks.map((perk, idx) => (
                  <div
                    key={`${activeOption.id}-perk-${idx}`}
                    className="flex items-center gap-2 text-stone-200"
                  >
                    <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 ${theme.badge}`} />
                    <span>{perk}</span>
                  </div>
                ))}

                {activeOption.speedMode && (
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-rose-500/35 bg-rose-950/45 px-2.5 py-1.5 text-[11px] font-bold text-rose-200">
                    <span className="inline-flex items-center gap-1">
                      <Timer className="h-3.5 w-3.5 text-amber-300" />
                      4.5s Pick · &lt;2.0s = Speed Bonus
                    </span>
                    <span className="inline-flex items-center gap-1 text-rose-300">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Any HP Loss or Timeout = Death
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Buy Action Footer */}
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-t border-white/10 pt-3">
              <div className="text-xs tabular-nums">
                <div className="text-stone-400">
                  Vault Entry ({activeOption.costMultiplier}× Base Bet)
                </div>
                <div className="text-base font-black text-amber-300">
                  {formatMoney(cost, rgsConfig.currency, rgsConfig.unitScale)}
                </div>
              </div>

              <button
                type="button"
                disabled={!affordable}
                onClick={() => onSelectBonusBuy(activeOption)}
                className={[
                  'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border-2 px-6 py-2.5 text-xs sm:text-sm font-black tabular-nums transition-all whitespace-nowrap',
                  affordable
                    ? `cursor-pointer hover:brightness-110 active:scale-95 ${theme.cta}`
                    : 'cursor-not-allowed border-stone-700 bg-stone-900 text-stone-500',
                ].join(' ')}
              >
                {activeOption.speedMode ? (
                  <Zap className="h-4 w-4 shrink-0" />
                ) : (
                  <Shield className="h-4 w-4 shrink-0" />
                )}
                <span>
                  {affordable
                    ? `${activeOption.speedMode ? 'Enter Horde' : 'Buy Vault'} · ${formatMoney(
                        cost,
                        rgsConfig.currency,
                        rgsConfig.unitScale
                      )}`
                    : 'Insufficient Balance'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
