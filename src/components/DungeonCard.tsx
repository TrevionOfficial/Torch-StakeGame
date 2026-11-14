import React from 'react';
import {
  ArrowDownRight,
  Check,
  Coins,
  Crown,
  Flame,
  Heart,
  Shield,
  Skull,
  Sparkles,
  Store,
  Swords,
} from 'lucide-react';
import {
  CardType,
  DifficultyMode,
  DungeonCardData,
  HeroState,
} from '../types/game';
import {
  getGearSalvagePreview,
  previewMonsterCombat,
  scaleMultiplierGain,
} from '../engine/dungeonEngine';
import { CardArtworkSVG } from './CardArtworkSVG';

interface DungeonCardProps {
  card: DungeonCardData;
  hero: HeroState;
  difficulty?: DifficultyMode;
  multBoost?: number;
  floor?: number;
  isHorde?: boolean;
  disabled: boolean;
  isSlashing: boolean;
  onSelect: (card: DungeonCardData, cardIndex: number) => void;
  index: number;
}

const CARD_THEMES: Record<
  CardType,
  {
    stoneBorder: string;
    hoverBorder: string;
    headerBg: string;
    innerBg: string;
    badge: string;
    label: string;
    glow: string;
    hoverSheen: string;
    Icon: React.ComponentType<{ className?: string }>;
  }
> = {
  MONSTER: {
    stoneBorder: 'border-stone-500/85',
    hoverBorder: 'sm:hover:border-red-400',
    headerBg: 'bg-red-900/85 border-b border-red-500/40 text-red-100',
    innerBg: 'from-[#2a121b] via-[#1c0f16] to-[#110b10]',
    badge: 'bg-red-600 text-white border-red-300/60',
    label: 'Monster',
    glow: 'sm:hover:shadow-[0_14px_28px_-6px_rgba(239,68,68,0.5)]',
    hoverSheen: 'from-red-400/20 via-transparent to-transparent',
    Icon: Skull,
  },
  BOSS: {
    stoneBorder: 'border-amber-400/90',
    hoverBorder: 'sm:hover:border-amber-200',
    headerBg:
      'bg-gradient-to-r from-red-900/95 via-rose-900/95 to-amber-800/90 border-b border-amber-400/60 text-amber-100',
    innerBg: 'from-[#3b0f1b] via-[#240a14] to-[#14060a]',
    badge: 'bg-amber-300 text-stone-950 border-white',
    label: 'Boss',
    glow: 'sm:hover:shadow-[0_16px_34px_-4px_rgba(245,158,11,0.65)]',
    hoverSheen: 'from-amber-300/25 via-rose-500/10 to-transparent',
    Icon: Crown,
  },
  GOLD: {
    stoneBorder: 'border-amber-500/80',
    hoverBorder: 'sm:hover:border-amber-300',
    headerBg: 'bg-amber-900/80 border-b border-amber-400/40 text-amber-100',
    innerBg: 'from-[#2e200a] via-[#1d1509] to-[#120e07]',
    badge: 'bg-amber-400 text-stone-950 border-amber-100',
    label: 'Gold',
    glow: 'sm:hover:shadow-[0_14px_28px_-6px_rgba(251,191,36,0.55)]',
    hoverSheen: 'from-amber-300/22 via-transparent to-transparent',
    Icon: Coins,
  },
  SHIELD: {
    stoneBorder: 'border-sky-500/80',
    hoverBorder: 'sm:hover:border-sky-300',
    headerBg: 'bg-sky-900/85 border-b border-sky-400/40 text-sky-100',
    innerBg: 'from-[#0d2233] via-[#0b1724] to-[#081018]',
    badge: 'bg-sky-400 text-slate-950 border-sky-100',
    label: 'Shield',
    glow: 'sm:hover:shadow-[0_14px_28px_-6px_rgba(56,189,248,0.52)]',
    hoverSheen: 'from-sky-300/22 via-transparent to-transparent',
    Icon: Shield,
  },
  WEAPON: {
    stoneBorder: 'border-orange-500/80',
    hoverBorder: 'sm:hover:border-orange-300',
    headerBg: 'bg-orange-900/85 border-b border-orange-400/40 text-orange-100',
    innerBg: 'from-[#2e170c] via-[#1d1009] to-[#120b07]',
    badge: 'bg-orange-500 text-stone-950 border-orange-200',
    label: 'Weapon',
    glow: 'sm:hover:shadow-[0_14px_28px_-6px_rgba(249,115,22,0.55)]',
    hoverSheen: 'from-orange-300/22 via-transparent to-transparent',
    Icon: Flame,
  },
  POTION: {
    stoneBorder: 'border-emerald-500/80',
    hoverBorder: 'sm:hover:border-emerald-300',
    headerBg: 'bg-emerald-900/85 border-b border-emerald-400/40 text-emerald-100',
    innerBg: 'from-[#0c291f] via-[#091c16] to-[#07120e]',
    badge: 'bg-emerald-400 text-stone-950 border-emerald-100',
    label: 'Potion',
    glow: 'sm:hover:shadow-[0_14px_28px_-6px_rgba(16,185,129,0.52)]',
    hoverSheen: 'from-emerald-300/22 via-transparent to-transparent',
    Icon: Heart,
  },
  SPELL: {
    stoneBorder: 'border-pink-500/80',
    hoverBorder: 'sm:hover:border-pink-300',
    headerBg: 'bg-fuchsia-950/90 border-b border-pink-400/40 text-pink-100',
    innerBg: 'from-[#2c112a] via-[#1c0c20] to-[#120916]',
    badge: 'bg-pink-500 text-white border-pink-200',
    label: 'Spell',
    glow: 'sm:hover:shadow-[0_14px_28px_-6px_rgba(236,72,153,0.52)]',
    hoverSheen: 'from-pink-300/22 via-transparent to-transparent',
    Icon: Sparkles,
  },
  BONUS: {
    stoneBorder: 'border-violet-400/85',
    hoverBorder: 'sm:hover:border-amber-300',
    headerBg:
      'bg-gradient-to-r from-violet-900/90 to-amber-900/80 border-b border-amber-400/50 text-amber-100',
    innerBg: 'from-[#2b1544] via-[#1e1030] to-[#120a1f]',
    badge: 'bg-amber-300 text-stone-950 border-white',
    label: 'Bonus',
    glow: 'sm:hover:shadow-[0_16px_30px_-4px_rgba(167,139,250,0.62)]',
    hoverSheen: 'from-amber-200/22 via-violet-400/10 to-transparent',
    Icon: Crown,
  },
  MERCHANT_ITEM: {
    stoneBorder: 'border-amber-400/85',
    hoverBorder: 'sm:hover:border-yellow-300',
    headerBg:
      'bg-gradient-to-r from-amber-900/90 to-yellow-900/80 border-b border-amber-400/50 text-amber-100',
    innerBg: 'from-[#2b1f0b] via-[#1e1609] to-[#120d06]',
    badge: 'bg-amber-300 text-stone-950 border-amber-100',
    label: 'Merchant',
    glow: 'sm:hover:shadow-[0_14px_28px_-6px_rgba(251,191,36,0.58)]',
    hoverSheen: 'from-yellow-200/22 via-transparent to-transparent',
    Icon: Store,
  },
  SHRINE_BOON: {
    stoneBorder: 'border-cyan-400/85',
    hoverBorder: 'sm:hover:border-violet-300',
    headerBg:
      'bg-gradient-to-r from-cyan-950/95 to-violet-950/90 border-b border-cyan-400/50 text-cyan-100',
    innerBg: 'from-[#0e2638] via-[#161533] to-[#0b0b1a]',
    badge: 'bg-cyan-300 text-slate-950 border-cyan-100',
    label: 'Shrine',
    glow: 'sm:hover:shadow-[0_14px_28px_-6px_rgba(56,189,248,0.55)]',
    hoverSheen: 'from-cyan-300/22 via-transparent to-transparent',
    Icon: Sparkles,
  },
  EXIT: {
    stoneBorder: 'border-emerald-400/85',
    hoverBorder: 'sm:hover:border-emerald-200',
    headerBg:
      'bg-emerald-950/95 border-b border-emerald-400/50 text-emerald-100',
    innerBg: 'from-[#0b2a20] via-[#091c16] to-[#06120e]',
    badge: 'bg-emerald-400 text-stone-950 border-emerald-100',
    label: 'Descend',
    glow: 'sm:hover:shadow-[0_14px_28px_-6px_rgba(16,185,129,0.55)]',
    hoverSheen: 'from-emerald-300/22 via-transparent to-transparent',
    Icon: ArrowDownRight,
  },
};

export const DungeonCard: React.FC<DungeonCardProps> = ({
  card,
  hero,
  difficulty = 'STANDARD',
  multBoost = 1,
  floor = 1,
  isHorde = false,
  disabled,
  isSlashing,
  onSelect,
  index,
}) => {
  if (card.cleared) {
    return (
      <div className="relative flex h-[106px] sm:h-[172px] w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-stone-700/70 bg-stone-950/50 text-stone-500">
        <div className="mb-1 flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded border border-stone-800 bg-stone-900/70">
          <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-stone-500" />
        </div>
        <span className="text-xs sm:text-[13px] font-semibold text-stone-500">Cleared</span>
      </div>
    );
  }

  const theme = CARD_THEMES[card.type];
  const TypeIcon = theme.Icon;
  const isEnemy = card.type === 'MONSTER' || card.type === 'BOSS';
  const combatPreview = isEnemy
    ? previewMonsterCombat(
        card.value,
        hero,
        card.rewardMult,
        difficulty,
        isHorde,
        multBoost,
        floor
      )
    : null;
  const salvagePreview = getGearSalvagePreview(card, hero);
  const scaledBonusMult =
    card.type === 'BONUS'
      ? scaleMultiplierGain(card.value / 100, difficulty, multBoost, floor)
      : 0;

  const cantAffordGold =
    card.type === 'MERCHANT_ITEM' && hero.gold < (card.goldCost ?? 0);
  const alreadyFullHp =
    (card.type === 'MERCHANT_ITEM' || card.type === 'SHRINE_BOON') &&
    card.effectKind === 'HEAL' &&
    hero.hp >= hero.maxHp;
  const effectiveDisabled = disabled || cantAffordGold || alreadyFullHp;

  const badgeText =
    card.type === 'BONUS'
      ? `+${scaledBonusMult.toFixed(2)}x`
      : card.type === 'MERCHANT_ITEM'
      ? `${card.goldCost ?? 0}G`
      : card.type === 'SHRINE_BOON'
      ? 'Boon'
      : card.type === 'EXIT'
      ? `F${card.value}`
      : card.value;

  const specialTag = card.enraged
    ? 'Enraged'
    : card.carriedOver
    ? 'Held'
    : card.type === 'BOSS' ||
      card.type === 'BONUS' ||
      card.type === 'MERCHANT_ITEM' ||
      card.type === 'SHRINE_BOON' ||
      card.type === 'EXIT'
    ? theme.label
    : '';

  return (
    <button
      type="button"
      disabled={effectiveDisabled}
      onClick={() => onSelect(card, index)}
      style={{ animationDelay: `${card.dealDelayMs ?? 0}ms` }}
      className={[
        'group relative flex h-[106px] sm:h-[172px] w-full flex-col justify-between overflow-hidden rounded-xl border-2 sm:border-[3px] bg-gradient-to-b text-left transition-[transform,box-shadow,border-color,opacity] duration-150 ease-out select-none shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400',
        theme.stoneBorder,
        theme.innerBg,
        isSlashing ? 'animate-card-resolve' : 'animate-deal',
        effectiveDisabled
          ? 'cursor-not-allowed opacity-60'
          : `cursor-pointer ${theme.hoverBorder} ${theme.glow} sm:hover:-translate-y-1.5 sm:hover:scale-[1.02] active:translate-y-0 active:scale-[0.97]`,
      ].join(' ')}
    >
      {!effectiveDisabled && (
        <div
          className={`pointer-events-none absolute inset-0 bg-gradient-to-b ${theme.hoverSheen} opacity-0 transition-opacity duration-150 sm:group-hover:opacity-100`}
          aria-hidden="true"
        />
      )}

      {/* Compact Top Value & Optional Special Tag Bar */}
      <div
        className={`relative z-10 flex shrink-0 items-center ${
          specialTag ? 'justify-between' : 'justify-end'
        } px-1.5 py-0.5 sm:px-2.5 sm:py-1 ${theme.headerBg}`}
      >
        {specialTag && (
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider truncate">
            {specialTag}
          </span>
        )}
        <span
          className={`inline-flex items-center gap-0.5 rounded border px-1.5 py-0.5 text-[11px] sm:text-[13px] font-black tabular-nums ${theme.badge}`}
        >
          <TypeIcon className="h-3 w-3" />
          {badgeText}
        </span>
      </div>

      {/* Center SVG Illustration */}
      <div className="relative z-10 my-auto flex items-center justify-center transition-transform duration-150 ease-out sm:group-hover:scale-105">
        <CardArtworkSVG
          type={card.type}
          variant={card.variant}
          className="h-10 w-10 sm:h-[72px] sm:w-[72px] drop-shadow-[0_6px_12px_rgba(0,0,0,0.65)]"
        />
      </div>

      {/* Bottom Name & Action / Combat Breakdown */}
      <div className="relative z-10 shrink-0 bg-black/65 px-2 py-1 sm:py-1.5 border-t border-white/10">
        <div className="flex items-center justify-center gap-1 truncate text-center text-xs sm:text-sm font-black text-stone-100 leading-tight">
          {!effectiveDisabled && (
            <span className="hidden sm:inline-block font-mono text-[11px] font-bold text-stone-400">
              [{index + 1}]
            </span>
          )}
          <span className="truncate">{card.name}</span>
        </div>

        {combatPreview ? (
          <div className="mt-0.5 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0 text-[10px] sm:text-xs font-bold leading-tight tabular-nums">
            {combatPreview.weaponAbsorbed > 0 && (
              <span className="inline-flex items-center gap-0.5 text-orange-300">
                <Swords className="h-3 w-3" />-{combatPreview.weaponAbsorbed}
              </span>
            )}
            {combatPreview.shieldAbsorbed > 0 && (
              <span className="inline-flex items-center gap-0.5 text-sky-300">
                <Shield className="h-3 w-3" />-{combatPreview.shieldAbsorbed}
              </span>
            )}
            <span
              className={
                combatPreview.isLethal
                  ? 'text-red-400 font-extrabold'
                  : combatPreview.hpDamage === 0
                  ? 'text-emerald-400'
                  : 'text-red-300'
              }
            >
              {combatPreview.hpDamage === 0
                ? '0 HP'
                : combatPreview.isLethal
                ? isHorde
                  ? `FATAL (-${combatPreview.hpDamage})`
                  : `LETHAL (-${combatPreview.hpDamage})`
                : `-${combatPreview.hpDamage} HP`}
            </span>
            {card.type === 'BOSS' && card.rewardMult && (
              <span className="text-amber-300">
                · +{card.rewardMult.toFixed(2)}x
              </span>
            )}
          </div>
        ) : (
          <div
            className={`mt-0.5 truncate text-center text-[10px] sm:text-xs font-semibold leading-tight tabular-nums ${
              cantAffordGold || alreadyFullHp
                ? 'text-rose-300'
                : salvagePreview.isSalvage
                ? 'text-amber-300 font-bold'
                : 'text-stone-300'
            }`}
          >
            {cantAffordGold && `Need ${card.goldCost} Gold`}
            {!cantAffordGold && alreadyFullHp && 'Already Full HP'}
            {!cantAffordGold && !alreadyFullHp && (
              <>
                {salvagePreview.isSalvage
                  ? card.type === 'WEAPON'
                    ? `Salvage: +${salvagePreview.temperAmount} Pwr · +${salvagePreview.goldGain}G`
                    : `Salvage: +${salvagePreview.temperAmount} Arm · +${salvagePreview.goldGain}G`
                  : card.subtitle ??
                    (card.type === 'WEAPON'
                      ? `Equip ${card.value} Power`
                      : card.type === 'SHIELD'
                      ? `Equip ${card.value} Armor`
                      : card.type === 'POTION'
                      ? `Heal +${card.value} HP`
                      : card.type === 'GOLD'
                      ? `+${card.value} Gold · Mult`
                      : card.type === 'SPELL'
                      ? `+1 HP · Bonus Mult`
                      : card.type === 'BONUS'
                      ? `+${scaledBonusMult.toFixed(2)}x · +1 HP`
                      : '')}
              </>
            )}
          </div>
        )}
      </div>
    </button>
  );
};
