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
} from '../engine/dungeonEngine';
import { CardArtworkSVG } from './CardArtworkSVG';

interface DungeonCardProps {
  card: DungeonCardData;
  hero: HeroState;
  difficulty?: DifficultyMode;
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
    headerBg: string;
    innerBg: string;
    badge: string;
    label: string;
    glow: string;
    Icon: React.ComponentType<{ className?: string }>;
  }
> = {
  MONSTER: {
    stoneBorder: 'border-stone-500/85 hover:border-red-400',
    headerBg: 'bg-red-900/85 border-b border-red-500/40 text-red-100',
    innerBg: 'from-[#2a121b] via-[#1c0f16] to-[#110b10]',
    badge: 'bg-red-600 text-white border-red-300/60',
    label: 'Monster',
    glow: 'hover:shadow-crimson',
    Icon: Skull,
  },
  BOSS: {
    stoneBorder: 'border-amber-400/90 hover:border-red-300',
    headerBg:
      'bg-gradient-to-r from-red-900/95 via-rose-900/95 to-amber-800/90 border-b border-amber-400/60 text-amber-100',
    innerBg: 'from-[#3b0f1b] via-[#240a14] to-[#14060a]',
    badge: 'bg-amber-300 text-stone-950 border-white',
    label: 'Boss',
    glow: 'hover:shadow-[0_0_28px_-2px_rgba(245,158,11,0.65)]',
    Icon: Crown,
  },
  GOLD: {
    stoneBorder: 'border-amber-500/80 hover:border-amber-300',
    headerBg: 'bg-amber-900/80 border-b border-amber-400/40 text-amber-100',
    innerBg: 'from-[#2e200a] via-[#1d1509] to-[#120e07]',
    badge: 'bg-amber-400 text-stone-950 border-amber-100',
    label: 'Gold',
    glow: 'hover:shadow-[0_0_24px_-4px_rgba(251,191,36,0.5)]',
    Icon: Coins,
  },
  SHIELD: {
    stoneBorder: 'border-sky-500/80 hover:border-sky-300',
    headerBg: 'bg-sky-900/85 border-b border-sky-400/40 text-sky-100',
    innerBg: 'from-[#0d2233] via-[#0b1724] to-[#081018]',
    badge: 'bg-sky-400 text-slate-950 border-sky-100',
    label: 'Shield',
    glow: 'hover:shadow-[0_0_24px_-4px_rgba(56,189,248,0.5)]',
    Icon: Shield,
  },
  WEAPON: {
    stoneBorder: 'border-orange-500/80 hover:border-orange-300',
    headerBg: 'bg-orange-900/85 border-b border-orange-400/40 text-orange-100',
    innerBg: 'from-[#2e170c] via-[#1d1009] to-[#120b07]',
    badge: 'bg-orange-500 text-stone-950 border-orange-200',
    label: 'Weapon',
    glow: 'hover:shadow-torch',
    Icon: Flame,
  },
  POTION: {
    stoneBorder: 'border-emerald-500/80 hover:border-emerald-300',
    headerBg: 'bg-emerald-900/85 border-b border-emerald-400/40 text-emerald-100',
    innerBg: 'from-[#0c291f] via-[#091c16] to-[#07120e]',
    badge: 'bg-emerald-400 text-stone-950 border-emerald-100',
    label: 'Potion',
    glow: 'hover:shadow-emerald-glow',
    Icon: Heart,
  },
  SPELL: {
    stoneBorder: 'border-pink-500/80 hover:border-pink-300',
    headerBg: 'bg-fuchsia-950/90 border-b border-pink-400/40 text-pink-100',
    innerBg: 'from-[#2c112a] via-[#1c0c20] to-[#120916]',
    badge: 'bg-pink-500 text-white border-pink-200',
    label: 'Spell',
    glow: 'hover:shadow-[0_0_24px_-4px_rgba(236,72,153,0.5)]',
    Icon: Sparkles,
  },
  BONUS: {
    stoneBorder: 'border-violet-400/85 hover:border-amber-300',
    headerBg:
      'bg-gradient-to-r from-violet-900/90 to-amber-900/80 border-b border-amber-400/50 text-amber-100',
    innerBg: 'from-[#2b1544] via-[#1e1030] to-[#120a1f]',
    badge: 'bg-amber-300 text-stone-950 border-white',
    label: 'Bonus',
    glow: 'hover:shadow-[0_0_26px_-2px_rgba(167,139,250,0.6)]',
    Icon: Crown,
  },
  MERCHANT_ITEM: {
    stoneBorder: 'border-amber-400/85 hover:border-yellow-300',
    headerBg:
      'bg-gradient-to-r from-amber-900/90 to-yellow-900/80 border-b border-amber-400/50 text-amber-100',
    innerBg: 'from-[#2b1f0b] via-[#1e1609] to-[#120d06]',
    badge: 'bg-amber-300 text-stone-950 border-amber-100',
    label: 'Merchant',
    glow: 'hover:shadow-[0_0_24px_-4px_rgba(251,191,36,0.55)]',
    Icon: Store,
  },
  SHRINE_BOON: {
    stoneBorder: 'border-cyan-400/85 hover:border-violet-300',
    headerBg:
      'bg-gradient-to-r from-cyan-950/95 to-violet-950/90 border-b border-cyan-400/50 text-cyan-100',
    innerBg: 'from-[#0e2638] via-[#161533] to-[#0b0b1a]',
    badge: 'bg-cyan-300 text-slate-950 border-cyan-100',
    label: 'Shrine',
    glow: 'hover:shadow-[0_0_24px_-4px_rgba(56,189,248,0.55)]',
    Icon: Sparkles,
  },
  EXIT: {
    stoneBorder: 'border-emerald-400/85 hover:border-emerald-200',
    headerBg:
      'bg-emerald-950/95 border-b border-emerald-400/50 text-emerald-100',
    innerBg: 'from-[#0b2a20] via-[#091c16] to-[#06120e]',
    badge: 'bg-emerald-400 text-stone-950 border-emerald-100',
    label: 'Descend',
    glow: 'hover:shadow-emerald-glow',
    Icon: ArrowDownRight,
  },
};

export const DungeonCard: React.FC<DungeonCardProps> = ({
  card,
  hero,
  difficulty = 'STANDARD',
  isHorde = false,
  disabled,
  isSlashing,
  onSelect,
  index,
}) => {
  if (card.cleared) {
    return (
      <div className="relative flex h-29 sm:h-40 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-stone-700/70 bg-stone-950/50 text-stone-500">
        <div className="mb-1 flex h-6 w-6 items-center justify-center rounded border border-stone-800 bg-stone-900/70">
          <Check className="h-3.5 w-3.5 text-stone-500" />
        </div>
        <span className="text-[11px] font-semibold text-stone-500">Cleared</span>
      </div>
    );
  }

  const theme = CARD_THEMES[card.type];
  const TypeIcon = theme.Icon;
  const isEnemy = card.type === 'MONSTER' || card.type === 'BOSS';
  const combatPreview = isEnemy
    ? previewMonsterCombat(card.value, hero, card.rewardMult, difficulty, isHorde)
    : null;
  const salvagePreview = getGearSalvagePreview(card, hero);

  const cantAffordGold =
    card.type === 'MERCHANT_ITEM' && hero.gold < (card.goldCost ?? 0);
  const cantAffordHp =
    card.type === 'SHRINE_BOON' &&
    Boolean(card.hpCost) &&
    (isHorde || hero.hp <= (card.hpCost ?? 0));
  const effectiveDisabled = disabled || cantAffordGold || cantAffordHp;

  const badgeText =
    card.type === 'BONUS'
      ? `+${(card.value / 100).toFixed(2)}x`
      : card.type === 'MERCHANT_ITEM'
      ? `${card.goldCost ?? 0}G`
      : card.type === 'SHRINE_BOON'
      ? card.hpCost
        ? `-${card.hpCost} HP`
        : 'Boon'
      : card.type === 'EXIT'
      ? `F${card.value}`
      : card.value;

  const headerLabel = card.enraged
    ? `${theme.label} · Enraged`
    : card.carriedOver
    ? `${theme.label} · Held`
    : theme.label;

  return (
    <button
      type="button"
      disabled={effectiveDisabled}
      onClick={() => onSelect(card, index)}
      style={{ animationDelay: `${card.dealDelayMs ?? 0}ms` }}
      className={[
        'group relative flex h-29 sm:h-40 w-full flex-col justify-between overflow-hidden rounded-xl border-[3px] bg-gradient-to-b text-left transition-all duration-200 select-none shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400',
        theme.stoneBorder,
        theme.innerBg,
        theme.glow,
        isSlashing ? 'animate-card-resolve' : 'animate-deal',
        effectiveDisabled
          ? 'cursor-not-allowed opacity-60'
          : 'cursor-pointer hover:-translate-y-1 active:scale-95',
      ].join(' ')}
    >
      {/* Color-Coded Medieval Header Bar */}
      <div
        className={`flex items-center justify-between px-2 py-0.5 ${theme.headerBg}`}
      >
        <span className="text-[10px] font-black uppercase tracking-wider truncate">
          {headerLabel}
        </span>
        <span
          className={`inline-flex items-center gap-0.5 rounded border px-1.5 py-0.5 text-[11px] font-black tabular-nums ${theme.badge}`}
        >
          <TypeIcon className="h-2.5 w-2.5" />
          {badgeText}
        </span>
      </div>

      {/* Center SVG Illustration */}
      <div className="my-auto flex items-center justify-center py-0.5 transition-transform duration-200 group-hover:scale-105">
        <CardArtworkSVG
          type={card.type}
          variant={card.variant}
          className="h-13 w-13 sm:h-18 sm:w-18 drop-shadow-[0_6px_12px_rgba(0,0,0,0.65)]"
        />
      </div>

      {/* Bottom Name & Action / Combat Breakdown */}
      <div className="bg-black/60 px-1.5 py-1 border-t border-white/10">
        <div className="flex items-center justify-center gap-1 truncate text-center text-[11px] sm:text-xs font-black text-stone-100">
          {!effectiveDisabled && (
            <span className="hidden sm:inline-block font-mono text-[10px] font-bold text-stone-400">
              [{index + 1}]
            </span>
          )}
          <span className="truncate">{card.name}</span>
        </div>

        {combatPreview ? (
          <div className="mt-0.5 flex flex-wrap items-center justify-center gap-1 text-[10px] font-bold tabular-nums">
            {combatPreview.weaponAbsorbed > 0 && (
              <span className="inline-flex items-center gap-0.5 text-orange-300">
                <Swords className="h-2.5 w-2.5" />-{combatPreview.weaponAbsorbed}
              </span>
            )}
            {combatPreview.shieldAbsorbed > 0 && (
              <span className="inline-flex items-center gap-0.5 text-sky-300">
                <Shield className="h-2.5 w-2.5" />-{combatPreview.shieldAbsorbed}
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
            className={`mt-0.5 truncate text-center text-[10px] font-semibold tabular-nums ${
              cantAffordGold || cantAffordHp
                ? 'text-rose-300'
                : salvagePreview.isSalvage
                ? 'text-amber-300 font-bold'
                : 'text-stone-300'
            }`}
          >
            {cantAffordGold && `Need ${card.goldCost} Gold`}
            {cantAffordHp &&
              (isHorde ? 'Fatal in Horde' : `Need >${card.hpCost} HP`)}
            {!cantAffordGold && !cantAffordHp && (
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
                      ? `+${(card.value / 100).toFixed(2)}x · +1 HP`
                      : '')}
              </>
            )}
          </div>
        )}
      </div>
    </button>
  );
};
