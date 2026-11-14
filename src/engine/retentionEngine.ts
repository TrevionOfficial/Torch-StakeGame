import {
  BountyMetric,
  RankTier,
  RetentionProfile,
  RunBounty,
  TorchFlameId,
  TorchFlameTheme,
} from '../types/game';

export const RETENTION_STORAGE_KEY = 'torch_retention_profile_v1';

export const TORCH_FLAMES: TorchFlameTheme[] = [
  {
    id: 'amber',
    name: 'Kindled Amber',
    unlockRank: 1,
    emberColors: ['#fb923c', '#f97316', '#fbbf24', '#fde047'],
    heroBorderClass: 'border-amber-400/70',
    heroGlowClass: 'shadow-hero-glow',
    textAccentClass: 'text-amber-300',
    dotColor: '#f59e0b',
  },
  {
    id: 'crimson',
    name: 'Crimson Fury',
    unlockRank: 2,
    emberColors: ['#fb7185', '#f43f5e', '#e11d48', '#fda4af'],
    heroBorderClass: 'border-rose-400/75',
    heroGlowClass: 'shadow-[0_0_32px_2px_rgba(244,63,94,0.34)]',
    textAccentClass: 'text-rose-300',
    dotColor: '#f43f5e',
  },
  {
    id: 'emerald',
    name: 'Spectral Jade',
    unlockRank: 3,
    emberColors: ['#34d399', '#10b981', '#6ee7b7', '#a7f3d0'],
    heroBorderClass: 'border-emerald-400/75',
    heroGlowClass: 'shadow-[0_0_32px_2px_rgba(16,185,129,0.34)]',
    textAccentClass: 'text-emerald-300',
    dotColor: '#10b981',
  },
  {
    id: 'violet',
    name: 'Abyssal Violet',
    unlockRank: 5,
    emberColors: ['#c084fc', '#a855f7', '#e879f9', '#f5d0fe'],
    heroBorderClass: 'border-violet-400/75',
    heroGlowClass: 'shadow-[0_0_32px_2px_rgba(168,85,247,0.36)]',
    textAccentClass: 'text-violet-300',
    dotColor: '#a855f7',
  },
  {
    id: 'solar',
    name: 'Solar Sovereign',
    unlockRank: 7,
    emberColors: ['#fef08a', '#fbbf24', '#ffffff', '#fb923c'],
    heroBorderClass: 'border-yellow-300/85',
    heroGlowClass: 'shadow-[0_0_36px_3px_rgba(253,224,71,0.4)]',
    textAccentClass: 'text-yellow-200',
    dotColor: '#fde047',
  },
];

export const RANK_TIERS: RankTier[] = [
  { rank: 1, title: 'Torchbearer', minEmbers: 0, flameUnlock: 'amber' },
  { rank: 2, title: 'Crypt Delver', minEmbers: 45, flameUnlock: 'crimson' },
  { rank: 3, title: 'Ember Knight', minEmbers: 120, flameUnlock: 'emerald' },
  { rank: 4, title: 'Relic Seeker', minEmbers: 230 },
  { rank: 5, title: 'Boss Slayer', minEmbers: 380, flameUnlock: 'violet' },
  { rank: 6, title: 'Pyro-Paladin', minEmbers: 580 },
  { rank: 7, title: 'Solar Warden', minEmbers: 850, flameUnlock: 'solar' },
  { rank: 8, title: 'Sovereign of Ash', minEmbers: 1200 },
];

interface BountyTemplate {
  id: string;
  title: string;
  description: string;
  metric: BountyMetric;
  target: number;
  rewardEmbers: number;
}

const BOUNTY_TEMPLATES: BountyTemplate[] = [
  {
    id: 'monster_hunter',
    title: 'Monster Hunter',
    description: 'Slay 6 dungeon foes',
    metric: 'KILLS',
    target: 6,
    rewardEmbers: 30,
  },
  {
    id: 'iron_defense',
    title: 'Iron Defense',
    description: 'Land 4 clean parries (0 HP lost)',
    metric: 'PARRIES',
    target: 4,
    rewardEmbers: 35,
  },
  {
    id: 'crypt_climber',
    title: 'Crypt Climber',
    description: 'Clear 4 dungeon floors',
    metric: 'FLOORS',
    target: 4,
    rewardEmbers: 35,
  },
  {
    id: 'hoard_seeker',
    title: 'Hoard Seeker',
    description: 'Gather 18 Gold across runs',
    metric: 'GOLD',
    target: 18,
    rewardEmbers: 30,
  },
  {
    id: 'boss_challenger',
    title: 'Boss Challenger',
    description: 'Defeat 1 Floor Boss',
    metric: 'BOSSES',
    target: 1,
    rewardEmbers: 55,
  },
  {
    id: 'smart_extraction',
    title: 'Smart Extraction',
    description: 'Cash out at 1.35x or higher',
    metric: 'CASHOUT',
    target: 1,
    rewardEmbers: 40,
  },
  {
    id: 'relentless_blade',
    title: 'Relentless Blade',
    description: 'Slay 10 dungeon foes',
    metric: 'KILLS',
    target: 10,
    rewardEmbers: 45,
  },
  {
    id: 'bastion_master',
    title: 'Bastion Master',
    description: 'Land 6 clean parries',
    metric: 'PARRIES',
    target: 6,
    rewardEmbers: 45,
  },
];

export function getRankForEmbers(embers: number): {
  currentRank: RankTier;
  nextRank: RankTier | null;
  embersIntoRank: number;
  embersForNextRank: number;
  progressPct: number;
} {
  let currentRank = RANK_TIERS[0];
  let nextRank: RankTier | null = RANK_TIERS[1] ?? null;

  for (let i = 0; i < RANK_TIERS.length; i++) {
    if (embers >= RANK_TIERS[i].minEmbers) {
      currentRank = RANK_TIERS[i];
      nextRank = RANK_TIERS[i + 1] ?? null;
    }
  }

  if (!nextRank) {
    return {
      currentRank,
      nextRank: null,
      embersIntoRank: embers - currentRank.minEmbers,
      embersForNextRank: 0,
      progressPct: 100,
    };
  }

  const span = Math.max(1, nextRank.minEmbers - currentRank.minEmbers);
  const into = Math.max(0, embers - currentRank.minEmbers);
  return {
    currentRank,
    nextRank,
    embersIntoRank: into,
    embersForNextRank: span,
    progressPct: Math.min(100, Math.round((into / span) * 100)),
  };
}

export function getUnlockedFlames(rankNumber: number): TorchFlameTheme[] {
  return TORCH_FLAMES.filter((f) => f.unlockRank <= rankNumber);
}

export function getFlameTheme(
  flameId: TorchFlameId,
  rankNumber: number
): TorchFlameTheme {
  const unlocked = getUnlockedFlames(rankNumber);
  return (
    unlocked.find((f) => f.id === flameId) ?? unlocked[0] ?? TORCH_FLAMES[0]
  );
}

export function getNextUnlockedFlameId(
  currentId: TorchFlameId,
  rankNumber: number
): TorchFlameId {
  const unlocked = getUnlockedFlames(rankNumber);
  if (unlocked.length <= 1) return unlocked[0]?.id ?? 'amber';
  const idx = unlocked.findIndex((f) => f.id === currentId);
  const next = unlocked[(idx + 1) % unlocked.length];
  return next.id;
}

export function pickNextBounty(
  completedCount: number,
  excludeId?: string
): RunBounty {
  const idx = completedCount % BOUNTY_TEMPLATES.length;
  let tpl = BOUNTY_TEMPLATES[idx];
  if (excludeId && tpl.id === excludeId) {
    tpl = BOUNTY_TEMPLATES[(idx + 1) % BOUNTY_TEMPLATES.length];
  }
  return {
    id: tpl.id,
    title: tpl.title,
    description: tpl.description,
    metric: tpl.metric,
    target: tpl.target,
    progress: 0,
    rewardEmbers: tpl.rewardEmbers,
  };
}

export function createDefaultRetentionProfile(): RetentionProfile {
  return {
    embers: 0,
    activeBounty: pickNextBounty(0),
    completedBounties: 0,
    selectedFlameId: 'amber',
  };
}

export function loadRetentionProfile(): RetentionProfile {
  const fallback = createDefaultRetentionProfile();
  try {
    const raw = window.localStorage.getItem(RETENTION_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<RetentionProfile>;
    const embers =
      typeof parsed.embers === 'number' && Number.isFinite(parsed.embers) && parsed.embers >= 0
        ? Math.floor(parsed.embers)
        : 0;
    const completedBounties =
      typeof parsed.completedBounties === 'number' &&
      Number.isFinite(parsed.completedBounties) &&
      parsed.completedBounties >= 0
        ? Math.floor(parsed.completedBounties)
        : 0;

    const { currentRank } = getRankForEmbers(embers);
    const selectedFlameId: TorchFlameId =
      typeof parsed.selectedFlameId === 'string' &&
      TORCH_FLAMES.some(
        (f) => f.id === parsed.selectedFlameId && f.unlockRank <= currentRank.rank
      )
        ? (parsed.selectedFlameId as TorchFlameId)
        : 'amber';

    const b = parsed.activeBounty;
    const validMetrics: BountyMetric[] = [
      'KILLS',
      'PARRIES',
      'FLOORS',
      'GOLD',
      'BOSSES',
      'CASHOUT',
    ];
    const activeBounty: RunBounty =
      b &&
      typeof b.id === 'string' &&
      typeof b.title === 'string' &&
      typeof b.description === 'string' &&
      validMetrics.includes(b.metric) &&
      typeof b.target === 'number' &&
      b.target > 0 &&
      typeof b.progress === 'number' &&
      b.progress >= 0 &&
      typeof b.rewardEmbers === 'number' &&
      b.rewardEmbers > 0
        ? {
            id: b.id,
            title: b.title,
            description: b.description,
            metric: b.metric,
            target: Math.floor(b.target),
            progress: Math.min(Math.floor(b.target), Math.floor(b.progress)),
            rewardEmbers: Math.floor(b.rewardEmbers),
          }
        : pickNextBounty(completedBounties);

    return {
      embers,
      activeBounty,
      completedBounties,
      selectedFlameId,
    };
  } catch {
    return fallback;
  }
}

export function advanceBountyProgress(
  bounty: RunBounty,
  metric: BountyMetric,
  delta: number
): {
  updatedBounty: RunBounty;
  completed: boolean;
} {
  if (delta <= 0 || bounty.metric !== metric) {
    return { updatedBounty: bounty, completed: false };
  }
  const nextProgress = Math.min(bounty.target, bounty.progress + delta);
  const completed = nextProgress >= bounty.target;
  return {
    updatedBounty: {
      ...bounty,
      progress: nextProgress,
    },
    completed,
  };
}

export function calculateRunEmbers(params: {
  floorsCleared: number;
  kills: number;
  parries: number;
  bossesSlain: number;
  outcome: 'win' | 'loss';
  finalMultiplier: number;
}): number {
  const fromFloors = params.floorsCleared * 5;
  const fromKills = params.kills * 2;
  const fromParries = params.parries * 2;
  const fromBosses = params.bossesSlain * 12;
  const winBonus =
    params.outcome === 'win'
      ? 8 + Math.round(Math.max(0, params.finalMultiplier - 1) * 10)
      : 0;
  return Math.max(6, fromFloors + fromKills + fromParries + fromBosses + winBonus);
}
