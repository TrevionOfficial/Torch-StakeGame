import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Award,
  BadgeDollarSign,
  Crown,
  Flame,
  Lock,
  Play,
  RefreshCw,
  RotateCcw,
  Target,
  Timer,
  Zap,
} from 'lucide-react';
import {
  BonusBanner,
  BonusBuyOption,
  BountyMetric,
  DifficultyMode,
  DungeonCardData,
  FloatingFeedback,
  HeroState,
  ParticleBurstRequest,
  RankTier,
  RecentRunEntry,
  RetentionProfile,
  RgsConfig,
  RoomMode,
  RunPhase,
  RunRetentionSummary,
  ScreenMode,
  SessionStats,
  ShieldVariant,
  TorchFlameTheme,
  WeaponVariant,
} from './types/game';
import {
  BOSS_FORGE_GOLD_COST,
  BOSS_FORGE_UPGRADE_AMOUNT,
  HERO_MAX_HP,
  HORDE_FAST_PICK_THRESHOLD_MS,
  HORDE_PICK_LIMIT_MS,
  HORDE_SPEED_BASE_BONUS,
  MAX_SCOUT_CHARGES,
  STARTING_SCOUT_CHARGES,
  dealBonusBuyRoom,
  dealFreshRoom,
  dealReplacementCards,
  dealSanctuaryRoom,
  getFloorClearBonus,
  getGearSalvagePreview,
  getGoldMultiplierGain,
  getSpellMultiplierGain,
  getStarterWeapon,
  getStartingMaxHp,
  previewMonsterCombat,
  refreshUnpickedRoomCards,
  scaleMultiplierGain,
} from './engine/dungeonEngine';
import {
  RETENTION_STORAGE_KEY,
  TORCH_FLAMES,
  advanceBountyProgress,
  calculateRunEmbers,
  getFlameTheme,
  getNextUnlockedFlameId,
  getRankForEmbers,
  getUnlockedFlames,
  loadRetentionProfile,
  pickNextBounty,
} from './engine/retentionEngine';
import {
  DEFAULT_BET_CENTS,
  MOCK_STARTING_BALANCE_CENTS,
  formatMoney,
  initializeSession,
  settleRgsPlay,
} from './services/rgsClient';
import { soundEngine } from './services/soundEngine';
import { DungeonBackground, getBiomeForFloor } from './components/DungeonBackground';
import { DungeonEmberCanvas } from './components/DungeonEmberCanvas';
import { TitleScreen } from './components/TitleScreen';
import { TopHeader } from './components/TopHeader';
import { DungeonCard } from './components/DungeonCard';
import { HeroHud } from './components/HeroHud';
import { RulesModal } from './components/RulesModal';
import { MenuModal } from './components/MenuModal';
import { BonusBuyModal } from './components/BonusBuyModal';
import { BossForgeModal } from './components/BossForgeModal';
import { DifficultyModal } from './components/DifficultyModal';

const STATS_STORAGE_KEY = 'torch_session_stats_v1';
const RECENT_RUNS_STORAGE_KEY = 'torch_recent_runs_v1';

const AUTO_CASHOUT_OPTIONS: Array<number | null> = [null, 1.5, 2, 3, 5];

const DEFAULT_STATS: SessionStats = {
  runsPlayed: 0,
  bestFloor: 1,
  bestMultiplier: 1.0,
  totalPayout: 0,
};

function loadSavedStats(): SessionStats {
  try {
    const raw = window.localStorage.getItem(STATS_STORAGE_KEY);
    if (!raw) return DEFAULT_STATS;
    const parsed = JSON.parse(raw) as Partial<SessionStats>;
    return {
      runsPlayed: typeof parsed.runsPlayed === 'number' ? parsed.runsPlayed : 0,
      bestFloor: typeof parsed.bestFloor === 'number' ? parsed.bestFloor : 1,
      bestMultiplier:
        typeof parsed.bestMultiplier === 'number' ? parsed.bestMultiplier : 1.0,
      totalPayout: typeof parsed.totalPayout === 'number' ? parsed.totalPayout : 0,
    };
  } catch {
    return DEFAULT_STATS;
  }
}

function loadRecentRuns(): RecentRunEntry[] {
  try {
    const raw = window.localStorage.getItem(RECENT_RUNS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const seen = new Set<string>();
    const valid = parsed
      .filter(
        (item): item is RecentRunEntry =>
          typeof item?.id === 'string' &&
          typeof item?.mult === 'number' &&
          (item?.mode === 'STANDARD' || item?.mode === 'HARDCORE') &&
          typeof item?.win === 'boolean'
      )
      .slice(0, 8);
    return valid.map((item, idx) => {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        return item;
      }
      const uniqueId = `${item.id}-d${idx}`;
      seen.add(uniqueId);
      return { ...item, id: uniqueId };
    });
  } catch {
    return [];
  }
}

const INITIAL_HERO: HeroState = {
  hp: HERO_MAX_HP,
  maxHp: HERO_MAX_HP,
  gold: 0,
  weapon: null,
  shield: null,
};

export default function App() {
  const [screenMode, setScreenMode] = useState<ScreenMode>('TITLE');
  const [rgsConfig, setRgsConfig] = useState<RgsConfig>({
    mode: 'mock',
    rgsUrl: null,
    sessionID: null,
    currency: 'USD',
    unitScale: 100,
    betOptions: DEFAULT_BET_CENTS,
  });
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const [balance, setBalance] = useState<number>(MOCK_STARTING_BALANCE_CENTS);
  const [selectedBet, setSelectedBet] = useState<number>(100);
  const [customBetText, setCustomBetText] = useState<string>('1.00');
  const [activeBet, setActiveBet] = useState<number>(100);
  const [activeWagerCost, setActiveWagerCost] = useState<number>(100);

  const [difficultyMode, setDifficultyMode] = useState<DifficultyMode>('STANDARD');
  const [activeRunDifficulty, setActiveRunDifficulty] =
    useState<DifficultyMode>('STANDARD');
  const [activeRunMultBoost, setActiveRunMultBoost] = useState<number>(1);
  const [activeRgsMode, setActiveRgsMode] = useState<'BASE' | 'BONUS' | 'HARDCORE'>(
    'BASE'
  );

  const [runPhase, setRunPhase] = useState<RunPhase>('IDLE');
  const [floor, setFloor] = useState<number>(1);
  const [roomMode, setRoomMode] = useState<RoomMode>('COMBAT');
  const [sanctuaryPicksLeft, setSanctuaryPicksLeft] = useState<number>(0);
  const [floorsCleared, setFloorsCleared] = useState<number>(0);
  const [cardsClearedInRoom, setCardsClearedInRoom] = useState<number>(0);
  const [monstersDefeated, setMonstersDefeated] = useState<number>(0);
  const [parriesCount, setParriesCount] = useState<number>(0);
  const [combosCount, setCombosCount] = useState<number>(0);
  const [bossesSlain, setBossesSlain] = useState<number>(0);
  const [salvagesCount, setSalvagesCount] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [goldBonusClaimed, setGoldBonusClaimed] = useState<boolean>(false);
  const [multiplier, setMultiplier] = useState<number>(1.0);
  const [pendingGain, setPendingGain] = useState<number>(0);
  const [multiplierPopKey, setMultiplierPopKey] = useState<number>(0);
  const [lastPayout, setLastPayout] = useState<number>(0);

  const [hero, setHero] = useState<HeroState>(INITIAL_HERO);
  const [roomCards, setRoomCards] = useState<DungeonCardData[]>([]);
  const [slashingCardId, setSlashingCardId] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState<boolean>(false);
  const [heroShake, setHeroShake] = useState<boolean>(false);
  const [hitFlashKey, setHitFlashKey] = useState<number>(0);
  const [showHitVignette, setShowHitVignette] = useState<boolean>(false);

  const [feedbacks, setFeedbacks] = useState<FloatingFeedback[]>([]);
  const [bonusBanner, setBonusBanner] = useState<BonusBanner | null>(null);
  const [burst, setBurst] = useState<ParticleBurstRequest | null>(null);
  const [muted, setMuted] = useState<boolean>(false);
  const [musicPlaying, setMusicPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.75);

  const [rulesOpen, setRulesOpen] = useState<boolean>(false);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [bonusBuyOpen, setBonusBuyOpen] = useState<boolean>(false);
  const [bossForgeOpen, setBossForgeOpen] = useState<boolean>(false);
  const [difficultyModalOpen, setDifficultyModalOpen] = useState<boolean>(false);

  const [stats, setStats] = useState<SessionStats>(loadSavedStats);
  const [recentRuns, setRecentRuns] = useState<RecentRunEntry[]>(loadRecentRuns);
  const [retention, setRetention] = useState<RetentionProfile>(loadRetentionProfile);
  const [lastRunRetention, setLastRunRetention] =
    useState<RunRetentionSummary | null>(null);
  const [autoCashoutTarget, setAutoCashoutTarget] = useState<number | null>(null);
  const [lastRunDifficulty, setLastRunDifficulty] =
    useState<DifficultyMode>('STANDARD');
  const [lastRunBonusOption, setLastRunBonusOption] =
    useState<BonusBuyOption | null>(null);
  const [isHordeMode, setIsHordeMode] = useState<boolean>(false);
  const [hordeTimeLeftMs, setHordeTimeLeftMs] =
    useState<number>(HORDE_PICK_LIMIT_MS);
  const [speedStreak, setSpeedStreak] = useState<number>(0);
  const [scoutCharges, setScoutCharges] = useState<number>(STARTING_SCOUT_CHARGES);

  const [actionError, setActionError] = useState<string | null>(null);

  const burstIdRef = useRef<number>(0);
  const bonusIdRef = useRef<number>(0);
  const bannerQueueRef = useRef<Array<{ title: string; rewardText: string }>>([]);
  const bannerActiveRef = useRef<boolean>(false);
  const bannerTimerRef = useRef<number | null>(null);
  const feedbackIdRef = useRef<number>(0);
  const runIdRef = useRef<number>(0);
  const retentionRef = useRef<RetentionProfile>(retention);
  const runBaselineBestFloorRef = useRef<number>(stats.bestFloor);
  const runBaselineBestMultRef = useRef<number>(stats.bestMultiplier);
  const runBaselineRunsPlayedRef = useRef<number>(stats.runsPlayed);
  const floorRecordBrokenRef = useRef<boolean>(false);
  const multRecordBrokenRef = useRef<boolean>(false);
  const runBountyEmbersRef = useRef<number>(0);
  const runBountyCompletedTitleRef = useRef<string | null>(null);
  const runRankedUpToRef = useRef<RankTier | null>(null);
  const runUnlockedFlameRef = useRef<TorchFlameTheme | null>(null);
  const hitTimerRef = useRef<number | null>(null);
  const resolveTimerRef = useRef<number | null>(null);
  const keydownHandlerRef = useRef<(e: KeyboardEvent) => void>(() => {});
  const hordeTimeRef = useRef<number>(HORDE_PICK_LIMIT_MS);
  const hordeTimeoutHandlerRef = useRef<() => void>(() => {});

  useEffect(() => {
    retentionRef.current = retention;
    try {
      window.localStorage.setItem(
        RETENTION_STORAGE_KEY,
        JSON.stringify(retention)
      );
    } catch {
      // ignore storage errors
    }
  }, [retention]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        RECENT_RUNS_STORAGE_KEY,
        JSON.stringify(recentRuns)
      );
    } catch {
      // ignore storage errors
    }
  }, [recentRuns]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
    } catch {
      // ignore storage errors
    }
  }, [stats]);

  const syncBetAmount = useCallback(
    (minorAmt: number) => {
      const floorMin =
        rgsConfig.mode === 'rgs' ? rgsConfig.betOptions[0] ?? 20 : 20;
      const clamped = Math.max(floorMin, Math.round(minorAmt));
      setSelectedBet(clamped);
      setCustomBetText((clamped / rgsConfig.unitScale).toFixed(2));
      setActionError(null);
    },
    [rgsConfig.betOptions, rgsConfig.mode, rgsConfig.unitScale]
  );

  const loadSession = useCallback(async () => {
    setAuthLoading(true);
    setAuthError(null);
    const { config, initialBalance, authError: err } = await initializeSession();
    setRgsConfig(config);
    setBalance(initialBalance);
    const initialBet = config.betOptions[0] ?? 100;
    setSelectedBet(initialBet);
    setCustomBetText((initialBet / config.unitScale).toFixed(2));
    setAuthError(err);
    setAuthLoading(false);
  }, []);

  useEffect(() => {
    void loadSession();
    return () => {
      if (resolveTimerRef.current !== null) {
        window.clearTimeout(resolveTimerRef.current);
        resolveTimerRef.current = null;
      }
      if (hitTimerRef.current !== null) {
        window.clearTimeout(hitTimerRef.current);
        hitTimerRef.current = null;
      }
      if (bannerTimerRef.current !== null) {
        window.clearTimeout(bannerTimerRef.current);
        bannerTimerRef.current = null;
      }
      soundEngine.stopMusic();
      soundEngine.stopHeartbeat();
    };
  }, [loadSession]);

  const rankProgress = getRankForEmbers(retention.embers);
  const activeFlame = getFlameTheme(
    retention.selectedFlameId,
    rankProgress.currentRank.rank
  );
  const unlockedFlames = getUnlockedFlames(rankProgress.currentRank.rank);

  const isLowHp =
    screenMode === 'GAME' && runPhase === 'PLAYING' && hero.hp > 0 && hero.hp <= 6;
  const isCriticalHp =
    screenMode === 'GAME' && runPhase === 'PLAYING' && hero.hp > 0 && hero.hp <= 3;
  const isClimaxFloor = runPhase === 'PLAYING' && floor >= 10;
  const activeBiome = getBiomeForFloor(floor);
  const emberPalette =
    screenMode === 'TITLE' || floor < 5
      ? activeFlame.emberColors
      : activeBiome.emberColors;
  const emberSpeedFactor =
    screenMode === 'TITLE'
      ? 1.05
      : floor >= 20
      ? 1.6
      : floor >= 15
      ? 1.38
      : floor >= 10
      ? 1.2
      : floor >= 5
      ? 1.08
      : 1.0;

  useEffect(() => {
    soundEngine.setFloorTension(screenMode === 'TITLE' ? 1 : floor);
    soundEngine.setBiomeAmbiance(screenMode === 'TITLE' ? 'crypt' : activeBiome.id);
  }, [floor, screenMode, activeBiome.id]);

  useEffect(() => {
    soundEngine.setLowHpHeartbeat(isLowHp);
  }, [isLowHp]);

  const flushBannerQueue = useCallback(() => {
    const nextItem = bannerQueueRef.current.shift();
    if (!nextItem) {
      bannerActiveRef.current = false;
      setBonusBanner(null);
      return;
    }
    bannerActiveRef.current = true;
    bonusIdRef.current += 1;
    const id = bonusIdRef.current;
    setBonusBanner({ id, title: nextItem.title, rewardText: nextItem.rewardText });
    soundEngine.playBonusChime();
    bannerTimerRef.current = window.setTimeout(() => {
      bannerTimerRef.current = null;
      setBonusBanner(null);
      if (bannerQueueRef.current.length > 0) {
        bannerTimerRef.current = window.setTimeout(() => {
          bannerTimerRef.current = null;
          flushBannerQueue();
        }, 120);
      } else {
        bannerActiveRef.current = false;
      }
    }, 1850);
  }, []);

  const showBonus = useCallback(
    (title: string, rewardText: string) => {
      if (!bannerActiveRef.current) {
        bannerQueueRef.current.push({ title, rewardText });
        flushBannerQueue();
        return;
      }
      if (bannerQueueRef.current.length < 4) {
        bannerQueueRef.current.push({ title, rewardText });
      }
    },
    [flushBannerQueue]
  );

  const handleCycleFlame = useCallback(() => {
    if (unlockedFlames.length <= 1) return;
    soundEngine.playButtonClick();
    const nextFlameId = getNextUnlockedFlameId(
      activeFlame.id,
      rankProgress.currentRank.rank
    );
    const updated = { ...retentionRef.current, selectedFlameId: nextFlameId };
    retentionRef.current = updated;
    setRetention(updated);
  }, [activeFlame.id, rankProgress.currentRank.rank, unlockedFlames.length]);

  const applyBountyEvent = useCallback(
    (metric: BountyMetric, delta: number) => {
      if (delta <= 0) return;
      const curr = retentionRef.current;
      const { updatedBounty, completed } = advanceBountyProgress(
        curr.activeBounty,
        metric,
        delta
      );

      if (!completed) {
        if (updatedBounty === curr.activeBounty) return;
        const nextProfile: RetentionProfile = {
          ...curr,
          activeBounty: updatedBounty,
        };
        retentionRef.current = nextProfile;
        setRetention(nextProfile);
        return;
      }

      const prevRank = getRankForEmbers(curr.embers).currentRank;
      const rewardEmbers = curr.activeBounty.rewardEmbers;
      const nextEmbers = curr.embers + rewardEmbers;
      const nextRank = getRankForEmbers(nextEmbers).currentRank;
      const completedCount = curr.completedBounties + 1;
      const nextBounty = pickNextBounty(completedCount, curr.activeBounty.id);

      let nextFlameId = curr.selectedFlameId;
      let unlockedFlame: TorchFlameTheme | null = null;
      if (nextRank.rank > prevRank.rank && nextRank.flameUnlock) {
        unlockedFlame =
          TORCH_FLAMES.find((f) => f.id === nextRank.flameUnlock) ?? null;
        if (unlockedFlame) {
          nextFlameId = unlockedFlame.id;
          runUnlockedFlameRef.current = unlockedFlame;
        }
      }
      if (nextRank.rank > prevRank.rank) {
        runRankedUpToRef.current = nextRank;
      }

      runBountyEmbersRef.current += rewardEmbers;
      runBountyCompletedTitleRef.current = curr.activeBounty.title;

      const nextProfile: RetentionProfile = {
        embers: nextEmbers,
        activeBounty: nextBounty,
        completedBounties: completedCount,
        selectedFlameId: nextFlameId,
      };
      retentionRef.current = nextProfile;
      setRetention(nextProfile);

      showBonus(
        `Bounty Done: ${curr.activeBounty.title}!`,
        `+${rewardEmbers} Embers · Next: ${nextBounty.title}`
      );
      if (nextRank.rank > prevRank.rank) {
        showBonus(
          `Rank ${nextRank.rank}: ${nextRank.title}!`,
          unlockedFlame
            ? `Unlocked ${unlockedFlame.name} Flame`
            : 'New Knight Title Earned'
        );
      }
    },
    [showBonus]
  );

  const checkPersonalBestFloor = useCallback(
    (nextFloor: number) => {
      if (
        runBaselineRunsPlayedRef.current >= 1 &&
        !floorRecordBrokenRef.current &&
        nextFloor > runBaselineBestFloorRef.current
      ) {
        floorRecordBrokenRef.current = true;
        showBonus(
          `New Best Floor: F${nextFloor}!`,
          `Passed prior record F${runBaselineBestFloorRef.current}`
        );
      }
    },
    [showBonus]
  );

  const checkPersonalBestMult = useCallback(
    (nextMult: number) => {
      if (
        runBaselineRunsPlayedRef.current >= 1 &&
        !multRecordBrokenRef.current &&
        nextMult > runBaselineBestMultRef.current
      ) {
        multRecordBrokenRef.current = true;
        showBonus(
          `New Best Mult: ${nextMult.toFixed(2)}x!`,
          `Beats record ${runBaselineBestMultRef.current.toFixed(2)}x`
        );
      }
    },
    [showBonus]
  );

  const pushFeedback = useCallback(
    (
      target: FloatingFeedback['target'],
      text: string,
      tone: FloatingFeedback['tone']
    ) => {
      feedbackIdRef.current += 1;
      const id = `fb-${feedbackIdRef.current}`;
      setFeedbacks((prev) => [...prev, { id, target, text, tone }]);
      setTimeout(() => {
        setFeedbacks((prev) => prev.filter((item) => item.id !== id));
      }, 900);
    },
    []
  );

  const triggerBurst = useCallback(
    (cardIndex: number, color: string, count = 16) => {
      burstIdRef.current += 1;
      const xRatio = 0.2 + cardIndex * 0.2;
      setBurst({
        id: burstIdRef.current,
        xRatio,
        yRatio: 0.44,
        color,
        count,
      });
    },
    []
  );

  const triggerVictoryCelebration = useCallback(() => {
    const victoryPalette = [
      '#fbbf24',
      '#f59e0b',
      '#fde68a',
      '#10b981',
      '#f97316',
      '#c084fc',
    ];
    burstIdRef.current += 1;
    setBurst({
      id: burstIdRef.current,
      xRatio: 0.5,
      yRatio: 0.45,
      color: '#fbbf24',
      count: 140,
      celebration: true,
      palette: victoryPalette,
    });
    window.setTimeout(() => {
      burstIdRef.current += 1;
      setBurst({
        id: burstIdRef.current,
        xRatio: 0.5,
        yRatio: 0.35,
        color: '#10b981',
        count: 100,
        celebration: true,
        palette: victoryPalette,
      });
    }, 240);
  }, []);

  const userMusicDisabledRef = useRef<boolean>(false);

  useEffect(() => {
    if (muted || userMusicDisabledRef.current) return;

    const tryStartMusic = () => {
      if (muted || userMusicDisabledRef.current) return;
      soundEngine.startMusic();
      setMusicPlaying(soundEngine.isMusicPlaying());
    };

    tryStartMusic();

    const unlockOnGesture = () => {
      tryStartMusic();
      if (soundEngine.isMusicPlaying() && soundEngine.isContextRunning()) {
        window.removeEventListener('pointerdown', unlockOnGesture);
        window.removeEventListener('click', unlockOnGesture);
        window.removeEventListener('keydown', unlockOnGesture);
      }
    };

    window.addEventListener('pointerdown', unlockOnGesture, { passive: true });
    window.addEventListener('click', unlockOnGesture, { passive: true });
    window.addEventListener('keydown', unlockOnGesture);
    return () => {
      window.removeEventListener('pointerdown', unlockOnGesture);
      window.removeEventListener('click', unlockOnGesture);
      window.removeEventListener('keydown', unlockOnGesture);
    };
  }, [screenMode, muted]);

  const handleEnterGame = () => {
    soundEngine.playButtonClick();
    if (!muted && !userMusicDisabledRef.current) {
      soundEngine.startMusic();
      setMusicPlaying(true);
    }
    setScreenMode('GAME');
  };

  const handleToggleMute = () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    soundEngine.setMuted(nextMuted);
    if (nextMuted) {
      setMusicPlaying(false);
    } else {
      soundEngine.playButtonClick();
    }
  };

  const handleToggleMusic = () => {
    if (muted) {
      setMuted(false);
      soundEngine.setMuted(false);
    }
    const playing = soundEngine.toggleMusic();
    userMusicDisabledRef.current = !playing;
    setMusicPlaying(playing);
    soundEngine.playButtonClick();
  };

  const handleVolumeChange = (val: number) => {
    setVolume(val);
    soundEngine.setVolume(val);
    if (val > 0 && muted) {
      setMuted(false);
      soundEngine.setMuted(false);
    }
  };

  const finalizeRunSettlement = useCallback(
    async (
      outcome: 'win' | 'loss',
      finalMultiplier: number,
      baseBetUsed: number,
      wagerCostUsed: number,
      floorReached: number,
      kills: number,
      runDifficulty: DifficultyMode,
      rgsMode: 'BASE' | 'BONUS' | 'HARDCORE',
      parries: number,
      combos: number,
      bossKills: number,
      hordeRun = false
    ) => {
      const payoutAmount =
        outcome === 'win' ? Math.round(baseBetUsed * finalMultiplier) : 0;

      setLastPayout(payoutAmount);
      runIdRef.current += 1;
      const entry: RecentRunEntry = {
        id: `run-${Date.now()}-${runIdRef.current}`,
        mult: outcome === 'win' ? finalMultiplier : 0,
        mode: runDifficulty,
        win: outcome === 'win',
        horde: hordeRun,
      };
      setRecentRuns((prev) =>
        [entry, ...prev.filter((r) => r.id !== entry.id)].slice(0, 8)
      );
      const settledFloorsCleared =
        outcome === 'win'
          ? Math.max(1, floorReached)
          : Math.max(0, floorReached - 1);
      const baseRunEmbers = calculateRunEmbers({
        floorsCleared: settledFloorsCleared,
        kills,
        parries,
        bossesSlain: bossKills,
        outcome,
        finalMultiplier,
      });

      const currRet = retentionRef.current;
      const prevRank = getRankForEmbers(currRet.embers).currentRank;
      const nextEmbers = currRet.embers + baseRunEmbers;
      const nextRank = getRankForEmbers(nextEmbers).currentRank;

      let nextFlameId = currRet.selectedFlameId;
      let unlockedFlame: TorchFlameTheme | null = runUnlockedFlameRef.current;
      if (nextRank.rank > prevRank.rank && nextRank.flameUnlock) {
        const newlyUnlocked =
          TORCH_FLAMES.find((f) => f.id === nextRank.flameUnlock) ?? null;
        if (newlyUnlocked) {
          unlockedFlame = newlyUnlocked;
          nextFlameId = newlyUnlocked.id;
        }
      }

      if (nextRank.rank > prevRank.rank) {
        runRankedUpToRef.current = nextRank;
        showBonus(
          `Rank ${nextRank.rank}: ${nextRank.title}!`,
          unlockedFlame
            ? `Unlocked ${unlockedFlame.name} Flame`
            : 'New Knight Title Earned'
        );
      }

      const updatedRetention: RetentionProfile = {
        ...currRet,
        embers: nextEmbers,
        selectedFlameId: nextFlameId,
      };
      retentionRef.current = updatedRetention;
      setRetention(updatedRetention);

      const newBestFloor =
        runBaselineRunsPlayedRef.current >= 1 &&
        floorReached > runBaselineBestFloorRef.current;
      const newBestMult =
        outcome === 'win' &&
        runBaselineRunsPlayedRef.current >= 1 &&
        finalMultiplier > runBaselineBestMultRef.current;
      const floorDeltaToBest = Math.max(
        0,
        runBaselineBestFloorRef.current - floorReached
      );

      setLastRunRetention({
        embersEarned: baseRunEmbers + runBountyEmbersRef.current,
        bountyCompletedTitle: runBountyCompletedTitleRef.current,
        rankedUpTo: runRankedUpToRef.current,
        unlockedFlame,
        newBestFloor,
        newBestMult,
        floorDeltaToBest,
      });

      setStats((prev) => ({
        runsPlayed: prev.runsPlayed + 1,
        bestFloor: Math.max(prev.bestFloor, floorReached),
        bestMultiplier: Math.max(prev.bestMultiplier, finalMultiplier),
        totalPayout: prev.totalPayout + payoutAmount,
      }));

      if (rgsConfig.mode === 'rgs' && rgsConfig.rgsUrl && rgsConfig.sessionID) {
        try {
          const { updatedBalance } = await settleRgsPlay({
            rgsUrl: rgsConfig.rgsUrl,
            sessionID: rgsConfig.sessionID,
            betAmount: wagerCostUsed,
            multiplier: finalMultiplier,
            payoutAmount,
            outcome,
            floorReached,
            monstersDefeated: kills,
            mode: rgsMode,
            difficultyMode: runDifficulty,
            parriesCount: parries,
            combosCount: combos,
            bossesSlain: bossKills,
          });
          if (typeof updatedBalance === 'number') {
            setBalance(updatedBalance);
            return;
          }
        } catch (err) {
          setActionError(
            err instanceof Error
              ? `RGS Settlement Error: ${err.message}`
              : 'Failed to settle round with RGS.'
          );
        }
      }

      if (outcome === 'win') {
        setBalance((prev) => prev + payoutAmount);
      }
    },
    [rgsConfig, showBonus]
  );

  const handleOpenStartDifficulty = () => {
    if (authLoading || authError || runPhase === 'PLAYING') return;
    if (balance < selectedBet) {
      setActionError('Insufficient balance for the selected bet.');
      return;
    }
    soundEngine.playButtonClick();
    setDifficultyModalOpen(true);
  };

  const handleStartRun = (chosenDifficulty: DifficultyMode) => {
    if (authLoading || authError || runPhase === 'PLAYING') return;
    if (balance < selectedBet) {
      setDifficultyModalOpen(false);
      setActionError('Insufficient balance for the selected bet.');
      return;
    }

    if (resolveTimerRef.current !== null) {
      window.clearTimeout(resolveTimerRef.current);
      resolveTimerRef.current = null;
    }
    setDifficultyModalOpen(false);
    setDifficultyMode(chosenDifficulty);
    setLastRunDifficulty(chosenDifficulty);
    setLastRunBonusOption(null);
    runBaselineBestFloorRef.current = stats.bestFloor;
    runBaselineBestMultRef.current = stats.bestMultiplier;
    runBaselineRunsPlayedRef.current = stats.runsPlayed;
    floorRecordBrokenRef.current = false;
    multRecordBrokenRef.current = false;
    runBountyEmbersRef.current = 0;
    runBountyCompletedTitleRef.current = null;
    runRankedUpToRef.current = null;
    runUnlockedFlameRef.current = null;
    setLastRunRetention(null);
    setIsHordeMode(false);
    setSpeedStreak(0);
    setScoutCharges(STARTING_SCOUT_CHARGES);
    hordeTimeRef.current = HORDE_PICK_LIMIT_MS;
    setHordeTimeLeftMs(HORDE_PICK_LIMIT_MS);
    soundEngine.playButtonClick();
    setTimeout(() => soundEngine.playCardFlip(), 80);

    const startMaxHp = getStartingMaxHp(chosenDifficulty);
    setActionError(null);
    setBalance((prev) => Math.max(0, prev - selectedBet));
    setActiveBet(selectedBet);
    setActiveWagerCost(selectedBet);
    setActiveRunDifficulty(chosenDifficulty);
    setActiveRunMultBoost(1);
    setActiveRgsMode(chosenDifficulty === 'HARDCORE' ? 'HARDCORE' : 'BASE');
    setHero({
      ...INITIAL_HERO,
      hp: startMaxHp,
      maxHp: startMaxHp,
      weapon: getStarterWeapon(chosenDifficulty),
    });
    setFloor(1);
    setRoomMode('COMBAT');
    setSanctuaryPicksLeft(0);
    setFloorsCleared(0);
    setCardsClearedInRoom(0);
    setMonstersDefeated(0);
    setParriesCount(0);
    setCombosCount(0);
    setBossesSlain(0);
    setSalvagesCount(0);
    setStreak(0);
    setGoldBonusClaimed(false);
    setMultiplier(1.0);
    setPendingGain(0);
    setShowHitVignette(false);
    setBossForgeOpen(false);
    setLastPayout(0);
    setBonusBanner(null);
    setRoomCards(dealFreshRoom(1, chosenDifficulty));
    setRunPhase('PLAYING');
    setIsResolving(false);
  };

  const handleStartBonusBuy = (option: BonusBuyOption) => {
    if (authLoading || authError || runPhase === 'PLAYING') return;
    const cost = selectedBet * option.costMultiplier;
    if (balance < cost) {
      setActionError('Insufficient balance for this Bonus Buy.');
      return;
    }

    if (resolveTimerRef.current !== null) {
      window.clearTimeout(resolveTimerRef.current);
      resolveTimerRef.current = null;
    }

    const bonusDifficulty: DifficultyMode = 'STANDARD';
    const startMaxHp = getStartingMaxHp(bonusDifficulty);
    const startingHorde = Boolean(option.speedMode);
    setActionError(null);
    setBonusBuyOpen(false);
    setBossForgeOpen(false);
    setDifficultyMode(bonusDifficulty);
    setLastRunDifficulty(bonusDifficulty);
    setLastRunBonusOption(option);
    runBaselineBestFloorRef.current = stats.bestFloor;
    runBaselineBestMultRef.current = stats.bestMultiplier;
    runBaselineRunsPlayedRef.current = stats.runsPlayed;
    floorRecordBrokenRef.current = false;
    multRecordBrokenRef.current = false;
    runBountyEmbersRef.current = 0;
    runBountyCompletedTitleRef.current = null;
    runRankedUpToRef.current = null;
    runUnlockedFlameRef.current = null;
    setLastRunRetention(null);
    setIsHordeMode(startingHorde);
    setSpeedStreak(0);
    setScoutCharges(STARTING_SCOUT_CHARGES);
    hordeTimeRef.current = HORDE_PICK_LIMIT_MS;
    setHordeTimeLeftMs(HORDE_PICK_LIMIT_MS);
    soundEngine.playBonusChime();
    setTimeout(() => soundEngine.playCardFlip(), 90);

    if (autoCashoutTarget !== null && autoCashoutTarget < option.costMultiplier) {
      setAutoCashoutTarget(null);
    }

    setBalance((prev) => Math.max(0, prev - cost));
    setActiveBet(selectedBet);
    setActiveWagerCost(cost);
    setActiveRunDifficulty(bonusDifficulty);
    setActiveRunMultBoost(option.multBoost ?? 1);
    setActiveRgsMode('BONUS');
    setHero({
      ...INITIAL_HERO,
      hp: startMaxHp,
      maxHp: startMaxHp,
      weapon: { ...option.weapon },
      shield: { ...option.shield },
    });
    setFloor(option.startingFloor);
    setRoomMode(option.startingFloor % 5 === 0 ? 'BOSS' : 'COMBAT');
    setSanctuaryPicksLeft(0);
    setFloorsCleared(0);
    setCardsClearedInRoom(0);
    setMonstersDefeated(0);
    setParriesCount(0);
    setCombosCount(0);
    setBossesSlain(0);
    setSalvagesCount(0);
    setStreak(0);
    setGoldBonusClaimed(false);
    setMultiplier(option.startingMultiplier);
    setPendingGain(0);
    setShowHitVignette(false);
    setMultiplierPopKey((k) => k + 1);
    setLastPayout(0);
    setRoomCards(dealBonusBuyRoom(option, bonusDifficulty));
    setRunPhase('PLAYING');
    setIsResolving(false);
    showBonus(
      startingHorde ? 'Horde Escape Started!' : option.name,
      startingHorde
        ? '4.5s per pick · 1 mistake = death!'
        : `Active at ${option.startingMultiplier.toFixed(2)}x`
    );
  };

  const executeCashOut = useCallback(
    async (
      finalMult: number,
      floorNum: number,
      killsNum: number,
      parriesNum: number,
      combosNum: number,
      bossesNum: number,
      isAuto = false
    ) => {
      if (resolveTimerRef.current !== null) {
        window.clearTimeout(resolveTimerRef.current);
        resolveTimerRef.current = null;
      }
      setIsResolving(true);
      setBossForgeOpen(false);
      setPendingGain(0);
      setMultiplier(finalMult);
      soundEngine.stopHeartbeat();
      soundEngine.playCashOut();
      triggerBurst(1.5, '#10b981', 28);
      if (isAuto) {
        showBonus('Auto-Cashout Triggered!', `Secured ${finalMult.toFixed(2)}x`);
      }
      if (finalMult >= 1.35) {
        applyBountyEvent('CASHOUT', 1);
      }
      checkPersonalBestMult(finalMult);
      setRunPhase('CASHED_OUT');

      await finalizeRunSettlement(
        'win',
        finalMult,
        activeBet,
        activeWagerCost,
        floorNum,
        killsNum,
        activeRunDifficulty,
        activeRgsMode,
        parriesNum,
        combosNum,
        bossesNum,
        isHordeMode
      );
      setIsResolving(false);
    },
    [
      activeBet,
      activeRgsMode,
      activeRunDifficulty,
      activeWagerCost,
      applyBountyEvent,
      checkPersonalBestMult,
      finalizeRunSettlement,
      isHordeMode,
      showBonus,
      triggerBurst,
    ]
  );

  const handleCashOut = async () => {
    if (runPhase !== 'PLAYING' || isResolving || floorsCleared < 1) return;
    await executeCashOut(
      multiplier,
      floor,
      monstersDefeated,
      parriesCount,
      combosCount,
      bossesSlain,
      false
    );
  };

  const handleBossForgeUpgrade = (slot: 'WEAPON' | 'SHIELD') => {
    if (runPhase !== 'PLAYING' || !bossForgeOpen) return;
    if (hero.gold < BOSS_FORGE_GOLD_COST) return;

    if (slot === 'WEAPON') {
      const nextPower = (hero.weapon?.power ?? 0) + BOSS_FORGE_UPGRADE_AMOUNT;
      const nextMaxPower = Math.max(
        (hero.weapon?.maxPower ?? 0) + BOSS_FORGE_UPGRADE_AMOUNT,
        nextPower
      );
      setHero((prev) => ({
        ...prev,
        gold: Math.max(0, prev.gold - BOSS_FORGE_GOLD_COST),
        weapon: prev.weapon
          ? {
              ...prev.weapon,
              power: nextPower,
              maxPower: nextMaxPower,
            }
          : {
              name: 'Ember Edge',
              power: BOSS_FORGE_UPGRADE_AMOUNT,
              maxPower: BOSS_FORGE_UPGRADE_AMOUNT,
              variant: 'emberblade',
            },
      }));
      soundEngine.playForgeAnvil();
      pushFeedback('GOLD', `-${BOSS_FORGE_GOLD_COST}G`, 'gold');
      pushFeedback(
        'WEAPON',
        hero.weapon
          ? `+${BOSS_FORGE_UPGRADE_AMOUNT} Power`
          : `Forged ${BOSS_FORGE_UPGRADE_AMOUNT} Pwr`,
        'ember'
      );
      triggerBurst(0.8, '#f97316', 18);
    } else if (slot === 'SHIELD') {
      const nextArmor = (hero.shield?.armor ?? 0) + BOSS_FORGE_UPGRADE_AMOUNT;
      const nextMaxArmor = Math.max(
        (hero.shield?.maxArmor ?? 0) + BOSS_FORGE_UPGRADE_AMOUNT,
        nextArmor
      );
      setHero((prev) => ({
        ...prev,
        gold: Math.max(0, prev.gold - BOSS_FORGE_GOLD_COST),
        shield: prev.shield
          ? {
              ...prev.shield,
              armor: nextArmor,
              maxArmor: nextMaxArmor,
            }
          : {
              name: 'Iron Kite',
              armor: BOSS_FORGE_UPGRADE_AMOUNT,
              maxArmor: BOSS_FORGE_UPGRADE_AMOUNT,
              variant: 'kite',
            },
      }));
      soundEngine.playForgeAnvil();
      pushFeedback('GOLD', `-${BOSS_FORGE_GOLD_COST}G`, 'gold');
      pushFeedback(
        'SHIELD',
        hero.shield
          ? `+${BOSS_FORGE_UPGRADE_AMOUNT} Armor`
          : `Forged ${BOSS_FORGE_UPGRADE_AMOUNT} Arm`,
        'block'
      );
      triggerBurst(2.2, '#38bdf8', 18);
    }
  };

  const handleScoutRoom = () => {
    if (
      runPhase !== 'PLAYING' ||
      isResolving ||
      roomMode !== 'COMBAT' ||
      scoutCharges <= 0 ||
      cardsClearedInRoom >= 3
    ) {
      return;
    }
    setScoutCharges((c) => Math.max(0, c - 1));
    setRoomCards((prev) =>
      refreshUnpickedRoomCards(prev, floor, activeRunDifficulty, activeRunMultBoost)
    );
    if (isHordeMode) {
      hordeTimeRef.current = HORDE_PICK_LIMIT_MS;
      setHordeTimeLeftMs(HORDE_PICK_LIMIT_MS);
    }
    soundEngine.playCardFlip();
    pushFeedback('HERO', 'Scouted Room', 'ember');
  };

  const handleCardSelect = (card: DungeonCardData, index: number) => {
    if (runPhase !== 'PLAYING' || isResolving || card.cleared) return;
    if (card.type === 'MERCHANT_ITEM' && hero.gold < (card.goldCost ?? 0)) {
      return;
    }
    if (
      (card.type === 'MERCHANT_ITEM' || card.type === 'SHRINE_BOON') &&
      card.effectKind === 'HEAL' &&
      hero.hp >= hero.maxHp
    ) {
      return;
    }

    const pickElapsedMs = HORDE_PICK_LIMIT_MS - hordeTimeRef.current;
    setIsResolving(true);
    setSlashingCardId(card.id);

    const updatedCards = roomCards.map((c) =>
      c.id === card.id ? { ...c, cleared: true } : c
    );

    const nextHero: HeroState = { ...hero };
    let nextPending = pendingGain;
    let nextKills = monstersDefeated;
    let nextParries = parriesCount;
    let nextCombos = combosCount;
    let nextBossKills = bossesSlain;
    let nextStreak = streak;
    let defeatedPlayer = false;
    let sanctuaryMultGain = 0;

    if (card.type === 'MONSTER' || card.type === 'BOSS') {
      const preview = previewMonsterCombat(
        card.value,
        hero,
        card.rewardMult,
        activeRunDifficulty,
        isHordeMode,
        activeRunMultBoost,
        floor
      );

      if (hero.weapon) {
        const remainingWeapon = hero.weapon.power - preview.weaponAbsorbed;
        nextHero.weapon =
          remainingWeapon > 0
            ? { ...hero.weapon, power: remainingWeapon }
            : null;
        if (preview.weaponAbsorbed > 0) {
          pushFeedback(
            'WEAPON',
            preview.weaponBreaks ? 'Broken' : `-${preview.weaponAbsorbed}`,
            'ember'
          );
        }
      }

      if (hero.shield && preview.shieldAbsorbed > 0) {
        const remainingShield = hero.shield.armor - preview.shieldAbsorbed;
        nextHero.shield =
          remainingShield > 0
            ? { ...hero.shield, armor: remainingShield }
            : null;
        pushFeedback(
          'SHIELD',
          preview.shieldBreaks ? 'Shattered' : `-${preview.shieldAbsorbed}`,
          'block'
        );
      }

      const hordeFatalHit = isHordeMode && preview.hpDamage > 0;
      const nextHp = hordeFatalHit ? 0 : Math.max(0, hero.hp - preview.hpDamage);
      nextHero.hp = nextHp;

      if (preview.hpDamage > 0) {
        nextStreak = 0;
        setHeroShake(true);
        setTimeout(() => setHeroShake(false), 280);
        setHitFlashKey((k) => k + 1);
        setShowHitVignette(true);
        if (hitTimerRef.current !== null) {
          window.clearTimeout(hitTimerRef.current);
        }
        hitTimerRef.current = window.setTimeout(() => {
          setShowHitVignette(false);
        }, 440);
        pushFeedback(
          'HERO',
          hordeFatalHit ? 'HORDE FATAL!' : `-${preview.hpDamage} HP`,
          'damage'
        );
        soundEngine.playHeroHurt(preview.hpDamage);
      } else {
        nextStreak += 1;
        nextParries += 1;
        setParriesCount(nextParries);
        if (preview.shieldAbsorbed > 0) {
          soundEngine.playShieldBlock();
        } else {
          soundEngine.playSwordSlash();
        }
      }

      triggerBurst(
        index,
        card.type === 'BOSS' ? '#f59e0b' : '#ef4444',
        card.type === 'BOSS' ? 28 : 18
      );

      if (nextHp <= 0) {
        defeatedPlayer = true;
      } else {
        nextKills += 1;
        let gain = preview.multiplierGain;

        // Skill bonuses: Clean Parry (0 HP damage) & Grit (fighting at <=8 HP)
        if (preview.hpDamage === 0) {
          gain = Number(
            (
              gain +
              scaleMultiplierGain(
                0.04,
                activeRunDifficulty,
                activeRunMultBoost,
                floor
              )
            ).toFixed(2)
          );
        }
        if (hero.hp <= 8) {
          gain = Number(
            (
              gain +
              scaleMultiplierGain(
                0.04,
                activeRunDifficulty,
                activeRunMultBoost,
                floor
              )
            ).toFixed(2)
          );
        }
        if (nextStreak > 0 && nextStreak % 3 === 0) {
          const comboBonus = scaleMultiplierGain(
            0.15,
            activeRunDifficulty,
            activeRunMultBoost,
            floor
          );
          gain = Number((gain + comboBonus).toFixed(2));
          nextCombos += 1;
          setCombosCount(nextCombos);
          showBonus(`${nextStreak}-Kill Combo!`, `+${comboBonus.toFixed(2)}x Pending`);
        }

        nextPending = Number((pendingGain + gain).toFixed(2));
        setPendingGain(nextPending);
        setMonstersDefeated(nextKills);
        setStreak(nextStreak);
        applyBountyEvent('KILLS', 1);
        if (preview.hpDamage === 0) {
          applyBountyEvent('PARRIES', 1);
        }
        if (card.type === 'BOSS') {
          nextBossKills += 1;
          setBossesSlain(nextBossKills);
          applyBountyEvent('BOSSES', 1);
          showBonus(`Boss Slain: ${card.name}!`, `+${gain.toFixed(2)}x Pending`);
        }
      }
    } else if (card.type === 'WEAPON') {
      const salvage = getGearSalvagePreview(card, hero);
      if (salvage.isSalvage && hero.weapon) {
        const nextPower = hero.weapon.power + salvage.temperAmount;
        nextHero.weapon = {
          ...hero.weapon,
          power: nextPower,
          maxPower: Math.max(hero.weapon.maxPower, nextPower),
        };
        const nextGold = hero.gold + salvage.goldGain;
        nextHero.gold = nextGold;
        if (!goldBonusClaimed && nextGold >= 25) {
          setGoldBonusClaimed(true);
          const tribute = scaleMultiplierGain(
            0.18,
            activeRunDifficulty,
            activeRunMultBoost,
            floor
          );
          nextPending = Number((pendingGain + tribute).toFixed(2));
          setPendingGain(nextPending);
          showBonus('Golden Tribute!', `25+ Gold · +${tribute.toFixed(2)}x Pending`);
        }
        setSalvagesCount((c) => c + 1);
        applyBountyEvent('GOLD', salvage.goldGain);
        pushFeedback('WEAPON', `+${salvage.temperAmount} Pwr`, 'ember');
        pushFeedback('GOLD', `+${salvage.goldGain}G`, 'gold');
        triggerBurst(index, '#fbbf24', 16);
        soundEngine.playForgeAnvil();
      } else {
        nextHero.weapon = {
          name: card.name,
          power: card.value,
          maxPower: card.value,
          variant: card.variant as WeaponVariant,
        };
        pushFeedback('WEAPON', `Equip +${card.value}`, 'ember');
        triggerBurst(index, '#f97316', 14);
        soundEngine.playEquipGear();
      }
    } else if (card.type === 'SHIELD') {
      const salvage = getGearSalvagePreview(card, hero);
      if (salvage.isSalvage && hero.shield) {
        const nextArmor = hero.shield.armor + salvage.temperAmount;
        nextHero.shield = {
          ...hero.shield,
          armor: nextArmor,
          maxArmor: Math.max(hero.shield.maxArmor, nextArmor),
        };
        const nextGold = hero.gold + salvage.goldGain;
        nextHero.gold = nextGold;
        if (!goldBonusClaimed && nextGold >= 25) {
          setGoldBonusClaimed(true);
          const tribute = scaleMultiplierGain(
            0.18,
            activeRunDifficulty,
            activeRunMultBoost,
            floor
          );
          nextPending = Number((pendingGain + tribute).toFixed(2));
          setPendingGain(nextPending);
          showBonus('Golden Tribute!', `25+ Gold · +${tribute.toFixed(2)}x Pending`);
        }
        setSalvagesCount((c) => c + 1);
        applyBountyEvent('GOLD', salvage.goldGain);
        pushFeedback('SHIELD', `+${salvage.temperAmount} Arm`, 'block');
        pushFeedback('GOLD', `+${salvage.goldGain}G`, 'gold');
        triggerBurst(index, '#38bdf8', 16);
        soundEngine.playForgeAnvil();
      } else {
        nextHero.shield = {
          name: card.name,
          armor: card.value,
          maxArmor: card.value,
          variant: card.variant as ShieldVariant,
        };
        pushFeedback('SHIELD', `Armor +${card.value}`, 'block');
        triggerBurst(index, '#38bdf8', 14);
        soundEngine.playShieldBlock();
      }
    } else if (card.type === 'POTION') {
      const healed = Math.min(hero.maxHp, hero.hp + card.value) - hero.hp;
      nextHero.hp = Math.min(hero.maxHp, hero.hp + card.value);
      pushFeedback('HERO', healed > 0 ? `+${healed} HP` : 'Full HP', 'heal');
      triggerBurst(index, '#10b981', 14);
      soundEngine.playHealPotion();
    } else if (card.type === 'GOLD') {
      const nextGold = hero.gold + card.value;
      nextHero.gold = nextGold;
      let multGain = scaleMultiplierGain(
        getGoldMultiplierGain(card.value),
        activeRunDifficulty,
        activeRunMultBoost,
        floor
      );

      if (!goldBonusClaimed && nextGold >= 25) {
        setGoldBonusClaimed(true);
        const tribute = scaleMultiplierGain(
          0.18,
          activeRunDifficulty,
          activeRunMultBoost,
          floor
        );
        multGain = Number((multGain + tribute).toFixed(2));
        showBonus('Golden Tribute!', `25+ Gold · +${tribute.toFixed(2)}x Pending`);
      }

      nextPending = Number((pendingGain + multGain).toFixed(2));
      setPendingGain(nextPending);
      applyBountyEvent('GOLD', card.value);
      pushFeedback('GOLD', `+${card.value} Gold`, 'gold');
      triggerBurst(index, '#fbbf24', 16);
      soundEngine.playCoinChime();
    } else if (card.type === 'SPELL') {
      const healed = Math.min(hero.maxHp, hero.hp + 1) - hero.hp;
      nextHero.hp = Math.min(hero.maxHp, hero.hp + 1);
      const multGain = scaleMultiplierGain(
        getSpellMultiplierGain(card.value),
        activeRunDifficulty,
        activeRunMultBoost,
        floor
      );
      nextPending = Number((pendingGain + multGain).toFixed(2));
      setPendingGain(nextPending);
      pushFeedback(
        'HERO',
        healed > 0 ? `+${healed} HP · +${multGain.toFixed(2)}x` : `+${multGain.toFixed(2)}x`,
        'spell'
      );
      triggerBurst(index, '#ec4899', 16);
      soundEngine.playSpellCast();
    } else if (card.type === 'BONUS') {
      const bonusMult = scaleMultiplierGain(
        Number((card.value / 100).toFixed(2)),
        activeRunDifficulty,
        activeRunMultBoost,
        floor
      );
      nextHero.hp = Math.min(hero.maxHp, hero.hp + 1);
      nextPending = Number((pendingGain + bonusMult).toFixed(2));
      setPendingGain(nextPending);
      pushFeedback('HERO', `+${bonusMult.toFixed(2)}x`, 'bonus');
      triggerBurst(index, '#a855f7', 22);
      showBonus(`${card.name} Found!`, `+${bonusMult.toFixed(2)}x Pending · +1 HP`);
    } else if (card.type === 'MERCHANT_ITEM') {
      const cost = card.goldCost ?? 0;
      nextHero.gold = Math.max(0, hero.gold - cost);
      pushFeedback('GOLD', `-${cost}G`, 'gold');

      if (card.effectKind === 'WEAPON') {
        nextHero.weapon = {
          name: card.name,
          power: card.value,
          maxPower: card.value,
          variant: 'greatsword',
        };
        soundEngine.playEquipGear();
        pushFeedback('WEAPON', `Equip ${card.value}`, 'ember');
        triggerBurst(index, '#f97316', 18);
      } else if (card.effectKind === 'SHIELD') {
        nextHero.shield = {
          name: card.name,
          armor: card.value,
          maxArmor: card.value,
          variant: 'aegis',
        };
        soundEngine.playShieldBlock();
        pushFeedback('SHIELD', `Armor ${card.value}`, 'block');
        triggerBurst(index, '#38bdf8', 18);
      } else if (card.effectKind === 'HEAL') {
        const healed = Math.min(hero.maxHp, hero.hp + card.value) - hero.hp;
        nextHero.hp = Math.min(hero.maxHp, hero.hp + card.value);
        soundEngine.playHealPotion();
        pushFeedback('HERO', `+${healed} HP`, 'heal');
        triggerBurst(index, '#10b981', 18);
      } else if (card.effectKind === 'UPGRADE_GEAR') {
        const boost = card.value;
        nextHero.weapon = hero.weapon
          ? {
              ...hero.weapon,
              power: hero.weapon.power + boost,
              maxPower: Math.max(hero.weapon.maxPower, hero.weapon.power + boost),
            }
          : { name: 'Ember Edge', power: 5, maxPower: 5, variant: 'emberblade' };
        nextHero.shield = hero.shield
          ? {
              ...hero.shield,
              armor: hero.shield.armor + boost,
              maxArmor: Math.max(hero.shield.maxArmor, hero.shield.armor + boost),
            }
          : { name: 'Iron Kite', armor: 5, maxArmor: 5, variant: 'kite' };
        soundEngine.playForgeAnvil();
        pushFeedback('WEAPON', `+${boost} Pwr`, 'ember');
        pushFeedback('SHIELD', `+${boost} Arm`, 'block');
        triggerBurst(index, '#f59e0b', 20);
      } else if (card.effectKind === 'RELIC') {
        sanctuaryMultGain = scaleMultiplierGain(
          card.rewardMult ?? 0.3,
          activeRunDifficulty,
          activeRunMultBoost,
          floor
        );
        soundEngine.playBonusChime();
        pushFeedback('HERO', `+${sanctuaryMultGain.toFixed(2)}x`, 'bonus');
        triggerBurst(index, '#a855f7', 22);
      }
    } else if (card.type === 'SHRINE_BOON') {
      if (card.effectKind === 'BLESSING') {
        const healed = Math.min(hero.maxHp, hero.hp + 2) - hero.hp;
        nextHero.hp = Math.min(hero.maxHp, hero.hp + 2);
        sanctuaryMultGain = scaleMultiplierGain(
          card.rewardMult ?? 0.22,
          activeRunDifficulty,
          activeRunMultBoost,
          floor
        );
        soundEngine.playBonusChime();
        pushFeedback(
          'HERO',
          healed > 0
            ? `+${healed} HP · +${sanctuaryMultGain.toFixed(2)}x`
            : `+${sanctuaryMultGain.toFixed(2)}x`,
          'bonus'
        );
        triggerBurst(index, '#f59e0b', 22);
      } else if (card.effectKind === 'FORTIFY') {
        const armBoost = card.value;
        nextHero.shield = hero.shield
          ? {
              ...hero.shield,
              armor: hero.shield.armor + armBoost,
              maxArmor: Math.max(hero.shield.maxArmor, hero.shield.armor + armBoost),
            }
          : { name: 'Iron Kite', armor: 4, maxArmor: 4, variant: 'kite' };
        nextHero.gold = hero.gold + 2;
        applyBountyEvent('GOLD', 2);
        soundEngine.playShieldBlock();
        pushFeedback('SHIELD', hero.shield ? `+${armBoost} Arm` : 'Equip 4 Arm', 'block');
        pushFeedback('GOLD', '+2G', 'gold');
        triggerBurst(index, '#38bdf8', 20);
      } else if (card.effectKind === 'UPGRADE_GEAR') {
        const boost = card.value;
        nextHero.weapon = hero.weapon
          ? {
              ...hero.weapon,
              power: hero.weapon.power + boost,
              maxPower: Math.max(hero.weapon.maxPower, hero.weapon.power + boost),
            }
          : { name: 'Ember Edge', power: 4, maxPower: 4, variant: 'emberblade' };
        nextHero.shield = hero.shield
          ? {
              ...hero.shield,
              armor: hero.shield.armor + boost,
              maxArmor: Math.max(hero.shield.maxArmor, hero.shield.armor + boost),
            }
          : { name: 'Iron Kite', armor: 4, maxArmor: 4, variant: 'kite' };
        soundEngine.playForgeAnvil();
        pushFeedback('WEAPON', hero.weapon ? `+${boost} Pwr` : 'Equip 4 Pwr', 'ember');
        pushFeedback('SHIELD', hero.shield ? `+${boost} Arm` : 'Equip 4 Arm', 'block');
        triggerBurst(index, '#f59e0b', 20);
      } else if (card.effectKind === 'HEAL') {
        const healed = Math.min(hero.maxHp, hero.hp + card.value) - hero.hp;
        nextHero.hp = Math.min(hero.maxHp, hero.hp + card.value);
        soundEngine.playHealPotion();
        pushFeedback('HERO', `+${healed} HP`, 'heal');
        triggerBurst(index, '#10b981', 18);
      } else if (card.effectKind === 'FORTUNE') {
        nextHero.gold = hero.gold + card.value;
        applyBountyEvent('GOLD', card.value);
        sanctuaryMultGain = scaleMultiplierGain(
          card.rewardMult ?? 0.15,
          activeRunDifficulty,
          activeRunMultBoost,
          floor
        );
        soundEngine.playBonusChime();
        pushFeedback('GOLD', `+${card.value}G`, 'gold');
        pushFeedback('HERO', `+${sanctuaryMultGain.toFixed(2)}x`, 'bonus');
        triggerBurst(index, '#38bdf8', 20);
      }
    }

    if (isHordeMode && !defeatedPlayer) {
      if (pickElapsedMs <= HORDE_FAST_PICK_THRESHOLD_MS) {
        const nextSpeedStreak = speedStreak + 1;
        setSpeedStreak(nextSpeedStreak);
        const reflexBonus = scaleMultiplierGain(
          Number(
            (HORDE_SPEED_BASE_BONUS + Math.min(5, nextSpeedStreak - 1) * 0.03).toFixed(2)
          ),
          activeRunDifficulty,
          activeRunMultBoost,
          floor
        );
        if (roomMode === 'MERCHANT' || roomMode === 'SHRINE') {
          sanctuaryMultGain = Number((sanctuaryMultGain + reflexBonus).toFixed(2));
        } else {
          nextPending = Number((nextPending + reflexBonus).toFixed(2));
          setPendingGain(nextPending);
        }
        soundEngine.playSpeedBonus(nextSpeedStreak);
        pushFeedback(
          'HERO',
          `FAST x${nextSpeedStreak} +${reflexBonus.toFixed(2)}x`,
          'bonus'
        );
        triggerBurst(index, '#f59e0b', 18);
        if (nextSpeedStreak % 3 === 0) {
          showBonus(
            `Reflex Chain ×${nextSpeedStreak}!`,
            `+${reflexBonus.toFixed(2)}x Speed Bonus`
          );
        }
      } else {
        setSpeedStreak(0);
      }
    }

    const nextDirectMult =
      sanctuaryMultGain > 0
        ? Number((multiplier + sanctuaryMultGain).toFixed(2))
        : multiplier;

    if (sanctuaryMultGain > 0) {
      setMultiplier(nextDirectMult);
      setMultiplierPopKey((k) => k + 1);
      checkPersonalBestMult(nextDirectMult);
    }

    setHero(nextHero);

    if (resolveTimerRef.current !== null) {
      window.clearTimeout(resolveTimerRef.current);
    }
    resolveTimerRef.current = window.setTimeout(async () => {
      resolveTimerRef.current = null;
      setSlashingCardId(null);

      if (defeatedPlayer) {
        setRoomCards(updatedCards);
        setPendingGain(0);
        setBossForgeOpen(false);
        setRunPhase('DEFEAT');
        soundEngine.stopHeartbeat();
        if (isHordeMode) {
          soundEngine.playHordeOverrun();
          showBonus('Horde Fatal Strike!', 'One wrong move cost your life');
        } else {
          soundEngine.playDefeat();
        }
        await finalizeRunSettlement(
          'loss',
          0,
          activeBet,
          activeWagerCost,
          floor,
          nextKills,
          activeRunDifficulty,
          activeRgsMode,
          nextParries,
          nextCombos,
          nextBossKills,
          isHordeMode
        );
        setIsResolving(false);
        return;
      }

      // Sanctuary Room (Merchant or Shrine) — allows up to 2 picks or immediate Exit
      if (roomMode === 'MERCHANT' || roomMode === 'SHRINE') {
        if (
          sanctuaryMultGain > 0 &&
          autoCashoutTarget !== null &&
          floorsCleared >= 1 &&
          nextDirectMult >= autoCashoutTarget
        ) {
          await executeCashOut(
            nextDirectMult,
            floor,
            nextKills,
            nextParries,
            nextCombos,
            nextBossKills,
            true
          );
          return;
        }

        const nextPicks = sanctuaryPicksLeft - 1;
        if (card.type === 'EXIT' || nextPicks <= 0) {
          const nextFloor = floor + 1;
          setFloor(nextFloor);
          setRoomMode(nextFloor % 5 === 0 ? 'BOSS' : 'COMBAT');
          setSanctuaryPicksLeft(0);
          setCardsClearedInRoom(0);
          setRoomCards(
            dealFreshRoom(nextFloor, activeRunDifficulty, activeRunMultBoost)
          );
          checkPersonalBestFloor(nextFloor);
          if (isHordeMode) {
            hordeTimeRef.current = HORDE_PICK_LIMIT_MS;
            setHordeTimeLeftMs(HORDE_PICK_LIMIT_MS);
          }
          soundEngine.playCardFlip();
        } else {
          setSanctuaryPicksLeft(nextPicks);
          setRoomCards(updatedCards);
        }
        setIsResolving(false);
        return;
      }

      const nextClearedCount = cardsClearedInRoom + 1;
      const bossWasSlain = roomMode === 'BOSS' && card.type === 'BOSS';

      if (bossWasSlain) {
        const bankedMultiplier = Number(
          (multiplier + nextPending).toFixed(2)
        );
        const isHighVictory = bankedMultiplier >= 1.5;
        setScoutCharges((c) => Math.min(MAX_SCOUT_CHARGES, c + 1));

        if (isHighVictory) {
          triggerVictoryCelebration();
          soundEngine.playCashOut();
        }

        if (
          autoCashoutTarget !== null &&
          bankedMultiplier >= autoCashoutTarget
        ) {
          setFloorsCleared((c) => c + 1);
          await executeCashOut(
            bankedMultiplier,
            floor,
            nextKills,
            nextParries,
            nextCombos,
            nextBossKills,
            true
          );
          return;
        }

        const sanctuary = dealSanctuaryRoom(floor, nextHero);
        setFloorsCleared((c) => c + 1);
        setMultiplier(bankedMultiplier);
        setPendingGain(0);
        setMultiplierPopKey((k) => k + 1);
        setRoomMode(sanctuary.mode);
        setSanctuaryPicksLeft(2);
        setCardsClearedInRoom(0);
        setRoomCards(sanctuary.cards);
        setBossForgeOpen(true);
        soundEngine.playForgeAnvil();
        applyBountyEvent('FLOORS', 1);
        checkPersonalBestMult(bankedMultiplier);
        showBonus(
          isHighVictory ? 'Victory! Boss Defeated!' : 'Boss Forge Unlocked!',
          `Banked ${bankedMultiplier.toFixed(2)}x · +1 Scout · Upgrade Gear`
        );
        setIsResolving(false);
        return;
      }

      if (nextClearedCount >= 3) {
        const bypassedBoss = roomMode === 'BOSS';
        const nextFloor = floor + 1;
        const nextIsBoss = nextFloor % 5 === 0;
        setFloorsCleared((c) => c + 1);
        setFloor(nextFloor);
        setRoomMode(nextIsBoss ? 'BOSS' : 'COMBAT');
        setCardsClearedInRoom(0);
        setRoomCards(
          dealReplacementCards(
            updatedCards,
            nextFloor,
            activeRunDifficulty,
            activeRunMultBoost
          )
        );

        if (nextIsBoss) {
          soundEngine.playBossSpawn();
        } else {
          soundEngine.playCardFlip();
        }

        const enteredBiome = getBiomeForFloor(nextFloor);
        const isMajorRealmShift =
          nextFloor === 10 || nextFloor === 15 || nextFloor === 20;

        let extraBonus = 0;
        if (bypassedBoss) {
          showBonus(
            `Passed Floor ${floor}`,
            'Slipped past Boss · No Boss Forge/Sanctuary'
          );
        } else {
          extraBonus = scaleMultiplierGain(
            getFloorClearBonus(floor),
            activeRunDifficulty,
            activeRunMultBoost,
            floor
          );
          if (isMajorRealmShift) {
            const healed =
              Math.min(nextHero.maxHp, nextHero.hp + 2) - nextHero.hp;
            setHero({ ...nextHero, hp: nextHero.hp + healed });
            triggerBurst(1.5, enteredBiome.glowPrimary, 30);
            showBonus(
              `${enteredBiome.name} Boss!`,
              `Banked +${(nextPending + extraBonus).toFixed(2)}x · +2 HP`
            );
          } else if (nextIsBoss || nextFloor === 3 || nextFloor === 7) {
            const healed =
              Math.min(nextHero.maxHp, nextHero.hp + 1) - nextHero.hp;
            setHero({ ...nextHero, hp: nextHero.hp + healed });
            showBonus(
              nextIsBoss
                ? `Boss Approaching (F${nextFloor})!`
                : `Floor ${floor} Cleared!`,
              `Banked +${(nextPending + extraBonus).toFixed(2)}x · +1 HP`
            );
          } else {
            pushFeedback('HERO', `Floor +${extraBonus.toFixed(2)}x`, 'bonus');
          }
        }

        const finalBanked = Number(
          (multiplier + nextPending + extraBonus).toFixed(2)
        );

        if (autoCashoutTarget !== null && finalBanked >= autoCashoutTarget) {
          await executeCashOut(
            finalBanked,
            nextFloor,
            nextKills,
            nextParries,
            nextCombos,
            nextBossKills,
            true
          );
          return;
        }

        setMultiplier(finalBanked);
        setPendingGain(0);
        setMultiplierPopKey((k) => k + 1);
        applyBountyEvent('FLOORS', 1);
        checkPersonalBestFloor(nextFloor);
        checkPersonalBestMult(finalBanked);
      } else {
        setRoomCards(updatedCards);
        setCardsClearedInRoom(nextClearedCount);
      }

      if (isHordeMode) {
        hordeTimeRef.current = HORDE_PICK_LIMIT_MS;
        setHordeTimeLeftMs(HORDE_PICK_LIMIT_MS);
      }
      setIsResolving(false);
    }, 220);
  };

  // Slider spans from minBet ($0.20 in demo) up to 100% of current balance (or max RGS bet)
  const minBet = rgsConfig.mode === 'rgs' ? rgsConfig.betOptions[0] ?? 20 : 20;
  const maxBetLimit = Math.max(
    minBet,
    rgsConfig.mode === 'rgs'
      ? Math.min(
          Math.max(balance, minBet),
          rgsConfig.betOptions[rgsConfig.betOptions.length - 1] ?? balance
        )
      : Math.max(balance, minBet)
  );
  const sliderStep =
    rgsConfig.unitScale >= 100000
      ? Math.round(0.1 * rgsConfig.unitScale)
      : 10;
  const sliderPct =
    maxBetLimit > minBet
      ? Math.max(
          0,
          Math.min(100, ((selectedBet - minBet) / (maxBetLimit - minBet)) * 100)
        )
      : 0;

  const handleCustomBetBlur = () => {
    const parsed = Number.parseFloat(customBetText);
    if (!Number.isFinite(parsed)) {
      setCustomBetText((selectedBet / rgsConfig.unitScale).toFixed(2));
      return;
    }
    const rawMinor = Math.round(parsed * rgsConfig.unitScale);
    const clamped = Math.max(minBet, Math.min(maxBetLimit, rawMinor));
    syncBetAmount(clamped);
  };

  const potentialPayout = Math.round(activeBet * multiplier);
  const canCashOut =
    runPhase === 'PLAYING' && !isResolving && floorsCleared >= 1;

  keydownHandlerRef.current = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement | null;
    if (
      target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable)
    ) {
      return;
    }

    if (e.key === 'Escape') {
      if (rulesOpen) setRulesOpen(false);
      else if (menuOpen) setMenuOpen(false);
      else if (bonusBuyOpen) setBonusBuyOpen(false);
      else if (difficultyModalOpen) setDifficultyModalOpen(false);
      else if (bossForgeOpen) {
        if (isHordeMode) {
          hordeTimeRef.current = HORDE_PICK_LIMIT_MS;
          setHordeTimeLeftMs(HORDE_PICK_LIMIT_MS);
        }
        setBossForgeOpen(false);
      }
      return;
    }

    if (rulesOpen || menuOpen || bonusBuyOpen) return;

    if (difficultyModalOpen) {
      if (e.key === '1') {
        e.preventDefault();
        handleStartRun('STANDARD');
      } else if (e.key === '2') {
        e.preventDefault();
        handleStartRun('HARDCORE');
      }
      return;
    }

    if (bossForgeOpen) {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        soundEngine.playCardFlip();
        if (isHordeMode) {
          hordeTimeRef.current = HORDE_PICK_LIMIT_MS;
          setHordeTimeLeftMs(HORDE_PICK_LIMIT_MS);
        }
        setBossForgeOpen(false);
      }
      return;
    }

    if (screenMode === 'TITLE') {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleEnterGame();
      }
      return;
    }

    if (
      runPhase === 'PLAYING' &&
      !isResolving &&
      (e.key === '1' || e.key === '2' || e.key === '3' || e.key === '4')
    ) {
      const idx = Number(e.key) - 1;
      const card = roomCards[idx];
      if (card && !card.cleared) {
        e.preventDefault();
        handleCardSelect(card, idx);
      }
      return;
    }

    if (e.key === ' ') {
      e.preventDefault();
      if (runPhase === 'PLAYING') {
        if (canCashOut) {
          void handleCashOut();
        }
      } else if (runPhase === 'IDLE') {
        handleOpenStartDifficulty();
      } else if (runPhase === 'CASHED_OUT' || runPhase === 'DEFEAT') {
        if (lastRunBonusOption) {
          if (balance >= selectedBet * lastRunBonusOption.costMultiplier) {
            handleStartBonusBuy(lastRunBonusOption);
          } else {
            setActionError('Insufficient balance for Bonus Buy Re-Run.');
          }
        } else {
          handleStartRun(lastRunDifficulty);
        }
      }
    }
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => keydownHandlerRef.current(e);
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  hordeTimeoutHandlerRef.current = () => {
    if (runPhase !== 'PLAYING' || isResolving || !isHordeMode) return;
    if (resolveTimerRef.current !== null) {
      window.clearTimeout(resolveTimerRef.current);
      resolveTimerRef.current = null;
    }
    setIsResolving(true);
    setPendingGain(0);
    setBossForgeOpen(false);
    setHero((prev) => ({ ...prev, hp: 0 }));
    setHitFlashKey((k) => k + 1);
    setShowHitVignette(true);
    soundEngine.stopHeartbeat();
    soundEngine.playHordeOverrun();
    triggerBurst(1.5, '#f43f5e', 30);
    showBonus('Horde Overrun!', 'Out of time — the horde caught you');
    setRunPhase('DEFEAT');

    void finalizeRunSettlement(
      'loss',
      0,
      activeBet,
      activeWagerCost,
      floor,
      monstersDefeated,
      activeRunDifficulty,
      activeRgsMode,
      parriesCount,
      combosCount,
      bossesSlain,
      true
    ).finally(() => {
      setIsResolving(false);
    });
  };

  const isHordeTimerActive =
    screenMode === 'GAME' &&
    runPhase === 'PLAYING' &&
    isHordeMode &&
    roomMode !== 'MERCHANT' &&
    roomMode !== 'SHRINE' &&
    !isResolving &&
    !bossForgeOpen &&
    !rulesOpen &&
    !menuOpen &&
    !bonusBuyOpen &&
    !difficultyModalOpen;

  useEffect(() => {
    if (!isHordeTimerActive) return;

    let rafId = 0;
    let lastNow = performance.now();
    let lastTickBucket = -1;

    const frame = (now: number) => {
      const dt = Math.min(120, Math.max(0, now - lastNow));
      lastNow = now;

      const nextMs = Math.max(0, hordeTimeRef.current - dt);
      hordeTimeRef.current = nextMs;
      setHordeTimeLeftMs(nextMs);

      if (nextMs > 0 && nextMs <= 2000) {
        const urgent = nextMs <= 1000;
        const intervalMs = urgent ? 260 : 480;
        const bucket = Math.floor(nextMs / intervalMs);
        if (bucket !== lastTickBucket) {
          lastTickBucket = bucket;
          soundEngine.playHordeTick(urgent);
        }
      }

      if (nextMs <= 0) {
        hordeTimeoutHandlerRef.current();
        return;
      }

      rafId = window.requestAnimationFrame(frame);
    };

    rafId = window.requestAnimationFrame(frame);
    return () => window.cancelAnimationFrame(rafId);
  }, [isHordeTimerActive]);

  const feverPips = streak > 0 && streak % 3 === 0 ? 3 : streak % 3;
  const isFeverBlazing = streak > 0 && streak % 3 === 0;
  const isHordeUrgent = isHordeMode && runPhase === 'PLAYING' && hordeTimeLeftMs <= 1500;
  const hordeRatio = Math.max(0, Math.min(1, hordeTimeLeftMs / HORDE_PICK_LIMIT_MS));

  const gridThemeStyle =
    floor >= 20
      ? 'border-orange-500/85 bg-gradient-to-b from-[#3b120c] via-[#260b07] to-[#140504]'
      : floor >= 15
      ? 'border-purple-500/80 bg-gradient-to-b from-[#2b133d] via-[#1c0c29] to-[#110619]'
      : floor >= 10
      ? 'border-rose-600/80 bg-gradient-to-b from-[#36131f] via-[#240b14] to-[#14060b]'
      : floor >= 5
      ? 'border-amber-600/75 bg-gradient-to-b from-[#2f2116] via-[#21170f] to-[#140e09]'
      : 'border-stone-600/80 bg-gradient-to-b from-[#2c313d] via-[#1f232c] to-[#161920]';

  return (
    <div className="relative flex h-dvh w-full flex-col justify-between overflow-hidden bg-transparent text-stone-100">
      <DungeonBackground floor={floor} isTitle={screenMode === 'TITLE'} />
      <DungeonEmberCanvas
        burst={burst}
        intense={screenMode === 'TITLE' || isClimaxFloor || runPhase === 'PLAYING'}
        palette={emberPalette}
        speedFactor={emberSpeedFactor}
        interactive={screenMode === 'TITLE'}
        titleOverlay={screenMode === 'TITLE'}
      />

      {showHitVignette && (
        <div
          key={hitFlashKey}
          className="animate-hit-vignette pointer-events-none fixed inset-0 z-30"
          style={{
            boxShadow: 'inset 0 0 54px 12px rgba(220, 38, 38, 0.34)',
          }}
          aria-hidden="true"
        />
      )}

      {(isLowHp || isHordeUrgent) && (
        <div
          className="animate-danger-heartbeat pointer-events-none fixed inset-0 z-30"
          style={{
            boxShadow:
              isCriticalHp || isHordeUrgent
                ? 'inset 0 0 60px 16px rgba(220, 38, 38, 0.38)'
                : 'inset 0 0 40px 8px rgba(220, 38, 38, 0.18)',
          }}
          aria-hidden="true"
        />
      )}

      {bonusBanner && (
        <div
          key={bonusBanner.id}
          className="animate-bonus-slide pointer-events-none fixed top-12 sm:top-14 left-1/2 z-40 flex w-[calc(100vw-1rem)] max-w-sm sm:w-auto sm:max-w-lg items-center justify-center gap-2 rounded-xl border-2 border-amber-300/80 bg-gradient-to-r from-violet-950/95 via-amber-950/95 to-violet-950/95 px-3 py-1.5 sm:px-4 sm:py-2 shadow-[0_0_28px_rgba(245,158,11,0.55)]"
        >
          <Crown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-300 shrink-0" />
          <div className="min-w-0 text-[11px] sm:text-xs font-black leading-snug text-amber-100 sm:whitespace-nowrap">
            <span>{bonusBanner.title}</span>{' '}
            <span className="text-emerald-300">{bonusBanner.rewardText}</span>
          </div>
        </div>
      )}

      {screenMode === 'TITLE' ? (
        <TitleScreen
          balance={balance}
          rgsConfig={rgsConfig}
          authLoading={authLoading}
          onPlay={handleEnterGame}
          onOpenRules={() => {
            soundEngine.playButtonClick();
            setRulesOpen(true);
          }}
        />
      ) : (
        <div className="relative z-10 flex min-h-0 w-full flex-1 flex-col gap-1.5 sm:gap-3 px-2 pt-1.5 pb-2 sm:px-5 sm:pt-3 sm:pb-6">
          {/* SLIM TOP NAV BAR WITH MENU */}
          <div className="shrink-0">
            <TopHeader
              balance={balance}
              multiplier={multiplier}
              pendingGain={pendingGain}
              multiplierPopKey={multiplierPopKey}
              streak={streak}
              rgsConfig={rgsConfig}
              onOpenMenu={() => {
                soundEngine.playButtonClick();
                setMenuOpen(true);
              }}
              onOpenRules={() => {
                soundEngine.playButtonClick();
                setRulesOpen(true);
              }}
            />
          </div>

          {/* CENTERED PLAYABLE STAGE: BOARD + HERO HUD + LIFTED CONTROLS */}
          <div className="mx-auto flex min-h-0 w-full max-w-[920px] flex-1 flex-col items-center justify-center gap-1.5 sm:gap-3 pb-2 sm:pb-8">
          <main className="flex min-h-0 w-full shrink flex-col items-center gap-1.5 sm:gap-2.5">
            {(authError || actionError) && (
              <div className="flex w-full shrink-0 items-center justify-between gap-3 rounded-lg border border-red-500/40 bg-red-950/70 px-3 py-1.5 text-xs text-red-200">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
                  <span>{authError ?? actionError}</span>
                </div>
                {authError ? (
                  <button
                    type="button"
                    onClick={() => void loadSession()}
                    className="inline-flex shrink-0 items-center gap-1 rounded border border-red-400/50 bg-red-900/60 px-2 py-0.5 text-xs font-bold text-red-100 hover:bg-red-800/70 cursor-pointer"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Retry
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActionError(null)}
                    className="shrink-0 text-[11px] font-bold text-red-200 hover:text-white cursor-pointer"
                  >
                    Dismiss
                  </button>
                )}
              </div>
            )}

            {/* Recent Multipliers Strip */}
            {recentRuns.length > 0 && (
              <div className="flex w-full shrink-0 items-center justify-between gap-2 px-1 text-xs tabular-nums">
                <span className="font-bold uppercase tracking-wider text-stone-500 shrink-0">
                  Recent
                </span>
                <div className="flex items-center gap-2.5 overflow-hidden whitespace-nowrap">
                  {recentRuns.map((entry) => (
                    <span
                      key={entry.id}
                      className={
                        entry.win
                          ? entry.horde
                            ? 'font-black text-amber-300'
                            : 'font-black text-emerald-400'
                          : entry.horde
                          ? 'font-semibold text-rose-400/75'
                          : 'font-semibold text-stone-500'
                      }
                    >
                      {entry.mult.toFixed(2)}x
                      {entry.mode === 'HARDCORE' ? 'ᴴ' : ''}
                      {entry.horde ? '⚡' : ''}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Middle Dungeon Grid */}
            <section
              aria-label="Dungeon Grid"
              className={`min-h-0 w-full shrink overflow-y-auto rounded-2xl border-2 sm:border-[3px] p-1.5 sm:p-3 transition-colors duration-700 shadow-[0_12px_28px_rgba(0,0,0,0.65)] ${gridThemeStyle}`}
            >
              {runPhase === 'PLAYING' && (
                <div className="mb-1.5 sm:mb-2.5 flex items-center justify-between gap-2 px-1 text-xs sm:text-sm">
                  <div className="flex items-center gap-1.5 font-bold text-stone-300 tabular-nums min-w-0">
                    <Flame
                      className={`h-3.5 w-3.5 shrink-0 ${
                        isClimaxFloor || activeRunDifficulty === 'HARDCORE'
                          ? 'text-rose-400'
                          : 'text-orange-400'
                      }`}
                    />
                    <span className="truncate">
                      Floor {floor} ·{' '}
                      {roomMode === 'MERCHANT'
                        ? 'Merchant'
                        : roomMode === 'SHRINE'
                        ? 'Shrine'
                        : roomMode === 'BOSS'
                        ? 'Boss'
                        : activeBiome.name}
                    </span>
                    {activeRunDifficulty === 'HARDCORE' && (
                      <span className="text-rose-400 font-black shrink-0">
                        · HC
                      </span>
                    )}
                  </div>

                  {/* Torch Fever 3-Pip Streak Meter */}
                  <div
                    className="flex items-center gap-1.5 shrink-0"
                    title="Torch Fever: 3 clean kills without HP loss grants bonus multiplier"
                  >
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider ${
                        isFeverBlazing ? 'text-amber-300' : 'text-stone-400'
                      }`}
                    >
                      {isFeverBlazing ? 'Fever!' : 'Fever'}
                    </span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3].map((pip) => (
                        <span
                          key={pip}
                          className={[
                            'h-2 w-3.5 rounded-sm transition-all duration-200',
                            pip <= feverPips
                              ? isFeverBlazing
                                ? 'bg-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.9)]'
                                : 'bg-orange-400 shadow-[0_0_6px_rgba(249,115,22,0.7)]'
                              : 'bg-stone-800 border border-stone-700',
                          ].join(' ')}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 font-bold text-stone-300 tabular-nums shrink-0">
                    {roomMode === 'COMBAT' && cardsClearedInRoom < 3 && (
                      <button
                        type="button"
                        disabled={isResolving || scoutCharges <= 0}
                        onClick={handleScoutRoom}
                        title="Scout: Re-roll unpicked cards in this room (+1 charge per Boss)"
                        className={[
                          'inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-black transition-colors whitespace-nowrap',
                          scoutCharges > 0 && !isResolving
                            ? 'cursor-pointer border-cyan-400/55 bg-cyan-500/15 text-cyan-200 hover:bg-cyan-500/25'
                            : 'cursor-not-allowed border-stone-700 bg-stone-900/60 text-stone-500',
                        ].join(' ')}
                      >
                        <RefreshCw className="h-2.5 w-2.5 shrink-0" />
                        <span>Scout {scoutCharges}</span>
                      </button>
                    )}

                    <span>
                      {roomMode === 'MERCHANT' || roomMode === 'SHRINE' ? (
                        <>
                          Picks:{' '}
                          <span className="text-cyan-300">{sanctuaryPicksLeft}</span>
                        </>
                      ) : roomMode === 'BOSS' ? (
                        <span className="text-amber-300">
                          Slay Boss or {cardsClearedInRoom}/3
                        </span>
                      ) : (
                        <>
                          Cleared:{' '}
                          <span className="text-amber-400">{cardsClearedInRoom}/3</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>
              )}

              {runPhase === 'PLAYING' && isHordeMode && (
                roomMode === 'MERCHANT' || roomMode === 'SHRINE' ? (
                  <div className="mb-2 flex items-center justify-between gap-2 rounded-lg border border-cyan-500/40 bg-cyan-950/35 px-2.5 py-1.5 text-[11px] font-black text-cyan-200">
                    <div className="flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5 text-cyan-300 shrink-0" />
                      <span>HORDE HELD · SANCTUARY SAFE</span>
                    </div>
                    <span className="text-[10px] font-bold text-cyan-300/85">
                      Timer paused while choosing
                    </span>
                  </div>
                ) : (
                  <div className="mb-2 rounded-lg border border-rose-500/45 bg-rose-950/55 px-2.5 py-1.5">
                    <div className="mb-1 flex items-center justify-between gap-2 text-[11px] font-black tabular-nums">
                      <div className="flex items-center gap-1.5 text-rose-200">
                        <Zap className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                        <span className={isHordeUrgent ? 'text-rose-300' : 'text-rose-100'}>
                          {isHordeUrgent ? 'HURRY — HORDE!' : 'HORDE CHASE'}
                        </span>
                        {speedStreak > 0 && (
                          <span className="text-amber-300">
                            · Reflex ×{speedStreak}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {hordeTimeLeftMs >= HORDE_PICK_LIMIT_MS - HORDE_FAST_PICK_THRESHOLD_MS && (
                          <span className="hidden sm:inline text-[10px] font-extrabold text-amber-300">
                            &lt;2s Speed Bonus Ready
                          </span>
                        )}
                        <span
                          className={`inline-flex items-center gap-1 font-mono text-xs ${
                            isHordeUrgent ? 'text-rose-300' : 'text-amber-200'
                          }`}
                        >
                          <Timer className="h-3 w-3 shrink-0" />
                          {(hordeTimeLeftMs / 1000).toFixed(1)}s
                        </span>
                      </div>
                    </div>
                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-stone-950">
                      <div
                        className={`h-full w-full origin-left ${
                          isHordeUrgent
                            ? 'bg-gradient-to-r from-red-600 to-rose-400'
                            : hordeTimeLeftMs >=
                              HORDE_PICK_LIMIT_MS - HORDE_FAST_PICK_THRESHOLD_MS
                            ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                            : 'bg-gradient-to-r from-orange-500 to-rose-500'
                        }`}
                        style={{
                          transform: `scaleX(${hordeRatio})`,
                          willChange: 'transform',
                        }}
                      />
                      {/* 2.0s Speed Bonus threshold notch (2.5s remaining = 55.6%) */}
                      <div
                        className="pointer-events-none absolute top-0 bottom-0 w-0.5 bg-amber-200/90"
                        style={{ left: '55.6%' }}
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                )
              )}

              {runPhase === 'IDLE' ? (
                <div className="flex min-h-[154px] sm:min-h-[188px] flex-col items-center justify-center rounded-xl border border-stone-800 bg-[#0d1016]/85 px-4 py-3 text-center">
                  <div className="mb-1.5 flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/40 bg-orange-500/15 shadow-torch">
                    <Flame className="h-5 w-5 text-orange-400" />
                  </div>
                  <h2 className="font-serif text-lg sm:text-xl font-black tracking-wide text-amber-200">
                    The Dungeon Awaits
                  </h2>
                  <p className="mt-0.5 max-w-lg text-xs sm:text-sm text-stone-400">
                    Set your wager and press Start Run to enter Floor 1. Clear 3 of 4 cards per floor.
                  </p>

                  {/* Compact Unboxed Retention Strip: Rank, Active Bounty & Cosmetic Flame */}
                  <div className="mt-2.5 w-full max-w-lg border-t border-stone-800/90 pt-2 text-xs tabular-nums">
                    <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-stone-300">
                      <span className="inline-flex items-center gap-1 font-bold">
                        <Award className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                        <span className={activeFlame.textAccentClass}>
                          Rank {rankProgress.currentRank.rank} · {rankProgress.currentRank.title}
                        </span>
                      </span>
                      <span className="text-stone-600" aria-hidden="true">·</span>
                      <span className="text-stone-400">
                        {retention.embers} Embers
                      </span>
                      {unlockedFlames.length > 1 && (
                        <>
                          <span className="text-stone-600" aria-hidden="true">·</span>
                          <button
                            type="button"
                            onClick={handleCycleFlame}
                            title="Cycle unlocked Torch Flame cosmetic"
                            className="inline-flex items-center gap-1 font-bold text-stone-200 hover:text-white underline decoration-stone-600 underline-offset-2 cursor-pointer whitespace-nowrap"
                          >
                            <Flame
                              className="h-3.5 w-3.5 shrink-0"
                              style={{ color: activeFlame.dotColor }}
                              aria-hidden="true"
                            />
                            <span>Flame: {activeFlame.name}</span>
                          </button>
                        </>
                      )}
                    </div>
                    <div className="mt-1 flex items-center justify-center gap-1.5 text-stone-400">
                      <Target className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                      <span>
                        Bounty: <strong className="text-stone-200">{retention.activeBounty.title}</strong>{' '}
                        ({retention.activeBounty.progress}/{retention.activeBounty.target})
                      </span>
                      <span className="text-stone-600" aria-hidden="true">·</span>
                      <span className="font-bold text-emerald-400">
                        +{retention.activeBounty.rewardEmbers} Embers
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap justify-center gap-1 sm:gap-2.5 rounded-xl border border-stone-900 bg-[#0d1016]/80 p-1 sm:p-2.5 shadow-inner">
                  {roomCards.map((card, index) => (
                    <div
                      key={card.id}
                      className="w-[calc(50%-0.125rem)] min-w-[132px] sm:w-[calc(25%-0.46875rem)] shrink-0"
                    >
                      <DungeonCard
                        card={card}
                        hero={hero}
                        difficulty={activeRunDifficulty}
                        multBoost={activeRunMultBoost}
                        floor={floor}
                        isHorde={isHordeMode}
                        index={index}
                        disabled={runPhase !== 'PLAYING' || isResolving}
                        isSlashing={slashingCardId === card.id}
                        onSelect={handleCardSelect}
                      />
                    </div>
                  ))}
                </div>
              )}

              {(runPhase === 'CASHED_OUT' || runPhase === 'DEFEAT') && (
                <div className="mt-1 sm:mt-1.5 rounded-xl border border-stone-700 bg-obsidian-950/95 px-2 py-1 sm:px-2.5 sm:py-2">
                  <div className="flex items-center justify-between gap-2">
                    {/* Compact Post-Run Breakdown */}
                    <div className="grid flex-1 grid-cols-4 sm:grid-cols-5 gap-1 text-center text-[10px] sm:text-[11px] tabular-nums">
                      <div className="min-w-0">
                        <div className="text-[9px] sm:text-[10px] text-stone-500">Floor</div>
                        <div className="font-black text-amber-300 truncate">F{floor}</div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-[9px] sm:text-[10px] text-stone-500">Slain</div>
                        <div className="font-black text-stone-200 truncate">
                          {monstersDefeated}
                          {bossesSlain > 0 ? ` (${bossesSlain}B)` : ''}
                        </div>
                      </div>
                      <div className="hidden sm:block min-w-0">
                        <div className="text-[10px] text-stone-500">Skill</div>
                        <div className="font-black text-cyan-300 whitespace-nowrap">
                          {parriesCount}P · {salvagesCount}S
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-[9px] sm:text-[10px] text-stone-500">Mult</div>
                        <div className="font-black text-emerald-400 truncate">
                          {runPhase === 'CASHED_OUT'
                            ? `${multiplier.toFixed(2)}x`
                            : '0.00x'}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-[9px] sm:text-[10px] text-stone-500">
                          {runPhase === 'CASHED_OUT' ? 'Payout' : 'Lost'}
                        </div>
                        <div
                          className={`font-black truncate ${
                            runPhase === 'CASHED_OUT'
                              ? 'text-emerald-400'
                              : 'text-red-400'
                          }`}
                        >
                          {runPhase === 'CASHED_OUT'
                            ? `+${formatMoney(lastPayout, rgsConfig.currency, rgsConfig.unitScale)}`
                            : `-${formatMoney(activeWagerCost, rgsConfig.currency, rgsConfig.unitScale)}`}
                        </div>
                      </div>
                    </div>

                    {/* 1-Tap Quick Re-Run */}
                    {(() => {
                      const rerunBonus = lastRunBonusOption;
                      const rerunIsHorde = Boolean(rerunBonus?.speedMode);
                      const rerunCost = rerunBonus
                        ? selectedBet * rerunBonus.costMultiplier
                        : selectedBet;
                      const rerunLabel = rerunBonus
                        ? rerunBonus.id === 'horde_escape'
                          ? 'Re-Run · Horde'
                          : rerunBonus.id === 'armory'
                          ? 'Re-Run · Armory'
                          : rerunBonus.id === 'relic_vault'
                          ? 'Re-Run · Relic'
                          : 'Re-Run · Dragon'
                        : `Re-Run · ${lastRunDifficulty === 'HARDCORE' ? 'HC' : 'Std'}`;
                      return (
                        <button
                          type="button"
                          disabled={
                            authLoading ||
                            Boolean(authError) ||
                            balance < rerunCost
                          }
                          onClick={() => {
                            if (rerunBonus) {
                              handleStartBonusBuy(rerunBonus);
                            } else {
                              handleStartRun(lastRunDifficulty);
                            }
                          }}
                          title={
                            rerunBonus
                              ? `Instant replay in ${rerunBonus.name} (${rerunBonus.costMultiplier}× Bet) [Space]`
                              : `Instant replay in ${
                                  lastRunDifficulty === 'HARDCORE' ? 'Hardcore' : 'Standard'
                                } mode [Space]`
                          }
                          className={[
                            'inline-flex min-h-[32px] sm:min-h-[34px] shrink-0 items-center justify-center gap-1 rounded-lg border px-2 sm:px-2.5 py-1 text-[10px] sm:text-[11px] font-black transition-all whitespace-nowrap cursor-pointer disabled:cursor-not-allowed disabled:opacity-45',
                            rerunIsHorde
                              ? 'border-rose-400/80 bg-gradient-to-b from-rose-500 to-red-700 text-white hover:brightness-110'
                              : rerunBonus
                              ? 'border-violet-400/80 bg-gradient-to-b from-violet-500 to-purple-700 text-white hover:brightness-110'
                              : lastRunDifficulty === 'HARDCORE'
                              ? 'border-rose-400/70 bg-rose-600/90 text-white hover:bg-rose-500'
                              : 'border-amber-300/70 bg-amber-400 text-stone-950 hover:brightness-110',
                          ].join(' ')}
                        >
                          <RotateCcw className="h-3 w-3 shrink-0" />
                          <span>{rerunLabel}</span>
                        </button>
                      );
                    })()}
                  </div>

                  {/* Slim Post-Run Retention Strip: Embers, Rank Progress, Record Delta, Active Bounty & Flame */}
                  <div className="mt-1 flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 border-t border-stone-800/85 pt-1 text-[10px] sm:text-[11px] tabular-nums">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {lastRunRetention && (
                        <span className="font-black text-amber-300 shrink-0">
                          +{lastRunRetention.embersEarned} Embers
                        </span>
                      )}
                      <span className="text-stone-600" aria-hidden="true">·</span>
                      <span className={`font-bold truncate ${activeFlame.textAccentClass}`}>
                        R{rankProgress.currentRank.rank}
                        <span className="hidden sm:inline"> {rankProgress.currentRank.title}</span>
                      </span>
                      <div
                        className="h-1.5 w-10 sm:w-16 shrink-0 overflow-hidden rounded-full bg-stone-800"
                        title={
                          rankProgress.nextRank
                            ? `${rankProgress.embersIntoRank}/${rankProgress.embersForNextRank} Embers to Rank ${rankProgress.nextRank.rank}`
                            : 'Max Rank Reached'
                        }
                      >
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${rankProgress.progressPct}%`,
                            backgroundColor: activeFlame.dotColor,
                          }}
                        />
                      </div>
                      {(lastRunRetention?.newBestFloor || lastRunRetention?.newBestMult) ? (
                        <span className="font-black text-emerald-400 whitespace-nowrap">
                          New Best!
                        </span>
                      ) : lastRunRetention?.rankedUpTo ? (
                        <span className="font-black text-violet-300 whitespace-nowrap">
                          Rank Up!
                        </span>
                      ) : lastRunRetention && lastRunRetention.floorDeltaToBest > 0 && lastRunRetention.floorDeltaToBest <= 2 ? (
                        <span className="hidden sm:inline text-stone-400 whitespace-nowrap">
                          {lastRunRetention.floorDeltaToBest}F shy of Best
                        </span>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                      <span className="text-stone-300">
                        <span className="hidden sm:inline text-stone-400">Bounty: </span>
                        <strong>{retention.activeBounty.title}</strong>{' '}
                        <span className="text-cyan-300 font-bold">
                          {retention.activeBounty.progress}/{retention.activeBounty.target}
                        </span>
                      </span>
                      {unlockedFlames.length > 1 && (
                        <>
                          <span className="text-stone-600" aria-hidden="true">·</span>
                          <button
                            type="button"
                            onClick={handleCycleFlame}
                            title="Cycle unlocked Torch Flame cosmetic"
                            className="inline-flex items-center gap-1 font-bold text-stone-200 hover:text-white underline decoration-stone-600 underline-offset-2 cursor-pointer whitespace-nowrap"
                          >
                            <Flame
                              className="h-3 w-3 shrink-0"
                              style={{ color: activeFlame.dotColor }}
                              aria-hidden="true"
                            />
                            <span>{activeFlame.name}</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </section>

            <HeroHud
              hero={hero}
              heroShake={heroShake}
              isLowHp={isLowHp}
              isCriticalHp={isCriticalHp}
              feedbacks={feedbacks}
              activeFlame={activeFlame}
              rankTitle={`R${rankProgress.currentRank.rank} · ${rankProgress.currentRank.title}`}
            />
          </main>

          {/* MONEY AMOUNT SELECTOR & ACTION CONTROLS */}
          <footer className="w-full shrink-0 space-y-1.5 sm:space-y-2 pt-0">
            <div className="rounded-xl border border-stone-700/80 bg-obsidian-900/90 px-2.5 py-1.5 sm:px-3 sm:py-2 shadow">
              <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2.5">
                {/* Custom Editable Bet Input */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-400 hidden sm:inline">
                    Bet
                  </span>
                  <div className="flex items-center rounded-md border border-amber-400/40 bg-obsidian-950 px-2 py-0.5 focus-within:border-amber-400">
                    <span className="text-xs font-bold text-amber-300 mr-1">$</span>
                    <input
                      type="number"
                      aria-label="Custom Bet Amount"
                      step="0.10"
                      min={(minBet / rgsConfig.unitScale).toFixed(2)}
                      max={(maxBetLimit / rgsConfig.unitScale).toFixed(2)}
                      disabled={runPhase === 'PLAYING' || balance < minBet}
                      value={customBetText}
                      onChange={(e) => {
                        const raw = e.target.value;
                        setCustomBetText(raw);
                        const parsed = Number.parseFloat(raw);
                        if (Number.isFinite(parsed) && parsed > 0) {
                          const minor = Math.round(parsed * rgsConfig.unitScale);
                          if (minor >= minBet) {
                            setSelectedBet(Math.min(maxBetLimit, minor));
                          }
                        }
                      }}
                      onBlur={handleCustomBetBlur}
                      className="w-16 bg-transparent text-xs font-black text-amber-300 tabular-nums outline-none disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Full-Balance Range Slider */}
                <div className="flex min-w-[90px] flex-1 items-center">
                  <input
                    type="range"
                    aria-label="Bet Amount Slider"
                    min={minBet}
                    max={maxBetLimit}
                    step={sliderStep}
                    disabled={runPhase === 'PLAYING' || balance < minBet}
                    value={Math.min(maxBetLimit, Math.max(minBet, selectedBet))}
                    onChange={(e) => syncBetAmount(Number(e.target.value))}
                    style={{
                      background: `linear-gradient(to right, #f59e0b 0%, #f59e0b ${sliderPct}%, #27272a ${sliderPct}%, #27272a 100%)`,
                      borderRadius: '9999px',
                      height: '6px',
                    }}
                    className="torch-slider w-full disabled:opacity-45"
                  />
                </div>

                {/* Quick Presets ($1, $5, $10, $50) + 1/2 + 2x + MAX */}
                <div className="flex flex-wrap items-center gap-1 shrink-0">
                  {rgsConfig.betOptions.slice(0, 4).map((betAmt, idx) => {
                    const active = selectedBet === betAmt;
                    const affordable = balance >= betAmt;
                    return (
                      <button
                        key={`${betAmt}-${idx}`}
                        type="button"
                        disabled={runPhase === 'PLAYING' || (!active && !affordable)}
                        onClick={() => {
                          soundEngine.playButtonClick();
                          syncBetAmount(betAmt);
                        }}
                        className={[
                          'inline-flex rounded-md px-2 py-1 text-[11px] font-extrabold transition-colors tabular-nums whitespace-nowrap',
                          active
                            ? 'bg-amber-400 text-stone-950'
                            : 'bg-stone-800/90 text-stone-300 hover:bg-stone-700',
                          runPhase === 'PLAYING' || (!active && !affordable)
                            ? 'cursor-not-allowed opacity-45'
                            : 'cursor-pointer',
                        ].join(' ')}
                      >
                        {formatMoney(betAmt, rgsConfig.currency, rgsConfig.unitScale).replace('.00', '')}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    disabled={runPhase === 'PLAYING' || balance < minBet}
                    onClick={() => {
                      soundEngine.playButtonClick();
                      syncBetAmount(Math.max(minBet, Math.floor(selectedBet / 2)));
                    }}
                    className="rounded-md bg-stone-800/90 px-2 py-1 text-[11px] font-extrabold text-stone-300 hover:bg-stone-700 disabled:opacity-45 cursor-pointer"
                  >
                    1/2
                  </button>

                  <button
                    type="button"
                    disabled={
                      runPhase === 'PLAYING' ||
                      balance < minBet ||
                      selectedBet >= maxBetLimit
                    }
                    onClick={() => {
                      soundEngine.playButtonClick();
                      syncBetAmount(
                        Math.min(maxBetLimit, Math.max(minBet, selectedBet * 2))
                      );
                    }}
                    className="rounded-md bg-stone-800/90 px-2 py-1 text-[11px] font-extrabold text-stone-200 hover:bg-stone-700 disabled:opacity-45 cursor-pointer"
                  >
                    2x
                  </button>

                  <button
                    type="button"
                    disabled={runPhase === 'PLAYING' || balance < minBet}
                    onClick={() => {
                      soundEngine.playButtonClick();
                      syncBetAmount(maxBetLimit);
                    }}
                    className="rounded-md border border-amber-500/40 bg-amber-500/15 px-2 py-1 text-[11px] font-black text-amber-300 hover:bg-amber-500/25 disabled:opacity-45 cursor-pointer"
                  >
                    MAX
                  </button>
                </div>
              </div>

              {/* Compact Auto-Cashout Target + Desktop Hotkey Hint */}
              <div className="mt-1 sm:mt-1.5 flex items-center justify-between gap-2 border-t border-stone-800/80 pt-1 sm:pt-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 whitespace-nowrap">
                    Auto Cash
                  </span>
                  <div className="flex items-center gap-1">
                    {AUTO_CASHOUT_OPTIONS.map((target) => {
                      const active = autoCashoutTarget === target;
                      return (
                        <button
                          key={target === null ? 'off' : target}
                          type="button"
                          onClick={() => {
                            soundEngine.playButtonClick();
                            setAutoCashoutTarget(target);
                          }}
                          className={[
                            'rounded px-1.5 py-0.5 text-[10px] font-black tabular-nums transition-colors cursor-pointer whitespace-nowrap',
                            active
                              ? 'bg-emerald-400 text-stone-950'
                              : 'bg-stone-800/80 text-stone-400 hover:text-stone-200',
                          ].join(' ')}
                        >
                          {target === null ? 'Off' : `${target.toFixed(target % 1 === 0 ? 0 : 1)}x`}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <span className="hidden sm:inline font-mono text-[10px] text-stone-500 whitespace-nowrap">
                  1–4 Pick · Space Start/Cash
                </span>
              </div>
            </div>

            {/* START RUN · BONUS BUY · CASH OUT */}
            <div className="grid grid-cols-[1fr_1fr_1.35fr] sm:grid-cols-3 gap-1.5 sm:gap-3">
              <button
                type="button"
                disabled={
                  runPhase === 'PLAYING' ||
                  authLoading ||
                  Boolean(authError) ||
                  balance < selectedBet
                }
                onClick={handleOpenStartDifficulty}
                className={[
                  'flex min-h-[44px] sm:min-h-[50px] items-center justify-center gap-1.5 rounded-xl border-2 px-2.5 sm:px-4 py-1.5 sm:py-2 font-black transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400',
                  runPhase === 'PLAYING' ||
                  balance < selectedBet ||
                  authLoading ||
                  Boolean(authError)
                    ? 'cursor-not-allowed border-stone-800 bg-stone-900/70 text-stone-500'
                    : 'cursor-pointer border-amber-300/70 bg-gradient-to-b from-orange-500 to-amber-600 text-stone-950 shadow-torch hover:brightness-110 active:scale-95',
                ].join(' ')}
              >
                {runPhase === 'CASHED_OUT' || runPhase === 'DEFEAT' ? (
                  <RotateCcw className="h-4 w-4 sm:h-4.5 sm:w-4.5 shrink-0" />
                ) : (
                  <Play className="h-4 w-4 sm:h-4.5 sm:w-4.5 shrink-0 fill-current" />
                )}
                <span className="text-xs sm:text-sm uppercase tracking-wide whitespace-nowrap">
                  START RUN
                </span>
              </button>

              <button
                type="button"
                disabled={
                  runPhase === 'PLAYING' ||
                  authLoading ||
                  Boolean(authError) ||
                  balance < selectedBet * 2
                }
                onClick={() => {
                  soundEngine.playButtonClick();
                  setBonusBuyOpen(true);
                }}
                className={[
                  'flex min-h-[44px] sm:min-h-[50px] items-center justify-center gap-1.5 rounded-xl border-2 px-2.5 sm:px-4 py-1.5 sm:py-2 font-black transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400',
                  runPhase === 'PLAYING' ||
                  balance < selectedBet * 2 ||
                  authLoading ||
                  Boolean(authError)
                    ? 'cursor-not-allowed border-stone-800 bg-stone-900/70 text-stone-500'
                    : 'cursor-pointer border-violet-400/75 bg-gradient-to-b from-violet-600 to-purple-800 text-amber-100 shadow-[0_0_20px_-4px_rgba(139,92,246,0.55)] hover:brightness-110 active:scale-95',
                ].join(' ')}
              >
                <Crown className="h-4 w-4 sm:h-4.5 sm:w-4.5 shrink-0 text-amber-300" />
                <span className="text-xs sm:text-sm uppercase tracking-wide whitespace-nowrap">
                  BONUS BUY
                </span>
              </button>

              <button
                type="button"
                disabled={!canCashOut}
                onClick={() => void handleCashOut()}
                title={
                  runPhase === 'PLAYING' && floorsCleared < 1
                    ? 'Clear 3 cards to pass this floor and unlock Cash Out'
                    : 'Cash Out banked winnings'
                }
                className={[
                  'flex min-h-[44px] sm:min-h-[50px] items-center justify-center gap-1.5 rounded-xl border-2 px-2.5 sm:px-4 py-1.5 sm:py-2 font-black transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400',
                  canCashOut
                    ? 'cursor-pointer border-emerald-300/75 bg-gradient-to-b from-emerald-400 to-emerald-600 text-stone-950 shadow-emerald-glow hover:brightness-110 active:scale-95'
                    : 'cursor-not-allowed border-stone-800 bg-stone-900/70 text-stone-500',
                ].join(' ')}
              >
                {runPhase === 'PLAYING' && floorsCleared < 1 ? (
                  <Lock className="h-4 w-4 shrink-0 text-stone-500" />
                ) : (
                  <BadgeDollarSign className="h-4 w-4 sm:h-4.5 sm:w-4.5 shrink-0" />
                )}
                <span className="text-xs sm:text-sm uppercase tracking-wide whitespace-nowrap tabular-nums">
                  {runPhase === 'PLAYING'
                    ? floorsCleared < 1
                      ? `LOCKED · F${floor}`
                      : `CASH ${formatMoney(
                          potentialPayout,
                          rgsConfig.currency,
                          rgsConfig.unitScale
                        )}`
                    : 'CASH OUT'}
                </span>
              </button>
            </div>
          </footer>
          </div>
        </div>
      )}

      <MenuModal
        open={menuOpen}
        onClose={() => {
          soundEngine.playButtonClick();
          setMenuOpen(false);
        }}
        stats={stats}
        muted={muted}
        musicPlaying={musicPlaying}
        volume={volume}
        isPlayingRun={runPhase === 'PLAYING'}
        onToggleMute={handleToggleMute}
        onToggleMusic={handleToggleMusic}
        onVolumeChange={handleVolumeChange}
        onOpenBonusBuy={() => setBonusBuyOpen(true)}
        onOpenRules={() => setRulesOpen(true)}
        onReturnToTitle={() => {
          soundEngine.playButtonClick();
          setMenuOpen(false);
          setScreenMode('TITLE');
        }}
      />

      <BonusBuyModal
        open={bonusBuyOpen}
        onClose={() => {
          soundEngine.playButtonClick();
          setBonusBuyOpen(false);
        }}
        baseBet={selectedBet}
        balance={balance}
        rgsConfig={rgsConfig}
        onSelectBonusBuy={handleStartBonusBuy}
      />

      <BossForgeModal
        open={bossForgeOpen}
        floor={floor}
        hero={hero}
        onUpgradeWeapon={() => handleBossForgeUpgrade('WEAPON')}
        onUpgradeShield={() => handleBossForgeUpgrade('SHIELD')}
        onContinue={() => {
          soundEngine.playCardFlip();
          if (isHordeMode) {
            hordeTimeRef.current = HORDE_PICK_LIMIT_MS;
            setHordeTimeLeftMs(HORDE_PICK_LIMIT_MS);
          }
          setBossForgeOpen(false);
        }}
      />

      <DifficultyModal
        open={difficultyModalOpen}
        betLabel={formatMoney(selectedBet, rgsConfig.currency, rgsConfig.unitScale)}
        onSelectMode={handleStartRun}
        onClose={() => {
          soundEngine.playButtonClick();
          setDifficultyModalOpen(false);
        }}
      />

      <RulesModal
        open={rulesOpen}
        onClose={() => {
          soundEngine.playButtonClick();
          setRulesOpen(false);
        }}
      />
    </div>
  );
}
