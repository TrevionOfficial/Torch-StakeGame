import React from 'react';
import {
  Compass,
  Crown,
  HelpCircle,
  Home,
  Music,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { SessionStats } from '../types/game';

interface MenuModalProps {
  open: boolean;
  onClose: () => void;
  stats: SessionStats;
  muted: boolean;
  musicPlaying: boolean;
  volume: number;
  isPlayingRun: boolean;
  onToggleMute: () => void;
  onToggleMusic: () => void;
  onVolumeChange: (val: number) => void;
  onOpenBonusBuy: () => void;
  onOpenRules: () => void;
  onReturnToTitle: () => void;
}

export const MenuModal: React.FC<MenuModalProps> = ({
  open,
  onClose,
  stats,
  muted,
  musicPlaying,
  volume,
  isPlayingRun,
  onToggleMute,
  onToggleMusic,
  onVolumeChange,
  onOpenBonusBuy,
  onOpenRules,
  onReturnToTitle,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="torch-menu-title"
    >
      <div className="relative max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-2xl border-2 border-amber-500/45 bg-obsidian-900 p-5 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Menu"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-800 hover:text-white cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <h2
          id="torch-menu-title"
          className="mb-4 font-serif text-xl font-black tracking-widest text-amber-300"
        >
          TORCH
        </h2>

        <div className="space-y-4">
          {/* Session Stats */}
          <div className="grid grid-cols-3 gap-2 rounded-xl border border-stone-700/80 bg-obsidian-950/80 p-3 text-center">
            <div>
              <div className="text-[11px] font-medium text-stone-400">Runs</div>
              <div className="text-sm font-black text-stone-100 tabular-nums">
                {stats.runsPlayed}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-medium text-stone-400">Best Floor</div>
              <div className="text-sm font-black text-amber-300 tabular-nums">
                F{stats.bestFloor}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-medium text-stone-400">Best Mult</div>
              <div className="text-sm font-black text-emerald-400 tabular-nums">
                {stats.bestMultiplier.toFixed(2)}x
              </div>
            </div>
          </div>

          {/* Audio & Volume Controls */}
          <div className="space-y-2.5 rounded-xl border border-stone-700/80 bg-obsidian-950/80 p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-300">Sound Effects</span>
              <button
                type="button"
                onClick={onToggleMute}
                className={[
                  'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold cursor-pointer',
                  !muted
                    ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300'
                    : 'border-stone-700 bg-stone-800 text-stone-400',
                ].join(' ')}
              >
                {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                {muted ? 'Muted' : 'On'}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-300">Adaptive Music</span>
              <button
                type="button"
                onClick={onToggleMusic}
                className={[
                  'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold cursor-pointer',
                  musicPlaying
                    ? 'border-amber-500/50 bg-amber-500/15 text-amber-300'
                    : 'border-stone-700 bg-stone-800 text-stone-400',
                ].join(' ')}
              >
                <Music className="h-3.5 w-3.5" />
                {musicPlaying ? 'Playing' : 'Off'}
              </button>
            </div>

            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-[11px] font-semibold text-stone-400">
                <span>Master Volume</span>
                <span className="tabular-nums">{Math.round(volume * 100)}%</span>
              </div>
              <input
                type="range"
                aria-label="Master Volume"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onChange={(e) => onVolumeChange(Number(e.target.value))}
                style={{
                  background: `linear-gradient(to right, #f59e0b 0%, #f59e0b ${volume * 100}%, #27272a ${volume * 100}%, #27272a 100%)`,
                  borderRadius: '9999px',
                  height: '6px',
                }}
                className="torch-slider w-full"
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={isPlayingRun}
              onClick={() => {
                onClose();
                onOpenBonusBuy();
              }}
              className="flex items-center justify-center gap-2 rounded-xl border border-violet-400/50 bg-violet-950/60 px-3 py-2.5 text-xs font-black text-violet-200 hover:bg-violet-900/70 disabled:opacity-45 cursor-pointer"
            >
              <Crown className="h-4 w-4 text-amber-300" />
              Bonus Buy
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenRules();
              }}
              className="flex items-center justify-center gap-2 rounded-xl border border-stone-600 bg-stone-800/80 px-3 py-2.5 text-xs font-black text-stone-200 hover:bg-stone-700 cursor-pointer"
            >
              <HelpCircle className="h-4 w-4 text-amber-300" />
              Game Rules
            </button>

            <button
              type="button"
              onClick={onReturnToTitle}
              className="col-span-2 flex items-center justify-center gap-2 rounded-xl border border-stone-600 bg-stone-900 px-3 py-2.5 text-xs font-black text-stone-200 hover:bg-stone-800 cursor-pointer"
            >
              <Home className="h-4 w-4 text-amber-300" />
              Title Screen
            </button>
          </div>

          <div className="flex items-center justify-center gap-1.5 border-t border-stone-800/80 pt-3 text-xs font-bold tracking-wider text-stone-400">
            <Compass className="h-3.5 w-3.5 text-orange-400" />
            <span>Compass Games</span>
          </div>
        </div>
      </div>
    </div>
  );
};
