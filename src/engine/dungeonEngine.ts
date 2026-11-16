import {
  BonusBuyOption,
  BonusVariant,
  BossVariant,
  CardType,
  CombatPreview,
  DifficultyMode,
  DungeonCardData,
  GearSalvagePreview,
  GoldVariant,
  HeroState,
  MonsterVariant,
  PotionVariant,
  RgsVolatility,
  RgsVolatilityProfile,
  RoomMode,
  RoomTwist,
  ShieldVariant,
  SpellVariant,
  WeaponVariant,
} from '../types/game';

export const HERO_MAX_HP = 13;
export const HARDCORE_MAX_HP = 10;
export const HARDCORE_ENEMY_POWER_BONUS = 2;
export const HARDCORE_MULT_BOOST = 1.35;
export const STANDARD_STARTING_MULT = 0.64;
export const HARDCORE_STARTING_MULT = 0.7;
export const DEFAULT_HOUSE_EDGE = 0.04; // 4% built-in Stake house edge (96% RTP)
export const HOUSE_EDGE_RTP = 1 - DEFAULT_HOUSE_EDGE;
export const MAX_SINGLE_HIT_DAMAGE_STANDARD = 10;
export const MAX_SINGLE_HIT_DAMAGE_HARDCORE = 12;
export const SALVAGE_GOLD_BONUS = 2;
export const BOSS_FORGE_GOLD_COST = 6;
export const BOSS_FORGE_UPGRADE_AMOUNT = 3;
export const STARTING_SCOUT_CHARGES = 1;
export const MAX_SCOUT_CHARGES = 2;
export const HORDE_PICK_LIMIT_MS = 6500;
export const HORDE_FAST_PICK_THRESHOLD_MS = 2500;
export const HORDE_SPEED_BASE_BONUS = 0.11;
export const SHROUDED_FATE_BONUS = 0.07;

export const ROOM_TWIST_META: Record<
  RoomTwist,
  { label: string; shortTag: string; badgeClass: string; desc: string }
> = {
  CALM: {
    label: 'Crypt',
    shortTag: '',
    badgeClass: '',
    desc: 'Standard dungeon room with mixed threats and veiled unknowns.',
  },
  AMBUSH: {
    label: 'Ambush',
    shortTag: 'Ambush',
    badgeClass: 'border-rose-400/60 bg-rose-500/20 text-rose-200',
    desc: '3–4 monsters swarm this room (+20% kill mult).',
  },
  CURSED_MIST: {
    label: 'Cursed Mist',
    shortTag: 'Mist · ?',
    badgeClass: 'border-violet-400/60 bg-violet-500/20 text-violet-200',
    desc: '2–3 cards are veiled (?) — blind picks award +Fate bonus.',
  },
  BLOOD_MOON: {
    label: 'Blood Moon',
    shortTag: 'Blood Moon',
    badgeClass: 'border-red-400/70 bg-red-500/25 text-red-200',
    desc: 'Foes hit harder (+1–2 Pwr), kills grant +25% mult.',
  },
  TREASURE_VAULT: {
    label: 'Hidden Vault',
    shortTag: 'Vault',
    badgeClass: 'border-amber-400/65 bg-amber-500/20 text-amber-200',
    desc: 'Extra gold & relic odds guarded by enraged foes.',
  },
};

export const RGS_VOLATILITY_PROFILES: Record<RgsVolatility, RgsVolatilityProfile> = {
  LOW: {
    id: 'LOW',
    label: 'Low Volatility',
    subtitle: 'Steadier survival, frequent 1.2x–2.2x wins, fewer veiled traps',
    houseEdge: DEFAULT_HOUSE_EDGE,
    damageScale: 0.91,
    rewardScale: 0.56,
    lootWeightDelta: 3,
    enragedChanceBonus: -0.04,
    jackpotChance: 0.035,
    jackpotMaxMult: 0.65,
    hpOffset: 1,
  },
  MEDIUM: {
    id: 'MEDIUM',
    label: 'Medium Volatility',
    subtitle: 'True Stake casino RNG — unpredictable rooms & real 2x–8x+ runs',
    houseEdge: DEFAULT_HOUSE_EDGE,
    damageScale: 1.0,
    rewardScale: 0.79,
    lootWeightDelta: -1,
    enragedChanceBonus: 0.01,
    jackpotChance: 0.08,
    jackpotMaxMult: 1.85,
    hpOffset: 0,
  },
  HIGH: {
    id: 'HIGH',
    label: 'High Volatility',
    subtitle: 'Deadly ambushes & blind gambles, slim shot at 6x–25x+ jackpots',
    houseEdge: DEFAULT_HOUSE_EDGE,
    damageScale: 1.08,
    rewardScale: 0.95,
    lootWeightDelta: -3,
    enragedChanceBonus: 0.09,
    jackpotChance: 0.14,
    jackpotMaxMult: 3.4,
    hpOffset: -1,
  },
};

export function getVolatilityProfile(
  volatility: RgsVolatility = 'MEDIUM',
  houseEdgeOverride?: number
): RgsVolatilityProfile {
  const base = RGS_VOLATILITY_PROFILES[volatility] ?? RGS_VOLATILITY_PROFILES.MEDIUM;
  if (
    typeof houseEdgeOverride === 'number' &&
    Number.isFinite(houseEdgeOverride) &&
    houseEdgeOverride >= 0.01 &&
    houseEdgeOverride <= 0.15
  ) {
    return { ...base, houseEdge: houseEdgeOverride };
  }
  return base;
}

function secureRandom(): number {
  const cryptoObj = globalThis.crypto;
  if (cryptoObj && typeof cryptoObj.getRandomValues === 'function') {
    const arr = new Uint32Array(1);
    cryptoObj.getRandomValues(arr);
    return arr[0] / 4294967296;
  }
  return Math.random();
}

export function getStartingMaxHp(
  difficulty: DifficultyMode,
  volatility: RgsVolatility = 'MEDIUM'
): number {
  const base = difficulty === 'HARDCORE' ? HARDCORE_MAX_HP : HERO_MAX_HP;
  const profile = getVolatilityProfile(volatility);
  return Math.max(7, base + profile.hpOffset);
}

export function getStartingMultiplier(
  difficulty: DifficultyMode,
  volatility: RgsVolatility = 'MEDIUM',
  houseEdgeOverride?: number
): number {
  const profile = getVolatilityProfile(volatility, houseEdgeOverride);
  const rtpFactor = (1 - profile.houseEdge) / HOUSE_EDGE_RTP;
  const base =
    difficulty === 'HARDCORE' ? HARDCORE_STARTING_MULT : STANDARD_STARTING_MULT;
  const volShift = volatility === 'LOW' ? 0.02 : volatility === 'HIGH' ? -0.08 : 0;
  return Number(Math.max(0.5, (base + volShift) * rtpFactor).toFixed(2));
}

export function getMaxEnemyPower(difficulty: DifficultyMode): number {
  return difficulty === 'HARDCORE' ? 20 : 18;
}

export function getMaxSingleHitDamage(
  difficulty: DifficultyMode,
  volatility: RgsVolatility = 'MEDIUM'
): number {
  const profile = getVolatilityProfile(volatility);
  const base =
    difficulty === 'HARDCORE'
      ? MAX_SINGLE_HIT_DAMAGE_HARDCORE
      : MAX_SINGLE_HIT_DAMAGE_STANDARD;
  return Math.max(7, Math.round(base * profile.damageScale));
}

export function getStarterWeapon(difficulty: DifficultyMode) {
  const power = difficulty === 'HARDCORE' ? 2 : 3;
  return {
    name: 'Pine Torch',
    power,
    maxPower: power,
    variant: 'torch' as WeaponVariant,
  };
}

export function getFloorMultiplierScale(floor: number): number {
  if (floor >= 11) {
    return Math.min(2.5, 1.58 + (floor - 10) * 0.08);
  }
  if (floor >= 5) {
    return 1.22 + (floor - 5) * 0.07;
  }
  if (floor >= 3) {
    return 1.06 + (floor - 3) * 0.06;
  }
  if (floor === 2) return 1.02;
  return 0.94;
}

export function scaleMultiplierGain(
  baseGain: number,
  difficulty: DifficultyMode,
  multBoost = 1,
  floor = 1,
  volatility: RgsVolatility = 'MEDIUM',
  houseEdgeOverride?: number
): number {
  const profile = getVolatilityProfile(volatility, houseEdgeOverride);
  const modeBoost = difficulty === 'HARDCORE' ? HARDCORE_MULT_BOOST : 1;
  const floorScale = getFloorMultiplierScale(floor);
  const rtpScale = 1 - profile.houseEdge;
  const scaled =
    baseGain * modeBoost * multBoost * floorScale * profile.rewardScale * rtpScale;
  return Math.round(scaled * 100) / 100;
}

export function getFloorCompoundFactor(
  clearedDepth: number,
  volatility: RgsVolatility = 'MEDIUM',
  houseEdgeOverride?: number,
  difficulty: DifficultyMode = 'STANDARD'
): number {
  const profile = getVolatilityProfile(volatility, houseEdgeOverride);
  const rtpScale = (1 - profile.houseEdge) / HOUSE_EDGE_RTP;
  const hcBoost =
    difficulty === 'HARDCORE' ? (clearedDepth === 1 ? 0.06 : 0.18) : 0;

  if (volatility === 'LOW') {
    const baseRate =
      clearedDepth >= 5
        ? 0.32
        : clearedDepth === 4
        ? 0.3
        : clearedDepth === 3
        ? 0.24
        : clearedDepth === 2
        ? 0.16
        : 0.11;
    return 1 + Number(((baseRate + hcBoost * 0.85) * rtpScale).toFixed(3));
  }
  if (volatility === 'HIGH') {
    const baseRate =
      clearedDepth >= 5
        ? 1.55
        : clearedDepth === 4
        ? 1.5
        : clearedDepth === 3
        ? 1.15
        : clearedDepth === 2
        ? 0.52
        : 0.2;
    return 1 + Number(((baseRate + hcBoost * 1.4) * rtpScale).toFixed(3));
  }
  // MEDIUM
  const baseRate =
    clearedDepth >= 5
      ? 0.9
      : clearedDepth === 4
      ? 0.88
      : clearedDepth === 3
      ? 0.62
      : clearedDepth === 2
      ? 0.32
      : 0.16;
  return 1 + Number(((baseRate + hcBoost) * rtpScale).toFixed(3));
}

export function getGearSalvagePreview(
  card: DungeonCardData,
  hero: HeroState
): GearSalvagePreview {
  if (card.type === 'WEAPON' && hero.weapon && hero.weapon.power >= card.value) {
    return {
      isSalvage: true,
      temperAmount: 1,
      goldGain: SALVAGE_GOLD_BONUS,
    };
  }
  if (card.type === 'SHIELD' && hero.shield && hero.shield.armor >= card.value) {
    return {
      isSalvage: true,
      temperAmount: 1,
      goldGain: SALVAGE_GOLD_BONUS,
    };
  }
  return {
    isSalvage: false,
    temperAmount: 0,
    goldGain: 0,
  };
}

export const BONUS_BUY_OPTIONS: BonusBuyOption[] = [
  {
    id: 'armory',
    name: 'Armory Forge',
    subtitle: 'Enter Floor 3 armed with steel & volatile loot',
    costMultiplier: 2,
    startingMultiplier: 1.32,
    startingFloor: 3,
    multBoost: 1.12,
    weapon: { name: 'Ember Edge', power: 4, maxPower: 4, variant: 'emberblade' },
    shield: { name: 'Oak Buckler', armor: 3, maxArmor: 3, variant: 'buckler' },
    perks: ['4 Power + 3 Armor', '1.12x Mult Speed', '1.32x Start Mult (F3)'],
    accent: 'orange',
  },
  {
    id: 'relic_vault',
    name: 'Relic Vault',
    subtitle: 'High-stakes Floor 4 entry with elite relic drop',
    costMultiplier: 4,
    startingMultiplier: 2.8,
    startingFloor: 4,
    multBoost: 1.24,
    weapon: { name: 'Hellfire Axe', power: 6, maxPower: 6, variant: 'halberd' },
    shield: { name: 'Oak Buckler', armor: 4, maxArmor: 4, variant: 'buckler' },
    perks: ['6 Power + 4 Armor', '1.24x Mult Speed + Relic', '2.80x Start Mult (F4)'],
    accent: 'violet',
  },
  {
    id: 'dragons_wrath',
    name: "Dragon's Wrath",
    subtitle: 'Boss Floor 5 showdown — huge upside, deadly risk',
    costMultiplier: 5,
    startingMultiplier: 3.3,
    startingFloor: 5,
    multBoost: 1.38,
    weapon: { name: 'Hellfire Axe', power: 6, maxPower: 6, variant: 'halberd' },
    shield: { name: 'Oak Buckler', armor: 3, maxArmor: 3, variant: 'buckler' },
    perks: ['6 Power + 3 Armor', '1.38x Mult Speed · Boss F5', '3.30x Start Mult (F5)'],
    accent: 'amber',
  },
  {
    id: 'horde_escape',
    name: 'Horde Escape',
    subtitle: 'Outrun the horde — 6.5s pick & 2× unblocked dmg',
    costMultiplier: 3,
    startingMultiplier: 2.05,
    startingFloor: 3,
    multBoost: 1.34,
    weapon: { name: 'Shadow Fang', power: 6, maxPower: 6, variant: 'emberblade' },
    shield: { name: 'Swift Buckler', armor: 4, maxArmor: 4, variant: 'buckler' },
    perks: ['6 Power + 4 Armor', '1.34x Mult + <2.5s Reflex', '2.05x Start · 2× Unblocked Dmg'],
    accent: 'crimson',
    speedMode: true,
  },
];

const globalScope = globalThis as typeof globalThis & { __torchCardUid?: number };
function nextCardId(): string {
  const nextSeq = (globalScope.__torchCardUid ?? 0) + 1;
  globalScope.__torchCardUid = nextSeq;
  return `card-${nextSeq}-${Date.now().toString(36)}`;
}

function randomInt(min: number, max: number): number {
  return Math.floor(secureRandom() * (max - min + 1)) + min;
}

function shuffleCards(cards: DungeonCardData[]): DungeonCardData[] {
  const arr = [...cards];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(secureRandom() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.map((card, idx) => ({
    ...card,
    dealDelayMs: card.carriedOver ? 0 : idx * 55,
  }));
}

export function rollRoomTwist(
  floor: number,
  volatility: RgsVolatility = 'MEDIUM'
): RoomTwist {
  const roll = secureRandom();
  const chaosShift =
    volatility === 'HIGH' ? 0.08 : volatility === 'LOW' ? -0.08 : 0;
  const depthShift = Math.min(0.12, Math.max(0, floor - 1) * 0.02);
  const calmThreshold = Math.max(0.32, 0.52 - chaosShift - depthShift);

  if (roll < calmThreshold) return 'CALM';
  const rem = (roll - calmThreshold) / Math.max(0.01, 1 - calmThreshold);
  if (rem < 0.28) return 'AMBUSH';
  if (rem < 0.58) return 'CURSED_MIST';
  if (rem < 0.78) return 'BLOOD_MOON';
  return 'TREASURE_VAULT';
}

function pickWeightedType(
  existingTypes: CardType[],
  floor: number,
  volatility: RgsVolatility = 'MEDIUM',
  roomTwist: RoomTwist = 'CALM'
): CardType {
  const profile = getVolatilityProfile(volatility);
  const monsterCount = existingTypes.filter((t) => t === 'MONSTER').length;
  const bonusWeight =
    roomTwist === 'TREASURE_VAULT' ? 12 : floor >= 2 ? 6 : 4;
  const lootAdjust = profile.lootWeightDelta;
  const ambushExtra =
    roomTwist === 'AMBUSH' ? 12 : roomTwist === 'BLOOD_MOON' ? 6 : 0;

  const weights: Array<{ type: CardType; weight: number }> = [
    {
      type: 'MONSTER',
      weight: Math.max(
        22,
        (monsterCount >= 3 ? 24 : 49 + Math.min(20, floor * 1.9) + ambushExtra) -
          lootAdjust * 0.55
      ),
    },
    {
      type: 'WEAPON',
      weight: Math.max(
        8,
        (roomTwist === 'AMBUSH' ? 11 : 13) + Math.round(lootAdjust * 0.25)
      ),
    },
    {
      type: 'SHIELD',
      weight: Math.max(
        8,
        (roomTwist === 'AMBUSH' ? 11 : 13) + Math.round(lootAdjust * 0.25)
      ),
    },
    {
      type: 'POTION',
      weight: Math.max(
        5,
        (roomTwist === 'BLOOD_MOON' ? 6 : 9) + Math.round(lootAdjust * 0.35)
      ),
    },
    { type: 'GOLD', weight: roomTwist === 'TREASURE_VAULT' ? 16 : 9 },
    { type: 'SPELL', weight: 5 },
    { type: 'BONUS', weight: existingTypes.includes('BONUS') ? 1 : bonusWeight },
  ];

  const total = weights.reduce((sum, item) => sum + item.weight, 0);
  let roll = secureRandom() * total;
  for (const item of weights) {
    roll -= item.weight;
    if (roll <= 0) return item.type;
  }
  return 'MONSTER';
}

function createMonsterCard(
  floor: number,
  dealDelayMs: number,
  difficulty: DifficultyMode = 'STANDARD',
  volatility: RgsVolatility = 'MEDIUM',
  roomTwist: RoomTwist = 'CALM'
): DungeonCardData {
  const profile = getVolatilityProfile(volatility);
  const maxEnemyPower = getMaxEnemyPower(difficulty);
  const tierBoost = Math.min(12, Math.floor((floor - 1) * 0.95));
  const rawMin = 3 + Math.floor((floor - 1) * 0.45);
  const rawMax = Math.min(maxEnemyPower, 5 + tierBoost);
  const minRoll = Math.min(rawMax, Math.max(3, rawMin));

  const twistEnragedBonus =
    roomTwist === 'AMBUSH' || roomTwist === 'BLOOD_MOON' ? 0.1 : 0;
  const enragedChance = Math.max(
    0.06,
    Math.min(
      0.45,
      0.14 + (floor - 1) * 0.022 + profile.enragedChanceBonus + twistEnragedBonus
    )
  );
  const isEnragedSpawn = secureRandom() < enragedChance;
  const ambushBoost = isEnragedSpawn ? randomInt(1, 2) : 0;
  const bloodMoonBoost =
    roomTwist === 'BLOOD_MOON' ? 1 : 0;
  const surpriseSpike = secureRandom() < 0.08 ? 1 : 0;

  const rawPower =
    randomInt(minRoll, rawMax) + ambushBoost + bloodMoonBoost + surpriseSpike;
  const volScaled = Math.max(3, Math.round(rawPower * profile.damageScale));
  const power = Math.min(
    maxEnemyPower,
    volScaled + (difficulty === 'HARDCORE' ? HARDCORE_ENEMY_POWER_BONUS : 0)
  );

  let name = 'Skeleton';
  let variant: MonsterVariant = 'skeleton';

  if (power >= 15) {
    name = 'Ember Wyrm';
    variant = 'dragon';
  } else if (power >= 12) {
    name = 'Abyssal Fiend';
    variant = 'demon';
  } else if (power >= 9) {
    name = 'Obsidian Golem';
    variant = 'golem';
  } else if (power >= 7) {
    name = 'Crypt Cultist';
    variant = 'cultist';
  } else if (power >= 5) {
    name = 'Bone Hound';
    variant = 'hound';
  }

  return {
    id: nextCardId(),
    type: 'MONSTER',
    name,
    value: power,
    variant,
    enraged: isEnragedSpawn || roomTwist === 'BLOOD_MOON',
    cleared: false,
    dealDelayMs,
  };
}

function createBossCard(
  floor: number,
  dealDelayMs: number,
  difficulty: DifficultyMode = 'STANDARD',
  multBoost = 1,
  volatility: RgsVolatility = 'MEDIUM',
  houseEdgeOverride?: number
): DungeonCardData {
  const profile = getVolatilityProfile(volatility, houseEdgeOverride);
  const maxEnemyPower = getMaxEnemyPower(difficulty);
  const rawBossPower = 8 + Math.floor(floor * 0.45) + randomInt(0, 3);
  const scaledBossPower = Math.max(7, Math.round(rawBossPower * profile.damageScale));
  const power = Math.min(
    maxEnemyPower,
    scaledBossPower + (difficulty === 'HARDCORE' ? HARDCORE_ENEMY_POWER_BONUS : 0)
  );

  const isCritBoss = secureRandom() < profile.jackpotChance;
  const surgeExtra = isCritBoss ? profile.jackpotMaxMult * 0.45 : 0;
  const baseRewardMult = Number(
    (Math.min(1.0, 0.36 + Math.floor(floor / 5) * 0.12) + surgeExtra).toFixed(2)
  );
  const rewardMult = scaleMultiplierGain(
    baseRewardMult,
    difficulty,
    multBoost,
    floor,
    volatility,
    houseEdgeOverride
  );

  let name = 'Crypt Warden';
  let variant: BossVariant = 'crypt_warden';

  if (floor >= 20) {
    name = 'Inferno Dragon';
    variant = 'inferno_wyrm';
  } else if (floor >= 15) {
    name = 'Abyssal Sovereign';
    variant = 'abyssal_sovereign';
  } else if (floor >= 10) {
    name = 'Sanctum Bloodlord';
    variant = 'blood_lord';
  }

  return {
    id: nextCardId(),
    type: 'BOSS',
    name,
    value: power,
    variant,
    cleared: false,
    dealDelayMs,
    rewardMult,
    critSurge: isCritBoss,
    subtitle: isCritBoss
      ? `Jackpot Boss · +${rewardMult.toFixed(2)}x`
      : `Boss · +${rewardMult.toFixed(2)}x`,
  };
}

function createWeaponCard(floor: number, dealDelayMs: number): DungeonCardData {
  const bonus = Math.min(3, Math.floor((floor - 1) / 3));
  const roll = secureRandom();
  const power =
    roll < 0.56
      ? randomInt(2, 4 + Math.min(1, bonus))
      : roll < 0.89
      ? randomInt(4, 6 + Math.min(1, bonus))
      : randomInt(6 + bonus, 8 + bonus);

  let name = 'Pine Torch';
  let variant: WeaponVariant = 'torch';

  if (power >= 9) {
    name = 'Sunfire Blade';
    variant = 'greatsword';
  } else if (power >= 7) {
    name = 'Hellfire Axe';
    variant = 'halberd';
  } else if (power >= 5) {
    name = 'Ember Edge';
    variant = 'emberblade';
  }

  return {
    id: nextCardId(),
    type: 'WEAPON',
    name,
    value: power,
    variant,
    cleared: false,
    dealDelayMs,
  };
}

function createShieldCard(floor: number, dealDelayMs: number): DungeonCardData {
  const bonus = Math.min(3, Math.floor((floor - 1) / 3));
  const roll = secureRandom();
  const armor =
    roll < 0.56
      ? randomInt(2, 4 + Math.min(1, bonus))
      : roll < 0.89
      ? randomInt(4, 6 + Math.min(1, bonus))
      : randomInt(6 + bonus, 8 + bonus);

  let name = 'Oak Buckler';
  let variant: ShieldVariant = 'buckler';

  if (armor >= 9) {
    name = 'Aegis of Ash';
    variant = 'aegis';
  } else if (armor >= 7) {
    name = 'Tower Shield';
    variant = 'tower';
  } else if (armor >= 5) {
    name = 'Iron Kite';
    variant = 'kite';
  }

  return {
    id: nextCardId(),
    type: 'SHIELD',
    name,
    value: armor,
    variant,
    cleared: false,
    dealDelayMs,
  };
}

function createPotionCard(dealDelayMs: number): DungeonCardData {
  const roll = secureRandom();
  const heal = roll < 0.65 ? randomInt(1, 3) : roll < 0.92 ? randomInt(3, 4) : 5;
  let name = 'Crimson Vial';
  let variant: PotionVariant = 'crimson';

  if (heal >= 5) {
    name = 'Phoenix Elixir';
    variant = 'phoenix';
  } else if (heal >= 4) {
    name = 'Ruby Flask';
    variant = 'elixir';
  }

  return {
    id: nextCardId(),
    type: 'POTION',
    name,
    value: heal,
    variant,
    cleared: false,
    dealDelayMs,
  };
}

function createGoldCard(floor: number, dealDelayMs: number): DungeonCardData {
  const roll = secureRandom();
  const cap = 7 + Math.min(4, floor);
  const gold =
    roll < 0.55
      ? randomInt(1, 4)
      : roll < 0.88
      ? randomInt(4, 6 + Math.min(2, floor))
      : randomInt(7, cap);
  let name = 'Gold Chest';
  let variant: GoldVariant = 'chest';

  if (gold >= 8) {
    name = 'Royal Hoard';
    variant = 'crown';
  } else if (gold <= 4) {
    name = 'Gold Coins';
    variant = 'coins';
  }

  return {
    id: nextCardId(),
    type: 'GOLD',
    name,
    value: gold,
    variant,
    cleared: false,
    dealDelayMs,
  };
}

function createSpellCard(dealDelayMs: number): DungeonCardData {
  const power = randomInt(2, 6);
  const variants: SpellVariant[] = ['fireball', 'sunburst', 'ward'];
  const variant = variants[randomInt(0, variants.length - 1)];
  return {
    id: nextCardId(),
    type: 'SPELL',
    name: 'Ember Spell',
    value: power,
    variant,
    cleared: false,
    dealDelayMs,
  };
}

function createBonusCard(
  floor: number,
  dealDelayMs: number,
  volatility: RgsVolatility = 'MEDIUM'
): DungeonCardData {
  const profile = getVolatilityProfile(volatility);
  const isJackpotDrop = secureRandom() < profile.jackpotChance;
  const minPct = Math.min(18, 6 + floor);
  const maxPct = Math.min(40, 14 + floor * 2.5);
  const rawBoost = randomInt(minPct, Math.round(maxPct));
  const jackpotPct = isJackpotDrop
    ? Math.round(profile.jackpotMaxMult * 100 * (0.5 + secureRandom() * 0.5))
    : 0;
  const boostPercent = rawBoost + jackpotPct;

  const variants: BonusVariant[] = ['chalice', 'crown', 'relic'];
  const variant = variants[randomInt(0, variants.length - 1)];
  const name = isJackpotDrop
    ? 'Mythic Vault'
    : variant === 'chalice'
    ? 'Sun Chalice'
    : variant === 'crown'
    ? 'Vault Crown'
    : 'Ember Relic';

  return {
    id: nextCardId(),
    type: 'BONUS',
    name,
    value: boostPercent,
    variant: isJackpotDrop ? 'crown' : variant,
    critSurge: isJackpotDrop,
    cleared: false,
    dealDelayMs,
  };
}

export function generateCard(
  floor: number,
  existingTypes: CardType[],
  dealDelayMs = 0,
  difficulty: DifficultyMode = 'STANDARD',
  multBoost = 1,
  volatility: RgsVolatility = 'MEDIUM',
  houseEdgeOverride?: number,
  roomTwist: RoomTwist = 'CALM'
): DungeonCardData {
  const type = pickWeightedType(existingTypes, floor, volatility, roomTwist);
  switch (type) {
    case 'MONSTER':
      return createMonsterCard(
        floor,
        dealDelayMs,
        difficulty,
        volatility,
        roomTwist
      );
    case 'BOSS':
      return createBossCard(
        floor,
        dealDelayMs,
        difficulty,
        multBoost,
        volatility,
        houseEdgeOverride
      );
    case 'WEAPON':
      return createWeaponCard(floor, dealDelayMs);
    case 'SHIELD':
      return createShieldCard(floor, dealDelayMs);
    case 'POTION':
      return createPotionCard(dealDelayMs);
    case 'GOLD':
      return createGoldCard(floor, dealDelayMs);
    case 'SPELL':
      return createSpellCard(dealDelayMs);
    case 'BONUS':
      return createBonusCard(floor, dealDelayMs, volatility);
    default:
      return createMonsterCard(
        floor,
        dealDelayMs,
        difficulty,
        volatility,
        roomTwist
      );
  }
}

function applyShroudedMystery(
  cards: DungeonCardData[],
  floor: number,
  volatility: RgsVolatility = 'MEDIUM',
  roomTwist: RoomTwist = 'CALM'
): DungeonCardData[] {
  const eligibleIndexes = cards
    .map((c, idx) =>
      !c.cleared && c.type !== 'BOSS' && c.type !== 'EXIT' && !c.carriedOver
        ? idx
        : -1
    )
    .filter((idx) => idx >= 0);

  if (eligibleIndexes.length === 0) return cards;

  let targetShrouded = 0;
  if (roomTwist === 'CURSED_MIST') {
    targetShrouded = Math.min(eligibleIndexes.length, randomInt(2, 3));
  } else if (roomTwist === 'TREASURE_VAULT') {
    targetShrouded = Math.min(eligibleIndexes.length, randomInt(1, 2));
  } else {
    const roll = secureRandom();
    const chance1 =
      volatility === 'HIGH' ? 0.62 : volatility === 'LOW' ? 0.3 : 0.46;
    const chance2 =
      floor >= 2
        ? volatility === 'HIGH'
          ? 0.28
          : volatility === 'LOW'
          ? 0.08
          : 0.18
        : 0;
    if (roll < chance2) targetShrouded = 2;
    else if (roll < chance1) targetShrouded = 1;
  }

  if (targetShrouded <= 0) return cards;

  const picked = new Set<number>();
  const pool = [...eligibleIndexes];
  while (picked.size < targetShrouded && pool.length > 0) {
    const pickPos = randomInt(0, pool.length - 1);
    picked.add(pool[pickPos]);
    pool.splice(pickPos, 1);
  }

  return cards.map((card, idx) =>
    picked.has(idx) ? { ...card, shrouded: true } : card
  );
}

function enforceMonsterPresence(
  cards: DungeonCardData[],
  floor: number,
  difficulty: DifficultyMode = 'STANDARD',
  volatility: RgsVolatility = 'MEDIUM',
  roomTwist: RoomTwist = 'CALM'
): DungeonCardData[] {
  const countRoll = secureRandom();
  const ambushShift =
    (volatility === 'HIGH' ? 0.07 : volatility === 'LOW' ? -0.04 : 0) +
    (roomTwist === 'AMBUSH' ? 0.28 : roomTwist === 'BLOOD_MOON' ? 0.12 : 0);

  const minMonsters =
    roomTwist === 'AMBUSH'
      ? countRoll < 0.68
        ? 3
        : 4
      : countRoll < Math.max(0.04, 0.09 - ambushShift)
      ? 1
      : countRoll < Math.max(0.2, 0.46 - ambushShift)
      ? 2
      : countRoll < Math.max(0.52, 0.85 - ambushShift * 0.5)
      ? 3
      : 4;

  const result = [...cards];
  let monsterCount = result.filter(
    (c) => c.type === 'MONSTER' || c.type === 'BOSS'
  ).length;

  let attempts = 0;
  while (monsterCount < minMonsters && attempts < 14) {
    attempts += 1;
    const candidateIdx = randomInt(0, result.length - 1);
    if (
      !result[candidateIdx].carriedOver &&
      result[candidateIdx].type !== 'MONSTER' &&
      result[candidateIdx].type !== 'BOSS'
    ) {
      result[candidateIdx] = createMonsterCard(
        floor,
        candidateIdx * 55,
        difficulty,
        volatility,
        roomTwist
      );
      monsterCount += 1;
    }
  }

  return applyShroudedMystery(
    shuffleCards(result),
    floor,
    volatility,
    roomTwist
  );
}

export function dealFreshRoom(
  floor: number,
  difficulty: DifficultyMode = 'STANDARD',
  multBoost = 1,
  volatility: RgsVolatility = 'MEDIUM',
  houseEdgeOverride?: number,
  roomTwist: RoomTwist = 'CALM'
): DungeonCardData[] {
  if (floor > 0 && floor % 5 === 0) {
    return dealBossRoom(
      floor,
      difficulty,
      multBoost,
      volatility,
      houseEdgeOverride
    );
  }
  const cards: DungeonCardData[] = [];
  for (let i = 0; i < 4; i++) {
    const card = generateCard(
      floor,
      cards.map((c) => c.type),
      i * 55,
      difficulty,
      multBoost,
      volatility,
      houseEdgeOverride,
      roomTwist
    );
    cards.push(card);
  }
  return enforceMonsterPresence(
    cards,
    floor,
    difficulty,
    volatility,
    roomTwist
  );
}

export function dealBossRoom(
  floor: number,
  difficulty: DifficultyMode = 'STANDARD',
  multBoost = 1,
  volatility: RgsVolatility = 'MEDIUM',
  houseEdgeOverride?: number
): DungeonCardData[] {
  const boss = createBossCard(
    floor,
    0,
    difficulty,
    multBoost,
    volatility,
    houseEdgeOverride
  );
  const cards: DungeonCardData[] = [boss];

  cards.push(createMonsterCard(floor, 55, difficulty, volatility));
  if (secureRandom() < 0.52) {
    cards.push(createMonsterCard(floor, 110, difficulty, volatility));
  } else {
    const roll = secureRandom();
    cards.push(
      roll < 0.36
        ? createWeaponCard(floor, 110)
        : roll < 0.72
        ? createShieldCard(floor, 110)
        : createPotionCard(110)
    );
  }
  const fourth =
    secureRandom() < 0.5
      ? createGoldCard(floor, 165)
      : createBonusCard(floor, 165, volatility);
  cards.push(secureRandom() < 0.35 ? { ...fourth, shrouded: true } : fourth);

  return shuffleCards(cards);
}

export function dealSanctuaryRoom(
  floor: number,
  hero?: HeroState
): {
  mode: Extract<RoomMode, 'MERCHANT' | 'SHRINE'>;
  cards: DungeonCardData[];
} {
  const mode: 'MERCHANT' | 'SHRINE' =
    secureRandom() < 0.5 ? 'MERCHANT' : 'SHRINE';

  const exitCard: DungeonCardData = {
    id: nextCardId(),
    type: 'EXIT',
    name: `Descend to F${floor + 1}`,
    value: floor + 1,
    variant: 'exit_stairs',
    cleared: false,
    dealDelayMs: 165,
    effectKind: 'LEAVE',
    subtitle: 'Continue Run',
  };

  const needsHealing = !hero || hero.hp < hero.maxHp;

  if (mode === 'MERCHANT') {
    const gearBonus = Math.min(4, Math.floor(floor / 5));
    const weaponPower = Math.max(7 + gearBonus, (hero?.weapon?.power ?? 0) + 2);
    const shieldArmor = Math.max(7 + gearBonus, (hero?.shield?.armor ?? 0) + 2);

    const pool: DungeonCardData[] = [
      {
        id: nextCardId(),
        type: 'MERCHANT_ITEM',
        name: 'Forged Greatsword',
        value: weaponPower,
        variant: 'merchant_blade',
        cleared: false,
        dealDelayMs: 0,
        goldCost: 10,
        effectKind: 'WEAPON',
        subtitle: hero?.weapon
          ? `Upgrade to ${weaponPower} Pwr`
          : `Equip ${weaponPower} Power`,
      },
      {
        id: nextCardId(),
        type: 'MERCHANT_ITEM',
        name: 'Runed Aegis',
        value: shieldArmor,
        variant: 'merchant_shield',
        cleared: false,
        dealDelayMs: 55,
        goldCost: 10,
        effectKind: 'SHIELD',
        subtitle: hero?.shield
          ? `Upgrade to ${shieldArmor} Arm`
          : `Equip ${shieldArmor} Armor`,
      },
      {
        id: nextCardId(),
        type: 'MERCHANT_ITEM',
        name: 'Merchant Relic',
        value: 25,
        variant: 'merchant_relic',
        cleared: false,
        dealDelayMs: 110,
        goldCost: 9,
        rewardMult: 0.25,
        effectKind: 'RELIC',
        subtitle: '+0.25x Mult',
      },
      ...(needsHealing
        ? [
            {
              id: nextCardId(),
              type: 'MERCHANT_ITEM' as const,
              name: 'Grand Elixir',
              value: 4,
              variant: 'merchant_elixir' as const,
              cleared: false,
              dealDelayMs: 110,
              goldCost: 7,
              effectKind: 'HEAL' as const,
              subtitle: 'Restore +4 HP',
            },
          ]
        : [
            {
              id: nextCardId(),
              type: 'MERCHANT_ITEM' as const,
              name: 'Master Whetstone',
              value: 2,
              variant: 'merchant_blade' as const,
              cleared: false,
              dealDelayMs: 110,
              goldCost: 8,
              effectKind: 'UPGRADE_GEAR' as const,
              subtitle: '+2 Power & +2 Armor',
            },
          ]),
    ];

    const shuffledMerchant = shuffleCards(pool).slice(0, 3);
    return {
      mode: 'MERCHANT',
      cards: [...shuffledMerchant, exitCard],
    };
  }

  const shrinePool: DungeonCardData[] = [
    {
      id: nextCardId(),
      type: 'SHRINE_BOON',
      name: 'Sunfire Blessing',
      value: 18,
      variant: 'shrine_blessing',
      cleared: false,
      dealDelayMs: 0,
      rewardMult: 0.18,
      effectKind: 'BLESSING',
      subtitle: needsHealing ? '+2 HP & +0.18x' : '+0.18x Blessing',
    },
    {
      id: nextCardId(),
      type: 'SHRINE_BOON',
      name: 'Sacred Anvil',
      value: 2,
      variant: 'shrine_anvil',
      cleared: false,
      dealDelayMs: 55,
      effectKind: 'UPGRADE_GEAR',
      subtitle: '+2 Gear Power & Armor',
    },
    {
      id: nextCardId(),
      type: 'SHRINE_BOON',
      name: 'Fortune Obelisk',
      value: 5,
      variant: 'shrine_fortune',
      cleared: false,
      dealDelayMs: 110,
      rewardMult: 0.12,
      effectKind: 'FORTUNE',
      subtitle: '+5 Gold & +0.12x',
    },
    ...(needsHealing
      ? [
          {
            id: nextCardId(),
            type: 'SHRINE_BOON' as const,
            name: 'Vitality Spring',
            value: 4,
            variant: 'shrine_vitality' as const,
            cleared: false,
            dealDelayMs: 110,
            effectKind: 'HEAL' as const,
            subtitle: 'Heal +4 HP Free',
          },
        ]
      : [
          {
            id: nextCardId(),
            type: 'SHRINE_BOON' as const,
            name: 'Aegis Ward',
            value: 2,
            variant: 'shrine_ward' as const,
            cleared: false,
            dealDelayMs: 110,
            effectKind: 'FORTIFY' as const,
            subtitle: '+2 Armor & +2 Gold',
          },
        ]),
  ];

  const shuffledShrine = shuffleCards(shrinePool).slice(0, 3);
  return {
    mode: 'SHRINE',
    cards: [...shuffledShrine, exitCard],
  };
}

export function dealBonusBuyRoom(
  option: BonusBuyOption,
  difficulty: DifficultyMode = 'STANDARD',
  volatility: RgsVolatility = 'MEDIUM',
  houseEdgeOverride?: number,
  roomTwist: RoomTwist = 'CALM'
): DungeonCardData[] {
  const floor = option.startingFloor;
  if (option.id === 'dragons_wrath') {
    return dealBossRoom(
      floor,
      difficulty,
      option.multBoost ?? 1.32,
      volatility,
      houseEdgeOverride
    );
  }
  const mb = option.multBoost ?? 1.08;
  const seedCards: DungeonCardData[] = [
    createMonsterCard(floor, 0, difficulty, volatility, roomTwist),
    secureRandom() < 0.6
      ? createBonusCard(floor, 55, volatility)
      : generateCard(
          floor,
          ['MONSTER'],
          55,
          difficulty,
          mb,
          volatility,
          houseEdgeOverride,
          roomTwist
        ),
    generateCard(
      floor,
      ['MONSTER', 'BONUS'],
      110,
      difficulty,
      mb,
      volatility,
      houseEdgeOverride,
      roomTwist
    ),
    generateCard(
      floor,
      ['MONSTER', 'BONUS'],
      165,
      difficulty,
      mb,
      volatility,
      houseEdgeOverride,
      roomTwist
    ),
  ];
  return enforceMonsterPresence(
    seedCards,
    floor,
    difficulty,
    volatility,
    roomTwist
  );
}

export function dealReplacementCards(
  currentRow: DungeonCardData[],
  floor: number,
  difficulty: DifficultyMode = 'STANDARD',
  multBoost = 1,
  volatility: RgsVolatility = 'MEDIUM',
  houseEdgeOverride?: number,
  roomTwist: RoomTwist = 'CALM'
): DungeonCardData[] {
  if (floor > 0 && floor % 5 === 0) {
    return dealBossRoom(
      floor,
      difficulty,
      multBoost,
      volatility,
      houseEdgeOverride
    );
  }

  const survivor = currentRow.find(
    (c) => !c.cleared && c.type !== 'BOSS' && c.type !== 'EXIT'
  );
  const nextRow: DungeonCardData[] = [];

  if (survivor) {
    if (survivor.type === 'MONSTER') {
      nextRow.push({
        ...survivor,
        shrouded: false,
        value: Math.min(getMaxEnemyPower(difficulty), survivor.value + 1),
        enraged: true,
        carriedOver: true,
        dealDelayMs: 0,
      });
    } else {
      nextRow.push({
        ...survivor,
        shrouded: false,
        carriedOver: true,
        dealDelayMs: 0,
      });
    }
  }

  let delayIndex = 1;
  while (nextRow.length < 4) {
    const newCard = generateCard(
      floor,
      nextRow.map((c) => c.type),
      delayIndex * 60,
      difficulty,
      multBoost,
      volatility,
      houseEdgeOverride,
      roomTwist
    );
    nextRow.push(newCard);
    delayIndex += 1;
  }

  return enforceMonsterPresence(
    nextRow,
    floor,
    difficulty,
    volatility,
    roomTwist
  );
}

export function refreshUnpickedRoomCards(
  currentRow: DungeonCardData[],
  floor: number,
  difficulty: DifficultyMode = 'STANDARD',
  multBoost = 1,
  volatility: RgsVolatility = 'MEDIUM',
  houseEdgeOverride?: number,
  roomTwist: RoomTwist = 'CALM'
): DungeonCardData[] {
  let delayStep = 0;
  return currentRow.map((card) => {
    if (card.cleared || card.type === 'BOSS' || card.type === 'EXIT') {
      return card;
    }
    const existingTypes = currentRow
      .filter((c) => c.id !== card.id && !c.cleared)
      .map((c) => c.type);
    const replacement = generateCard(
      floor,
      existingTypes,
      delayStep * 50,
      difficulty,
      multBoost,
      volatility,
      houseEdgeOverride,
      roomTwist
    );
    delayStep += 1;
    // Scout action reveals the room cleanly (no shrouded cards)
    return { ...replacement, shrouded: false };
  });
}

export function getFloorClearBonus(clearedFloor: number): number {
  if (clearedFloor >= 20) return 0.65;
  if (clearedFloor >= 15) return 0.5;
  if (clearedFloor >= 10) return 0.38;
  if (clearedFloor >= 7) return 0.28;
  if (clearedFloor >= 5) return 0.22;
  if (clearedFloor === 4) return 0.17;
  if (clearedFloor === 3) return 0.14;
  if (clearedFloor === 2) return 0.11;
  return 0.08;
}

export function getMonsterMultiplierGain(power: number): number {
  if (power >= 15) return 0.3;
  if (power >= 12) return 0.22;
  if (power >= 9) return 0.15;
  if (power >= 7) return 0.1;
  if (power >= 5) return 0.07;
  return 0.04;
}

export function getGoldMultiplierGain(gold: number): number {
  return Math.max(0.03, Math.round(gold * 0.012 * 100) / 100);
}

export function getSpellMultiplierGain(power: number): number {
  return Math.max(0.03, Math.round(power * 0.008 * 100) / 100);
}

export function previewMonsterCombat(
  monsterPower: number,
  hero: HeroState,
  customRewardMult?: number,
  difficulty: DifficultyMode = 'STANDARD',
  isHorde = false,
  multBoost = 1,
  floor = 1,
  volatility: RgsVolatility = 'MEDIUM',
  houseEdgeOverride?: number
): CombatPreview {
  const weaponPower = hero.weapon?.power ?? 0;
  const shieldArmor = hero.shield?.armor ?? 0;

  const weaponAbsorbed = Math.min(weaponPower, monsterPower);
  const afterWeapon = monsterPower - weaponAbsorbed;

  const shieldAbsorbed = Math.min(shieldArmor, afterWeapon);
  const rawHpDamage = Math.max(0, afterWeapon - shieldAbsorbed);
  const scaledRawDamage = isHorde ? rawHpDamage * 2 : rawHpDamage;
  const hpDamage = Math.min(
    getMaxSingleHitDamage(difficulty, volatility),
    scaledRawDamage
  );

  const baseMult = customRewardMult ?? getMonsterMultiplierGain(monsterPower);

  return {
    weaponAbsorbed,
    shieldAbsorbed,
    hpDamage,
    weaponBreaks: weaponPower > 0 && weaponPower - weaponAbsorbed <= 0,
    shieldBreaks: shieldArmor > 0 && shieldArmor - shieldAbsorbed <= 0,
    isLethal: hero.hp - hpDamage <= 0,
    multiplierGain: customRewardMult
      ? customRewardMult
      : scaleMultiplierGain(
          baseMult,
          difficulty,
          multBoost,
          floor,
          volatility,
          houseEdgeOverride
        ),
  };
}
