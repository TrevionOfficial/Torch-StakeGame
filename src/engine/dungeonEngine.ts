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
  RoomMode,
  ShieldVariant,
  SpellVariant,
  WeaponVariant,
} from '../types/game';

export const HERO_MAX_HP = 12;
export const HARDCORE_MAX_HP = 9;
export const HARDCORE_ENEMY_POWER_BONUS = 2;
export const HARDCORE_MULT_BOOST = 1.45;
export const STANDARD_STARTING_MULT = 0.66;
export const HARDCORE_STARTING_MULT = 0.72;
export const HOUSE_EDGE_RTP = 0.96; // 4% built-in house edge target
export const MAX_SINGLE_HIT_DAMAGE_STANDARD = 12;
export const MAX_SINGLE_HIT_DAMAGE_HARDCORE = 14;
export const SALVAGE_GOLD_BONUS = 2;
export const BOSS_FORGE_GOLD_COST = 6;
export const BOSS_FORGE_UPGRADE_AMOUNT = 3;
export const STARTING_SCOUT_CHARGES = 1;
export const MAX_SCOUT_CHARGES = 2;
export const HORDE_PICK_LIMIT_MS = 4500;
export const HORDE_FAST_PICK_THRESHOLD_MS = 2000;
export const HORDE_SPEED_BASE_BONUS = 0.14;

function secureRandom(): number {
  const cryptoObj = globalThis.crypto;
  if (cryptoObj && typeof cryptoObj.getRandomValues === 'function') {
    const arr = new Uint32Array(1);
    cryptoObj.getRandomValues(arr);
    return arr[0] / 4294967296;
  }
  return Math.random();
}

export function getStartingMaxHp(difficulty: DifficultyMode): number {
  return difficulty === 'HARDCORE' ? HARDCORE_MAX_HP : HERO_MAX_HP;
}

export function getStartingMultiplier(difficulty: DifficultyMode): number {
  return difficulty === 'HARDCORE'
    ? HARDCORE_STARTING_MULT
    : STANDARD_STARTING_MULT;
}

export function getMaxEnemyPower(difficulty: DifficultyMode): number {
  return difficulty === 'HARDCORE' ? 20 : 19;
}

export function getMaxSingleHitDamage(difficulty: DifficultyMode): number {
  return difficulty === 'HARDCORE'
    ? MAX_SINGLE_HIT_DAMAGE_HARDCORE
    : MAX_SINGLE_HIT_DAMAGE_STANDARD;
}

export function getStarterWeapon(difficulty: DifficultyMode) {
  const power = difficulty === 'HARDCORE' ? 1 : 2;
  return {
    name: 'Pine Torch',
    power,
    maxPower: power,
    variant: 'torch' as WeaponVariant,
  };
}

export function getFloorMultiplierScale(floor: number): number {
  if (floor >= 11) {
    return Math.min(2.6, 1.7 + (floor - 10) * 0.08);
  }
  if (floor >= 5) {
    return 1.28 + (floor - 5) * 0.085;
  }
  if (floor >= 3) {
    return 1.08 + (floor - 3) * 0.08;
  }
  if (floor === 2) return 1.02;
  return 0.96;
}

export function scaleMultiplierGain(
  baseGain: number,
  difficulty: DifficultyMode,
  multBoost = 1,
  floor = 1
): number {
  const modeBoost = difficulty === 'HARDCORE' ? HARDCORE_MULT_BOOST : 1;
  const floorScale = getFloorMultiplierScale(floor);
  const scaled =
    baseGain * modeBoost * multBoost * floorScale * HOUSE_EDGE_RTP;
  return Math.round(scaled * 100) / 100;
}

export function getGearSalvagePreview(
  card: DungeonCardData,
  hero: HeroState
): GearSalvagePreview {
  if (card.type === 'WEAPON' && hero.weapon && hero.weapon.power >= card.value) {
    return {
      isSalvage: true,
      temperAmount: card.value >= hero.weapon.power ? 2 : 1,
      goldGain: SALVAGE_GOLD_BONUS,
    };
  }
  if (card.type === 'SHIELD' && hero.shield && hero.shield.armor >= card.value) {
    return {
      isSalvage: true,
      temperAmount: card.value >= hero.shield.armor ? 2 : 1,
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
    subtitle: 'Enter Floor 2 armed with steel & volatile loot',
    costMultiplier: 2,
    startingMultiplier: 1.38,
    startingFloor: 2,
    multBoost: 1.15,
    weapon: { name: 'Ember Edge', power: 5, maxPower: 5, variant: 'emberblade' },
    shield: { name: 'Oak Buckler', armor: 4, maxArmor: 4, variant: 'buckler' },
    perks: ['5 Power + 4 Armor', '1.15x Mult Speed', '1.38x Start Mult (F2)'],
    accent: 'orange',
  },
  {
    id: 'relic_vault',
    name: 'Relic Vault',
    subtitle: 'High-stakes Floor 4 entry with elite relic drop',
    costMultiplier: 4,
    startingMultiplier: 2.85,
    startingFloor: 4,
    multBoost: 1.35,
    weapon: { name: 'Hellfire Axe', power: 7, maxPower: 7, variant: 'halberd' },
    shield: { name: 'Iron Kite', armor: 5, maxArmor: 5, variant: 'kite' },
    perks: ['7 Power + 5 Armor', '1.35x Mult Speed + Relic', '2.85x Start Mult (F4)'],
    accent: 'violet',
  },
  {
    id: 'dragons_wrath',
    name: "Dragon's Wrath",
    subtitle: 'Boss Floor 5 showdown — huge upside, deadly risk',
    costMultiplier: 5,
    startingMultiplier: 3.4,
    startingFloor: 5,
    multBoost: 1.45,
    weapon: { name: 'Sunfire Blade', power: 8, maxPower: 8, variant: 'greatsword' },
    shield: { name: 'Tower Shield', armor: 6, maxArmor: 6, variant: 'tower' },
    perks: ['8 Power + 6 Armor', '1.45x Mult Speed · Boss F5', '3.40x Start Mult (F5)'],
    accent: 'amber',
  },
  {
    id: 'horde_escape',
    name: 'Horde Escape',
    subtitle: 'Outrun the horde — 4.5s per pick & 1-hit lethal',
    costMultiplier: 3,
    startingMultiplier: 2.1,
    startingFloor: 2,
    multBoost: 1.3,
    weapon: { name: 'Shadow Fang', power: 6, maxPower: 6, variant: 'emberblade' },
    shield: { name: 'Swift Buckler', armor: 5, maxArmor: 5, variant: 'buckler' },
    perks: ['6 Power + 5 Armor', '1.30x Mult + <2s Reflex', '2.10x Start · 1-Hit Lethal'],
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

function pickWeightedType(existingTypes: CardType[], floor: number): CardType {
  const monsterCount = existingTypes.filter((t) => t === 'MONSTER').length;
  const bonusWeight = floor >= 2 ? 5 : 3;

  const weights: Array<{ type: CardType; weight: number }> = [
    {
      type: 'MONSTER',
      weight: monsterCount >= 3 ? 22 : 48 + Math.min(20, floor * 2),
    },
    { type: 'WEAPON', weight: 13 },
    { type: 'SHIELD', weight: 13 },
    { type: 'POTION', weight: 9 },
    { type: 'GOLD', weight: 9 },
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
  difficulty: DifficultyMode = 'STANDARD'
): DungeonCardData {
  const maxEnemyPower = getMaxEnemyPower(difficulty);
  const tierBoost = Math.min(11, Math.floor((floor - 1) * 1.1));
  const rawMin = 4 + Math.floor(tierBoost * 0.5);
  const rawMax = Math.min(maxEnemyPower, 8 + tierBoost);
  const minRoll = Math.min(rawMax, Math.max(3, rawMin));

  // Unpredictable ambush spikes: enraged monsters hit +2..+4 harder
  const enragedChance = Math.min(0.4, 0.18 + (floor - 1) * 0.025);
  const isEnragedSpawn = secureRandom() < enragedChance;
  const ambushBoost = isEnragedSpawn ? randomInt(2, 4) : 0;

  const basePower = randomInt(minRoll, rawMax) + ambushBoost;
  const power = Math.min(
    maxEnemyPower,
    basePower + (difficulty === 'HARDCORE' ? HARDCORE_ENEMY_POWER_BONUS : 0)
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
    enraged: isEnragedSpawn,
    cleared: false,
    dealDelayMs,
  };
}

function createBossCard(
  floor: number,
  dealDelayMs: number,
  difficulty: DifficultyMode = 'STANDARD',
  multBoost = 1
): DungeonCardData {
  const maxEnemyPower = getMaxEnemyPower(difficulty);
  const basePower = 8 + Math.floor(floor * 0.5) + randomInt(0, 3);
  const power = Math.min(
    maxEnemyPower,
    basePower + (difficulty === 'HARDCORE' ? HARDCORE_ENEMY_POWER_BONUS : 0)
  );
  const baseRewardMult = Number(
    Math.min(0.95, 0.4 + Math.floor(floor / 5) * 0.12).toFixed(2)
  );
  const rewardMult = scaleMultiplierGain(
    baseRewardMult,
    difficulty,
    multBoost,
    floor
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
    subtitle: `Boss · +${rewardMult.toFixed(2)}x`,
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

function createBonusCard(floor: number, dealDelayMs: number): DungeonCardData {
  const minPct = Math.min(18, 6 + floor);
  const maxPct = Math.min(44, 15 + floor * 3);
  const boostPercent = randomInt(minPct, maxPct);
  const variants: BonusVariant[] = ['chalice', 'crown', 'relic'];
  const variant = variants[randomInt(0, variants.length - 1)];
  const name =
    variant === 'chalice'
      ? 'Sun Chalice'
      : variant === 'crown'
      ? 'Vault Crown'
      : 'Ember Relic';

  return {
    id: nextCardId(),
    type: 'BONUS',
    name,
    value: boostPercent,
    variant,
    cleared: false,
    dealDelayMs,
  };
}

export function generateCard(
  floor: number,
  existingTypes: CardType[],
  dealDelayMs = 0,
  difficulty: DifficultyMode = 'STANDARD',
  multBoost = 1
): DungeonCardData {
  const type = pickWeightedType(existingTypes, floor);
  switch (type) {
    case 'MONSTER':
      return createMonsterCard(floor, dealDelayMs, difficulty);
    case 'BOSS':
      return createBossCard(floor, dealDelayMs, difficulty, multBoost);
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
      return createBonusCard(floor, dealDelayMs);
    default:
      return createMonsterCard(floor, dealDelayMs, difficulty);
  }
}

function enforceMonsterPresence(
  cards: DungeonCardData[],
  floor: number,
  difficulty: DifficultyMode = 'STANDARD'
): DungeonCardData[] {
  // High-variance room density: 12% 1-monster, 48% 2-monster, 32% 3-monster, 8% full 4-monster ambush
  const countRoll = secureRandom();
  const minMonsters =
    countRoll < 0.12 ? 1 : countRoll < 0.6 ? 2 : countRoll < 0.92 ? 3 : 4;
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
        difficulty
      );
      monsterCount += 1;
    }
  }

  return shuffleCards(result);
}

export function dealFreshRoom(
  floor: number,
  difficulty: DifficultyMode = 'STANDARD',
  multBoost = 1
): DungeonCardData[] {
  if (floor > 0 && floor % 5 === 0) {
    return dealBossRoom(floor, difficulty, multBoost);
  }
  const cards: DungeonCardData[] = [];
  for (let i = 0; i < 4; i++) {
    const card = generateCard(
      floor,
      cards.map((c) => c.type),
      i * 55,
      difficulty,
      multBoost
    );
    cards.push(card);
  }
  return enforceMonsterPresence(cards, floor, difficulty);
}

export function dealBossRoom(
  floor: number,
  difficulty: DifficultyMode = 'STANDARD',
  multBoost = 1
): DungeonCardData[] {
  const boss = createBossCard(floor, 0, difficulty, multBoost);
  const cards: DungeonCardData[] = [boss];

  // Unpredictable boss room: 1-2 extra monsters + random support/loot
  cards.push(createMonsterCard(floor, 55, difficulty));
  if (secureRandom() < 0.5) {
    cards.push(createMonsterCard(floor, 110, difficulty));
  } else {
    const roll = secureRandom();
    cards.push(
      roll < 0.38
        ? createWeaponCard(floor, 110)
        : roll < 0.75
        ? createShieldCard(floor, 110)
        : createPotionCard(110)
    );
  }
  cards.push(
    secureRandom() < 0.5
      ? createGoldCard(floor, 165)
      : createSpellCard(165)
  );

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
  difficulty: DifficultyMode = 'STANDARD'
): DungeonCardData[] {
  const floor = option.startingFloor;
  if (option.id === 'dragons_wrath') {
    return dealBossRoom(floor, difficulty, option.multBoost ?? 1.45);
  }
  const mb = option.multBoost ?? 1.15;
  const seedCards: DungeonCardData[] = [
    createMonsterCard(floor, 0, difficulty),
    secureRandom() < 0.65
      ? createBonusCard(floor, 55)
      : generateCard(floor, ['MONSTER'], 55, difficulty, mb),
    generateCard(floor, ['MONSTER', 'BONUS'], 110, difficulty, mb),
    generateCard(floor, ['MONSTER', 'BONUS'], 165, difficulty, mb),
  ];
  return enforceMonsterPresence(seedCards, floor, difficulty);
}

export function dealReplacementCards(
  currentRow: DungeonCardData[],
  floor: number,
  difficulty: DifficultyMode = 'STANDARD',
  multBoost = 1
): DungeonCardData[] {
  if (floor > 0 && floor % 5 === 0) {
    return dealBossRoom(floor, difficulty, multBoost);
  }

  const survivor = currentRow.find(
    (c) => !c.cleared && c.type !== 'BOSS' && c.type !== 'EXIT'
  );
  const nextRow: DungeonCardData[] = [];

  if (survivor) {
    if (survivor.type === 'MONSTER') {
      // Skipped monsters hunt you into the next floor enraged (+2 Power)
      nextRow.push({
        ...survivor,
        value: Math.min(getMaxEnemyPower(difficulty), survivor.value + 2),
        enraged: true,
        carriedOver: true,
        dealDelayMs: 0,
      });
    } else {
      nextRow.push({ ...survivor, carriedOver: true, dealDelayMs: 0 });
    }
  }

  let delayIndex = 1;
  while (nextRow.length < 4) {
    const newCard = generateCard(
      floor,
      nextRow.map((c) => c.type),
      delayIndex * 60,
      difficulty,
      multBoost
    );
    nextRow.push(newCard);
    delayIndex += 1;
  }

  return enforceMonsterPresence(nextRow, floor, difficulty);
}

export function refreshUnpickedRoomCards(
  currentRow: DungeonCardData[],
  floor: number,
  difficulty: DifficultyMode = 'STANDARD',
  multBoost = 1
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
      multBoost
    );
    delayStep += 1;
    return replacement;
  });
}

export function getFloorClearBonus(clearedFloor: number): number {
  if (clearedFloor >= 20) return 0.72;
  if (clearedFloor >= 15) return 0.56;
  if (clearedFloor >= 10) return 0.44;
  if (clearedFloor >= 7) return 0.34;
  if (clearedFloor >= 5) return 0.28;
  if (clearedFloor === 4) return 0.22;
  if (clearedFloor === 3) return 0.18;
  if (clearedFloor === 2) return 0.14;
  return 0.1;
}

export function getMonsterMultiplierGain(power: number): number {
  if (power >= 15) return 0.34;
  if (power >= 12) return 0.24;
  if (power >= 9) return 0.17;
  if (power >= 7) return 0.12;
  if (power >= 5) return 0.08;
  return 0.05;
}

export function getGoldMultiplierGain(gold: number): number {
  return Math.max(0.04, Math.round(gold * 0.014 * 100) / 100);
}

export function getSpellMultiplierGain(power: number): number {
  return Math.max(0.03, Math.round(power * 0.01 * 100) / 100);
}

export function previewMonsterCombat(
  monsterPower: number,
  hero: HeroState,
  customRewardMult?: number,
  difficulty: DifficultyMode = 'STANDARD',
  isHorde = false,
  multBoost = 1,
  floor = 1
): CombatPreview {
  const weaponPower = hero.weapon?.power ?? 0;
  const shieldArmor = hero.shield?.armor ?? 0;

  const weaponAbsorbed = Math.min(weaponPower, monsterPower);
  const afterWeapon = monsterPower - weaponAbsorbed;

  const shieldAbsorbed = Math.min(shieldArmor, afterWeapon);
  const rawHpDamage = Math.max(0, afterWeapon - shieldAbsorbed);
  const hpDamage = Math.min(getMaxSingleHitDamage(difficulty), rawHpDamage);

  const baseMult = customRewardMult ?? getMonsterMultiplierGain(monsterPower);

  return {
    weaponAbsorbed,
    shieldAbsorbed,
    hpDamage,
    weaponBreaks: weaponPower > 0 && weaponPower - weaponAbsorbed <= 0,
    shieldBreaks: shieldArmor > 0 && shieldArmor - shieldAbsorbed <= 0,
    isLethal: isHorde ? hpDamage > 0 : hero.hp - hpDamage <= 0,
    multiplierGain: customRewardMult
      ? customRewardMult
      : scaleMultiplierGain(baseMult, difficulty, multBoost, floor),
  };
}
