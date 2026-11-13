import React from 'react';
import { AlertTriangle, Coins, Flame, Heart, Shield } from 'lucide-react';
import { FloatingFeedback, HeroState } from '../types/game';
import { CardArtworkSVG } from './CardArtworkSVG';

interface HeroHudProps {
  hero: HeroState;
  heroShake: boolean;
  isLowHp: boolean;
  isCriticalHp: boolean;
  feedbacks: FloatingFeedback[];
}

export const HeroHud: React.FC<HeroHudProps> = ({
  hero,
  heroShake,
  isLowHp,
  isCriticalHp,
  feedbacks,
}) => {
  const hpPercent = Math.max(0, Math.min(100, (hero.hp / hero.maxHp) * 100));

  const renderFeedbacks = (target: FloatingFeedback['target']) =>
    feedbacks
      .filter((f) => f.target === target)
      .map((f) => {
        const toneColor =
          f.tone === 'damage'
            ? 'text-red-400'
            : f.tone === 'block'
            ? 'text-sky-300'
            : f.tone === 'heal'
            ? 'text-emerald-400'
            : f.tone === 'gold'
            ? 'text-amber-300'
            : f.tone === 'spell'
            ? 'text-pink-300'
            : f.tone === 'bonus'
            ? 'text-violet-300'
            : 'text-orange-400';

        return (
          <div
            key={f.id}
            className={`animate-float-text pointer-events-none absolute -top-2 left-1/2 z-30 whitespace-nowrap text-xs sm:text-sm font-black drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)] ${toneColor}`}
          >
            {f.text}
          </div>
        );
      });

  return (
    <div className="relative mx-auto grid w-full max-w-3xl grid-cols-3 gap-2 sm:gap-3.5">
      <div
        className={[
          'pointer-events-none absolute inset-x-1/4 -top-2 h-24 rounded-full blur-2xl transition-colors duration-500',
          isCriticalHp
            ? 'bg-red-600/30'
            : isLowHp
            ? 'bg-red-500/20'
            : 'bg-amber-500/15',
        ].join(' ')}
        aria-hidden="true"
      />

      {/* LEFT HAND SLOT: Equipped Weapon / Torch */}
      <div className="relative z-10 flex flex-col justify-between rounded-xl border-2 border-orange-500/45 bg-gradient-to-b from-[#21130c] to-[#110c09] p-2 sm:p-2.5 shadow-lg">
        {renderFeedbacks('WEAPON')}
        <div className="flex items-center justify-between gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wide text-orange-400">
            Left Hand
          </span>
          {hero.weapon && (
            <span className="inline-flex items-center gap-0.5 rounded bg-orange-500 px-1.5 py-0.5 text-[11px] font-black text-stone-950 tabular-nums">
              <Flame className="h-2.5 w-2.5" />
              {hero.weapon.power}
            </span>
          )}
        </div>

        {hero.weapon ? (
          <>
            <div className="my-0.5 flex justify-center">
              <CardArtworkSVG
                type="WEAPON"
                variant={hero.weapon.variant}
                className="h-8 w-8 sm:h-11 sm:w-11"
              />
            </div>
            <div className="space-y-1">
              <div className="truncate text-center text-[11px] font-bold text-stone-100">
                {hero.weapon.name}
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-orange-600 to-amber-400 transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      100,
                      (hero.weapon.power / hero.weapon.maxPower) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="my-auto flex flex-col items-center justify-center py-0.5 opacity-65">
            <CardArtworkSVG type="GAUNTLET" className="h-8 w-8 sm:h-11 sm:w-11" />
            <span className="text-[10px] font-medium text-stone-400">
              No Weapon
            </span>
          </div>
        )}
      </div>

      {/* CENTER SLOT: Pyro-Paladin Hero Card with Low-HP Suspense State */}
      <div
        className={[
          'relative z-10 flex flex-col justify-between rounded-xl border-2 p-2 sm:p-2.5 transition-all',
          isCriticalHp
            ? 'border-red-500 bg-gradient-to-b from-[#331116] via-[#210d11] to-[#12080a] shadow-crimson'
            : isLowHp
            ? 'border-red-400/80 bg-gradient-to-b from-[#2b1514] via-[#1c1010] to-[#100a0a] shadow-crimson'
            : 'border-amber-400/70 bg-gradient-to-b from-[#261a12] via-[#19120e] to-[#0f0b09] shadow-hero-glow',
          heroShake ? 'animate-hero-hit' : '',
        ].join(' ')}
      >
        {renderFeedbacks('HERO')}
        {renderFeedbacks('GOLD')}
        <div className="flex items-center justify-between gap-1">
          {isLowHp ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wide text-red-400">
              <AlertTriangle className="h-3 w-3" />
              {isCriticalHp ? 'Critical' : 'Low HP'}
            </span>
          ) : (
            <span className="truncate text-[10px] font-bold uppercase tracking-wide text-amber-300">
              Hero
            </span>
          )}
          <span className="inline-flex shrink-0 items-center gap-1 rounded border border-amber-400/40 bg-amber-500/20 px-1.5 py-0.5 text-[11px] font-black text-amber-300 tabular-nums">
            <Coins className="h-2.5 w-2.5" />
            {hero.gold}
          </span>
        </div>

        <div className="my-0.5 flex justify-center">
          <CardArtworkSVG
            type="HERO"
            className="h-9 w-9 sm:h-12 sm:w-12 drop-shadow-[0_0_12px_rgba(249,115,22,0.4)]"
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] font-black tabular-nums">
            <span className="inline-flex items-center gap-1 text-red-300">
              <Heart className="h-3 w-3 fill-red-500 text-red-500" />
              HP
            </span>
            <span className={isLowHp ? 'text-red-400' : 'text-stone-100'}>
              {hero.hp}/{hero.maxHp}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-stone-900 ring-1 ring-stone-700">
            <div
              className={[
                'h-full rounded-full transition-all duration-300',
                hpPercent > 50
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-400'
                  : hpPercent > 30
                  ? 'bg-gradient-to-r from-amber-600 to-amber-400'
                  : 'bg-gradient-to-r from-red-700 to-red-500',
              ].join(' ')}
              style={{ width: `${hpPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* RIGHT HAND SLOT: Equipped Shield / Armor */}
      <div className="relative z-10 flex flex-col justify-between rounded-xl border-2 border-sky-500/45 bg-gradient-to-b from-[#0d1c29] to-[#091118] p-2 sm:p-2.5 shadow-lg">
        {renderFeedbacks('SHIELD')}
        <div className="flex items-center justify-between gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wide text-sky-400">
            Right Hand
          </span>
          {hero.shield && (
            <span className="inline-flex items-center gap-0.5 rounded bg-sky-400 px-1.5 py-0.5 text-[11px] font-black text-slate-950 tabular-nums">
              <Shield className="h-2.5 w-2.5" />
              {hero.shield.armor}
            </span>
          )}
        </div>

        {hero.shield ? (
          <>
            <div className="my-0.5 flex justify-center">
              <CardArtworkSVG
                type="SHIELD"
                variant={hero.shield.variant}
                className="h-8 w-8 sm:h-11 sm:w-11"
              />
            </div>
            <div className="space-y-1">
              <div className="truncate text-center text-[11px] font-bold text-stone-100">
                {hero.shield.name}
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-600 to-cyan-300 transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      100,
                      (hero.shield.armor / hero.shield.maxArmor) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="my-auto flex flex-col items-center justify-center py-0.5 opacity-65">
            <div className="-scale-x-100">
              <CardArtworkSVG type="GAUNTLET" className="h-8 w-8 sm:h-11 sm:w-11" />
            </div>
            <span className="text-[10px] font-medium text-stone-400">
              No Shield
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
