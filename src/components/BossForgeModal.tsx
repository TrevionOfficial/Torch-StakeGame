import React from 'react';
import { ArrowRight, Coins, Flame, Hammer, Shield } from 'lucide-react';
import { HeroState } from '../types/game';
import {
  BOSS_FORGE_GOLD_COST,
  BOSS_FORGE_UPGRADE_AMOUNT,
} from '../engine/dungeonEngine';
import { CardArtworkSVG } from './CardArtworkSVG';

interface BossForgeModalProps {
  open: boolean;
  floor: number;
  hero: HeroState;
  onUpgradeWeapon: () => void;
  onUpgradeShield: () => void;
  onContinue: () => void;
}

export const BossForgeModal: React.FC<BossForgeModalProps> = ({
  open,
  floor,
  hero,
  onUpgradeWeapon,
  onUpgradeShield,
  onContinue,
}) => {
  if (!open) return null;

  const canAfford = hero.gold >= BOSS_FORGE_GOLD_COST;
  const canUpgradeWeapon = canAfford;
  const canUpgradeShield = canAfford;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Boss Forge"
    >
      <div className="w-full max-w-xl rounded-2xl border-2 border-amber-400/60 bg-obsidian-900 p-4 sm:p-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-stone-700/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-400/50 bg-orange-500/20 shadow-torch">
              <Hammer className="h-5 w-5 text-amber-300" />
            </div>
            <div>
              <h2 className="font-serif text-base sm:text-lg font-black tracking-wide text-amber-200">
                Boss Forge
              </h2>
              <p className="text-xs text-stone-400">
                Floor {floor} Boss slain · Upgrade or reforge gear
              </p>
            </div>
          </div>

          <div className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-amber-400/45 bg-amber-500/15 px-3 py-1.5 text-xs sm:text-sm font-black text-amber-300 tabular-nums">
            <Coins className="h-4 w-4 text-amber-300" />
            <span>{hero.gold} Gold</span>
          </div>
        </div>

        {/* Upgrade Options */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Weapon Upgrade Card */}
          <div className="flex flex-col justify-between rounded-xl border border-orange-500/45 bg-gradient-to-b from-[#23140d] to-[#130d09] p-3.5">
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-orange-300">
                <span>Current Weapon</span>
                {hero.weapon && (
                  <span className="inline-flex items-center gap-1 tabular-nums text-orange-200">
                    <Flame className="h-3.5 w-3.5 text-orange-400" />
                    {hero.weapon.power} Pwr
                  </span>
                )}
              </div>

              {hero.weapon ? (
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-orange-500/35 bg-black/40">
                    <CardArtworkSVG
                      type="WEAPON"
                      variant={hero.weapon.variant}
                      className="h-10 w-10"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-black text-stone-100">
                      {hero.weapon.name}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-xs font-bold tabular-nums">
                      <span className="text-stone-400">{hero.weapon.power}</span>
                      <ArrowRight className="h-3 w-3 text-amber-400" />
                      <span className="text-emerald-400">
                        {hero.weapon.power + BOSS_FORGE_UPGRADE_AMOUNT} Power
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-orange-500/35 bg-black/40">
                    <CardArtworkSVG
                      type="WEAPON"
                      variant="emberblade"
                      className="h-10 w-10 opacity-75"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-black text-stone-200">
                      Ember Edge
                    </div>
                    <div className="text-xs font-bold text-emerald-400 tabular-nums">
                      Forge {BOSS_FORGE_UPGRADE_AMOUNT} Power
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              disabled={!canUpgradeWeapon}
              onClick={onUpgradeWeapon}
              className={[
                'mt-4 flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-black transition-all tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400',
                canUpgradeWeapon
                  ? 'cursor-pointer border-orange-300/70 bg-gradient-to-b from-orange-500 to-amber-600 text-stone-950 hover:brightness-110 active:scale-95'
                  : 'cursor-not-allowed border-stone-800 bg-stone-900/80 text-stone-500',
              ].join(' ')}
            >
              <Hammer className="h-3.5 w-3.5 shrink-0" />
              <span>
                {!canAfford
                  ? `Need ${BOSS_FORGE_GOLD_COST} Gold`
                  : hero.weapon
                  ? `Forge +${BOSS_FORGE_UPGRADE_AMOUNT} Power · ${BOSS_FORGE_GOLD_COST}G`
                  : `Forge Ember Edge (${BOSS_FORGE_UPGRADE_AMOUNT} Pwr) · ${BOSS_FORGE_GOLD_COST}G`}
              </span>
            </button>
          </div>

          {/* Shield Upgrade Card */}
          <div className="flex flex-col justify-between rounded-xl border border-sky-500/45 bg-gradient-to-b from-[#0f1f2d] to-[#0a121a] p-3.5">
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-sky-300">
                <span>Current Shield</span>
                {hero.shield && (
                  <span className="inline-flex items-center gap-1 tabular-nums text-sky-200">
                    <Shield className="h-3.5 w-3.5 text-sky-400" />
                    {hero.shield.armor} Arm
                  </span>
                )}
              </div>

              {hero.shield ? (
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-sky-500/35 bg-black/40">
                    <CardArtworkSVG
                      type="SHIELD"
                      variant={hero.shield.variant}
                      className="h-10 w-10"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-black text-stone-100">
                      {hero.shield.name}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-xs font-bold tabular-nums">
                      <span className="text-stone-400">{hero.shield.armor}</span>
                      <ArrowRight className="h-3 w-3 text-sky-400" />
                      <span className="text-emerald-400">
                        {hero.shield.armor + BOSS_FORGE_UPGRADE_AMOUNT} Armor
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-sky-500/35 bg-black/40">
                    <CardArtworkSVG
                      type="SHIELD"
                      variant="kite"
                      className="h-10 w-10 opacity-75"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-black text-stone-200">
                      Iron Kite
                    </div>
                    <div className="text-xs font-bold text-emerald-400 tabular-nums">
                      Forge {BOSS_FORGE_UPGRADE_AMOUNT} Armor
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              disabled={!canUpgradeShield}
              onClick={onUpgradeShield}
              className={[
                'mt-4 flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-black transition-all tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400',
                canUpgradeShield
                  ? 'cursor-pointer border-sky-300/70 bg-gradient-to-b from-sky-400 to-blue-600 text-slate-950 hover:brightness-110 active:scale-95'
                  : 'cursor-not-allowed border-stone-800 bg-stone-900/80 text-stone-500',
              ].join(' ')}
            >
              <Hammer className="h-3.5 w-3.5 shrink-0" />
              <span>
                {!canAfford
                  ? `Need ${BOSS_FORGE_GOLD_COST} Gold`
                  : hero.shield
                  ? `Forge +${BOSS_FORGE_UPGRADE_AMOUNT} Armor · ${BOSS_FORGE_GOLD_COST}G`
                  : `Forge Iron Kite (${BOSS_FORGE_UPGRADE_AMOUNT} Arm) · ${BOSS_FORGE_GOLD_COST}G`}
              </span>
            </button>
          </div>
        </div>

        {/* Continue Button */}
        <button
          type="button"
          onClick={onContinue}
          className="mt-4 flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl border border-emerald-400/70 bg-emerald-500/20 px-4 py-2.5 text-sm font-black text-emerald-200 transition-all hover:bg-emerald-500/30 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 cursor-pointer"
        >
          <span>Continue to Sanctuary</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
