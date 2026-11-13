import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Coins,
  Crown,
  Flame,
  Heart,
  Shield,
  Skull,
  Sparkles,
  Swords,
  X,
} from 'lucide-react';
import { CardArtworkSVG } from './CardArtworkSVG';

interface RulesModalProps {
  open: boolean;
  onClose: () => void;
}

type GuidePage = 1 | 2 | 3;

const ENEMIES = [
  {
    name: 'Skeleton',
    variant: 'skeleton',
    power: '5 Pwr',
    meta: 'F1+ · +0.02x',
    note: 'Crypt guard',
    badge: 'border-stone-500/60 text-stone-200',
  },
  {
    name: 'Bone Hound',
    variant: 'hound',
    power: '6 Pwr',
    meta: 'F1+ · +0.02x',
    note: 'Fast stalker',
    badge: 'border-amber-500/50 text-amber-200',
  },
  {
    name: 'Crypt Cultist',
    variant: 'cultist',
    power: '7–8 Pwr',
    meta: 'F1–10 · +0.04x',
    note: 'Heavy hitter',
    badge: 'border-orange-500/60 text-orange-200',
  },
  {
    name: 'Obsidian Golem',
    variant: 'golem',
    power: '9–11 Pwr',
    meta: 'F2+ · +0.06x',
    note: 'Stone brute',
    badge: 'border-rose-500/60 text-rose-200',
  },
  {
    name: 'Abyssal Fiend',
    variant: 'demon',
    power: '12–14 Pwr',
    meta: 'F6+ · +0.10x',
    note: 'Lethal threat',
    badge: 'border-purple-400/70 text-purple-200',
  },
  {
    name: 'Ember Wyrm',
    variant: 'dragon',
    power: '15–21 Pwr',
    meta: 'F10+ · +0.15x',
    note: 'Inferno wyrm',
    badge: 'border-red-400/80 text-red-200',
  },
];

export const RulesModal: React.FC<RulesModalProps> = ({ open, onClose }) => {
  const [page, setPage] = useState<GuidePage>(1);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 sm:p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Game Guide"
    >
      <div className="relative flex min-h-[450px] sm:min-h-[520px] max-h-[95dvh] w-full max-w-2xl flex-col justify-between rounded-2xl border-2 border-amber-500/50 bg-obsidian-900 shadow-2xl overflow-hidden">
        {/* Top Navigation Tabs + Close Button */}
        <div className="flex items-center gap-2 border-b border-stone-700/80 bg-stone-950/75 px-3 py-2.5 sm:px-5 sm:py-3">
          <div className="grid flex-1 grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setPage(1)}
              className={[
                'flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2.5 text-xs sm:text-sm font-black transition-all cursor-pointer whitespace-nowrap',
                page === 1
                  ? 'border-amber-400/80 bg-amber-500/20 text-amber-200 shadow-sm'
                  : 'border-stone-700/70 bg-stone-900/70 text-stone-400 hover:text-stone-200',
              ].join(' ')}
            >
              <Flame className="h-4 w-4 shrink-0 text-orange-400" />
              <span>1. Rules</span>
            </button>

            <button
              type="button"
              onClick={() => setPage(2)}
              className={[
                'flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2.5 text-xs sm:text-sm font-black transition-all cursor-pointer whitespace-nowrap',
                page === 2
                  ? 'border-rose-400/80 bg-rose-500/20 text-rose-200 shadow-sm'
                  : 'border-stone-700/70 bg-stone-900/70 text-stone-400 hover:text-stone-200',
              ].join(' ')}
            >
              <Skull className="h-4 w-4 shrink-0 text-rose-400" />
              <span>2. Enemies</span>
            </button>

            <button
              type="button"
              onClick={() => setPage(3)}
              className={[
                'flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2.5 text-xs sm:text-sm font-black transition-all cursor-pointer whitespace-nowrap',
                page === 3
                  ? 'border-emerald-400/80 bg-emerald-500/20 text-emerald-200 shadow-sm'
                  : 'border-stone-700/70 bg-stone-900/70 text-stone-400 hover:text-stone-200',
              ].join(' ')}
            >
              <Swords className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>3. Tactics</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Guide"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-stone-700 bg-stone-800/80 text-stone-300 hover:border-amber-400/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Spacious, Fast-Read Page Content */}
        <div className="flex flex-1 flex-col justify-center p-3.5 sm:p-5 text-xs sm:text-sm text-stone-200">
          {page === 1 && (
            <div className="space-y-3 sm:space-y-3.5">
              <div className="rounded-xl border border-amber-500/35 bg-amber-950/25 px-3.5 py-2.5 text-xs sm:text-sm font-semibold leading-relaxed text-amber-100">
                Begin with <strong className="text-emerald-400">20 HP</strong>. Clear 3
                of 4 cards per room to advance, and face a{' '}
                <strong className="text-amber-300">Boss every 5 floors</strong>.
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-3 leading-snug">
                <div className="flex items-start gap-2.5 rounded-xl border border-stone-700/80 bg-obsidian-950/80 p-2.5 sm:p-3">
                  <Skull className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                  <div>
                    <div className="font-black text-red-300">Foes &amp; Bosses</div>
                    <p className="text-xs text-stone-400">
                      Strike for badge power (25% +2 Frenzy); Bosses +0.21x+.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 rounded-xl border border-stone-700/80 bg-obsidian-950/80 p-2.5 sm:p-3">
                  <Flame className="mt-0.5 h-4 w-4 shrink-0 text-orange-400" />
                  <div>
                    <div className="font-black text-orange-300">Weapons</div>
                    <p className="text-xs text-stone-400">
                      Left Hand. Absorbs hits before Shield.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 rounded-xl border border-stone-700/80 bg-obsidian-950/80 p-2.5 sm:p-3">
                  <Shield className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" />
                  <div>
                    <div className="font-black text-sky-300">Shields</div>
                    <p className="text-xs text-stone-400">
                      Right Hand. Blocks remaining damage.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 rounded-xl border border-stone-700/80 bg-obsidian-950/80 p-2.5 sm:p-3">
                  <Heart className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  <div>
                    <div className="font-black text-emerald-300">Potions &amp; Spells</div>
                    <p className="text-xs text-stone-400">
                      Restore HP (max 20) &amp; boost mult.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 rounded-xl border border-stone-700/80 bg-obsidian-950/80 p-2.5 sm:p-3">
                  <Coins className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                  <div>
                    <div className="font-black text-amber-300">Gold Chests</div>
                    <p className="text-xs text-stone-400">
                      Boosts mult &amp; spends at Merchant.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 rounded-xl border border-stone-700/80 bg-obsidian-950/80 p-2.5 sm:p-3">
                  <Crown className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" />
                  <div>
                    <div className="font-black text-violet-300">Forge &amp; Sanctuary</div>
                    <p className="text-xs text-stone-400">
                      Slay a Boss to forge gear &amp; enter Sanctuary.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/35 bg-emerald-950/25 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-stone-200">
                <Sparkles className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>
                  Winnings bank on floor clear. <strong className="text-emerald-400">Cash Out</strong> unlocks after Floor 1.
                </span>
              </div>
            </div>
          )}

          {page === 2 && (
            <div className="space-y-3 sm:space-y-3.5">
              <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                {ENEMIES.map((enemy) => (
                  <div
                    key={enemy.name}
                    className="flex items-center gap-2.5 rounded-xl border border-stone-700/80 bg-obsidian-950/85 p-2 sm:p-2.5"
                  >
                    <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-lg border border-red-500/30 bg-[#1a0d14]">
                      <CardArtworkSVG
                        type="MONSTER"
                        variant={enemy.variant}
                        className="h-9 w-9 sm:h-10 sm:w-10"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs sm:text-sm font-black text-stone-100 truncate">
                          {enemy.name}
                        </span>
                        <span
                          className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-black tabular-nums ${enemy.badge}`}
                        >
                          {enemy.power}
                        </span>
                      </div>
                      <div className="text-[11px] font-bold text-emerald-400 tabular-nums">
                        {enemy.meta}
                      </div>
                      <div className="text-[11px] text-stone-400 truncate">
                        {enemy.note}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-amber-500/45 bg-gradient-to-r from-[#280b14] via-[#1c0c26] to-[#261107] px-3.5 py-2.5 text-xs">
                <div className="font-black text-amber-300 mb-1">
                  Boss Milestones (Every 5 Floors)
                </div>
                <div className="grid grid-cols-3 gap-2 text-stone-300 tabular-nums">
                  <span>
                    <strong className="text-amber-300">F5</strong> Crypt Warden
                  </span>
                  <span>
                    <strong className="text-rose-300">F10–15</strong> Blood &amp; Void
                  </span>
                  <span>
                    <strong className="text-orange-300">F20+</strong> Inferno Wyrm
                  </span>
                </div>
              </div>
            </div>
          )}

          {page === 3 && (
            <div className="space-y-3 sm:space-y-3.5 leading-relaxed">
              <div className="rounded-xl border border-orange-500/40 bg-obsidian-950/85 p-3 sm:p-3.5">
                <h3 className="font-black text-orange-300 flex items-center gap-1.5">
                  <Swords className="h-4 w-4 shrink-0" />
                  1. Combat &amp; Smart Salvage
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-stone-300">
                  <strong>Weapon</strong> hits first → <strong>Shield</strong> →{' '}
                  <strong>HP</strong>. Equal/weaker gear drops auto-salvage into{' '}
                  <strong>+1–2 Power/Armor &amp; +2 Gold</strong>.
                </p>
              </div>

              <div className="rounded-xl border border-amber-500/40 bg-obsidian-950/85 p-3 sm:p-3.5">
                <h3 className="font-black text-amber-300 flex items-center gap-1.5">
                  <Coins className="h-4 w-4 shrink-0" />
                  2. Gold &amp; Boss Forge
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-stone-300">
                  After defeating a Boss, spend <strong>6 Gold</strong> at the Forge
                  for <strong>+3 Power/Armor</strong>, or hold{' '}
                  <strong>25+ Gold</strong> for +0.08x Tribute.
                </p>
              </div>

              <div className="rounded-xl border border-cyan-500/40 bg-obsidian-950/85 p-3 sm:p-3.5">
                <h3 className="font-black text-cyan-300 flex items-center gap-1.5">
                  <Crown className="h-4 w-4 shrink-0" />
                  3. Enraged Carry-Over &amp; Skill Bonuses
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-stone-300">
                  The 4th unpicked card carries to the next floor; skipped foes grow{' '}
                  <strong>Enraged (+2 Pwr)</strong>. Earn Clean Parry (+0.01x), Grit
                  (+0.02x), and 3-Kill Combo (+0.08x).
                </p>
              </div>

              <div className="rounded-xl border border-rose-500/40 bg-rose-950/20 p-3 sm:p-3.5">
                <h3 className="font-black text-rose-300 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 shrink-0" />
                  4. Hardcore Mode &amp; Bonus Buy
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-stone-300">
                  <strong>Hardcore</strong> starts with <strong>15 HP</strong> and{' '}
                  <strong>+2 Enemy Power</strong> for{' '}
                  <strong>1.35× faster multipliers</strong>.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Pagination */}
        <div className="flex items-center justify-between border-t border-stone-700/80 px-4 py-3">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => setPage((p) => (p > 1 ? ((p - 1) as GuidePage) : p))}
            className="inline-flex h-9 items-center gap-1 rounded-lg border border-stone-600 bg-stone-800 px-3.5 text-xs sm:text-sm font-bold text-stone-200 hover:bg-stone-700 disabled:opacity-40 cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </button>

          <span className="text-xs sm:text-sm font-black tracking-wider text-amber-300 tabular-nums">
            Page {page} of 3
          </span>

          {page < 3 ? (
            <button
              type="button"
              onClick={() => setPage((p) => (p < 3 ? ((p + 1) as GuidePage) : p))}
              className="inline-flex h-9 items-center gap-1 rounded-lg border border-amber-400/70 bg-amber-500/20 px-3.5 text-xs sm:text-sm font-black text-amber-200 hover:bg-amber-500/30 cursor-pointer"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 items-center gap-1 rounded-lg border border-emerald-400/70 bg-emerald-500/20 px-4 text-xs sm:text-sm font-black text-emerald-200 hover:bg-emerald-500/30 cursor-pointer"
            >
              Got It
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
