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

export const HERO_MAX_HP = 20;
export const HARDCORE_MAX_HP = 15;
export const HARDCORE_ENEMY_POWER_BONUS = 2;
export const HARDCORE_MULT_BOOST = 1.35;
export const SALVAGE_GOLD_BONUS = 2;
export const BOSS_FORGE_GOLD_COST = 6;
export const BOSS_FORGE_UPGRADE_AMOUNT = 3;
export const MONSTER_FRENZY_CHANCE = 0.25;
export const MONSTER_FRENZY_BONUS = 2;
export const HORDE_PICK_LIMIT_MS = 4500;
export const HORDE_FAST_PICK_THRESHOLD_MS = 2000;
export const HORDE_SPEED_BASE_BONUS = 0.08;

export function getStartingMaxHp(difficulty: DifficultyMode): number {
  return difficulty === 'HARDCORE' ? HARDCORE_MAX_HP : HERO_MAX_HP;
}

export function getMaxEnemyPower(difficulty: DifficultyMode): number {
  return getStartingMaxHp(difficulty) - 1;
}

export function scaleMultiplierGain(
  baseGain: number,
  difficulty: DifficultyMode
): number {
  const scaled =
    difficulty === 'HARDCORE' ? baseGain * HARDCORE_MULT_BOOST : baseGain;
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
    subtitle: 'Enter armed with steel & ember',
    costMultiplier: 2,
    startingMultiplier: 1.05,
    startingFloor: 1,
    weapon: { name: 'Ember Edge', power: 5, maxPower: 5, variant: 'emberblade' },
    shield: { name: 'Iron Kite', armor: 5, maxArmor: 5, variant: 'kite' },
    perks: ['5 Power Weapon', '5 Armor Shield', '1.05x Start Mult'],
    accent: 'orange',
  },
  {
    id: 'relic_vault',
    name: 'Relic Vault',
    subtitle: 'High-value treasures & boosted start',
    costMultiplier: 4,
    startingMultiplier: 1.35,
    startingFloor: 2,
    weapon: { name: 'Hellfire Axe', power: 7, maxPower: 7, variant: 'halberd' },
    shield: { name: 'Iron Kite', armor: 5, maxArmor: 5, variant: 'kite' },
    perks: ['7 Power Blade', 'Guaranteed Relic', '1.35x Start Mult'],
    accent: 'violet',
  },
  {
    id: 'dragons_wrath',
    name: "Dragon's Wrath",
    subtitle: 'Super bonus with elite gear & relics',
    costMultiplier: 8,
    startingMultiplier: 1.85,
    startingFloor: 3,
    weapon: { name: 'Sunfire Blade', power: 9, maxPower: 9, variant: 'greatsword' },
    shield: { name: 'Tower Shield', armor: 7, maxArmor: 7, variant: 'tower' },
    perks: ['9 Power + 7 Shield', 'Relic & Gold Room', '1.85x Start Mult'],
    accent: 'amber',
  },
  {
    id: 'horde_escape',
    name: 'Horde Escape',
    subtitle: 'Outrun the horde — 4.5s per pick & one wrong move kills you',
    costMultiplier: 3,
    startingMultiplier: 1.2,
    startingFloor: 1,
    weapon: { name: 'Shadow Fang', power: 6, maxPower: 6, variant: 'emberblade' },
    shield: { name: 'Swift Buckler', armor: 5, maxArmor: 5, variant: 'buckler' },
    perks: ['6 Power + 5 Armor', '<2s Reflex Mult Bonus', '4.5s · 1-Hit Lethal'],
    accent: 'crimson',
    speedMode: true,
  },
];

let cardUidCounter = 0;
function nextCardId(): string {
  cardUidCounter += 1;
  return `card-${Date.now()}-${cardUidCounter}-${Math.random().toString(36).slice(2, 6)}`;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleCards(cards: DungeonCardData[]): DungeonCardData[] {
  const arr = [...cards];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.map((card, idx) => ({
    ...card,
    dealDelayMs: card.carriedOver ? 0 : idx * 55,
  }));
}

function pickWeightedType(existingTypes: CardType[], floor: number): CardType {
  const monsterCount = existingTypes.filter((t) => t === 'MONSTER').length;
  const bonusWeight = floor >= 2 ? 7 : 2;

  const weights: Array<{ type: CardType; weight: number }> = [
    { type: 'MONSTER', weight: monsterCount >= 3 ? 10 : 48 + Math.min(14, floor * 2) },
    { type: 'WEAPON', weight: 13 },
    { type: 'SHIELD', weight: 12 },
    { type: 'POTION', weight: 9 },
    { type: 'GOLD', weight: 9 },
    { type: 'SPELL', weight: 5 },
    { type: 'BONUS', weight: existingTypes.includes('BONUS') ? 1 : bonusWeight },
  ];

  const total = weights.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * total;
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
  const tierBoost = Math.min(11, Math.floor((floor - 1) * 1.35));
  const rawMin = 5 + Math.floor(tierBoost * 0.65);
  const rawMax = Math.min(maxEnemyPower, 10 + tierBoost);
  const minRoll = Math.min(rawMax, Math.max(4, rawMin));
  const basePower = randomInt(minRoll, rawMax);
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
  } else if (power >= 6) {
    name = 'Bone Hound';
    variant = 'hound';
  }

  return {
    id: nextCardId(),
    type: 'MONSTER',
    name,
    value: power,
    variant,
    cleared: false,
    dealDelayMs,
  };
}

function createBossCard(
  floor: number,
  dealDelayMs: number,
  difficulty: DifficultyMode = 'STANDARD'
): DungeonCardData {
  const maxEnemyPower = getMaxEnemyPower(difficulty);
  const basePower = 10 + Math.floor(floor * 0.75) + randomInt(0, 3);
  const power = Math.min(
    maxEnemyPower,
    basePower + (difficulty === 'HARDCORE' ? HARDCORE_ENEMY_POWER_BONUS : 0)
  );
  const baseRewardMult = Number(
    Math.min(0.4, 0.16 + Math.floor(floor / 5) * 0.05).toFixed(2)
  );
  const rewardMult = scaleMultiplierGain(baseRewardMult, difficulty);

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
  const bonus = Math.min(4, Math.floor((floor - 1) / 3));
  const power = randomInt(2, 5 + bonus);

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
  const bonus = Math.min(4, Math.floor((floor - 1) / 3));
  const armor = randomInt(2, 5 + bonus);

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
  const heal = randomInt(2, 4);
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
  const gold = randomInt(3, 6 + Math.min(5, floor));
  let name = 'Gold Chest';
  let variant: GoldVariant = 'chest';

  if (gold >= 9) {
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
  const power = randomInt(3, 6);
  const variants: SpellVariant[] = ['fireball', 'sunburst', 'ward'];
  const variant = variants[power % variants.length];
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
  const boostPercent = Math.min(24, 6 + floor * 2);
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
  difficulty: DifficultyMode = 'STANDARD'
): DungeonCardData {
  const type = pickWeightedType(existingTypes, floor);
  switch (type) {
    case 'MONSTER':
      return createMonsterCard(floor, dealDelayMs, difficulty);
    case 'BOSS':
      return createBossCard(floor, dealDelayMs, difficulty);
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
  const minMonsters = Math.random() < 0.5 ? 3 : 2;
  const result = [...cards];
  let monsterCount = result.filter(
    (c) => c.type === 'MONSTER' || c.type === 'BOSS'
  ).length;

  let attempts = 0;
  while (monsterCount < minMonsters && attempts < 12) {
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
  difficulty: DifficultyMode = 'STANDARD'
): DungeonCardData[] {
  if (floor > 0 && floor % 5 === 0) {
    return dealBossRoom(floor, difficulty);
  }
  const cards: DungeonCardData[] = [];
  for (let i = 0; i < 4; i++) {
    const card = generateCard(
      floor,
      cards.map((c) => c.type),
      i * 55,
      difficulty
    );
    cards.push(card);
  }
  return enforceMonsterPresence(cards, floor, difficulty);
}

export function dealBossRoom(
  floor: number,
  difficulty: DifficultyMode = 'STANDARD'
): DungeonCardData[] {
  const boss = createBossCard(floor, 0, difficulty);
  const supportTypes: CardType[] = ['MONSTER', 'WEAPON', 'SHIELD', 'POTION'];
  const cards: DungeonCardData[] = [boss];

  // Ensure 1 extra monster + 2 helpful combat cards (weapon/shield/potion/gold)
  cards.push(createMonsterCard(floor, 55, difficulty));
  const thirdPool = supportTypes.slice(1);
  const pick3 = thirdPool[randomInt(0, thirdPool.length - 1)];
  cards.push(
    pick3 === 'WEAPON'
      ? createWeaponCard(floor + 1, 110)
      : pick3 === 'SHIELD'
      ? createShieldCard(floor + 1, 110)
      : createPotionCard(110)
  );
  cards.push(
    Math.random() < 0.5
      ? createGoldCard(floor + 1, 165)
      : createSpellCard(165)
  );

  return shuffleCards(cards);
}

export function dealSanctuaryRoom(floor: number): {
  mode: Extract<RoomMode, 'MERCHANT' | 'SHRINE'>;
  cards: DungeonCardData[];
} {
  const mode: 'MERCHANT' | 'SHRINE' =
    Math.random() < 0.5 ? 'MERCHANT' : 'SHRINE';

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

  if (mode === 'MERCHANT') {
    const gearBonus = Math.min(4, Math.floor(floor / 5));
    const pool: DungeonCardData[] = [
      {
        id: nextCardId(),
        type: 'MERCHANT_ITEM',
        name: 'Forged Greatsword',
        value: 8 + gearBonus,
        variant: 'merchant_blade',
        cleared: false,
        dealDelayMs: 0,
        goldCost: 9,
        effectKind: 'WEAPON',
        subtitle: `Equip ${8 + gearBonus} Power`,
      },
      {
        id: nextCardId(),
        type: 'MERCHANT_ITEM',
        name: 'Runed Aegis',
        value: 8 + gearBonus,
        variant: 'merchant_shield',
        cleared: false,
        dealDelayMs: 55,
        goldCost: 9,
        effectKind: 'SHIELD',
        subtitle: `Equip ${8 + gearBonus} Armor`,
      },
      {
        id: nextCardId(),
        type: 'MERCHANT_ITEM',
        name: 'Grand Elixir',
        value: 5,
        variant: 'merchant_elixir',
        cleared: false,
        dealDelayMs: 110,
        goldCost: 6,
        effectKind: 'HEAL',
        subtitle: 'Restore +5 HP',
      },
      {
        id: nextCardId(),
        type: 'MERCHANT_ITEM',
        name: 'Merchant Relic',
        value: 12,
        variant: 'merchant_relic',
        cleared: false,
        dealDelayMs: 110,
        goldCost: 10,
        rewardMult: 0.12,
        effectKind: 'RELIC',
        subtitle: '+0.12x Pending',
      },
    ];

    const shuffledMerchant = shuffleCards(pool).slice(0, 3);
    return {
      mode: 'MERCHANT',
      cards: [...shuffledMerchant, exitCard],
    };
  }

  // SHRINE
  const shrinePool: DungeonCardData[] = [
    {
      id: nextCardId(),
      type: 'SHRINE_BOON',
      name: 'Blood Altar',
      value: 15,
      variant: 'shrine_blood',
      cleared: false,
      dealDelayMs: 0,
      hpCost: 5,
      rewardMult: 0.15,
      effectKind: 'BLOOD_PACT',
      subtitle: '-5 HP → +0.15x',
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
      name: 'Ember Fountain',
      value: 4,
      variant: 'shrine_vitality',
      cleared: false,
      dealDelayMs: 110,
      effectKind: 'HEAL',
      subtitle: 'Heal +4 HP Free',
    },
    {
      id: nextCardId(),
      type: 'SHRINE_BOON',
      name: 'Fortune Obelisk',
      value: 6,
      variant: 'shrine_fortune',
      cleared: false,
      dealDelayMs: 110,
      rewardMult: 0.07,
      effectKind: 'FORTUNE',
      subtitle: '+6 Gold & +0.07x',
    },
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
  if (option.id === 'armory') {
    return shuffleCards([
      createMonsterCard(floor, 0, difficulty),
      createGoldCard(floor + 1, 55),
      createMonsterCard(floor, 110, difficulty),
      createPotionCard(165),
    ]);
  }
  if (option.id === 'relic_vault') {
    return shuffleCards([
      createBonusCard(floor + 1, 0),
      createMonsterCard(floor, 55, difficulty),
      createGoldCard(floor + 2, 110),
      createMonsterCard(floor + 1, 165, difficulty),
    ]);
  }
  if (option.id === 'horde_escape') {
    return shuffleCards([
      createMonsterCard(floor, 0, difficulty),
      createGoldCard(floor + 1, 55),
      createMonsterCard(floor, 110, difficulty),
      createSpellCard(165),
    ]);
  }
  return shuffleCards([
    createBonusCard(floor + 2, 0),
    createMonsterCard(floor + 1, 55, difficulty),
    createGoldCard(floor + 3, 110),
    createMonsterCard(floor + 1, 165, difficulty),
  ]);
}

export function dealReplacementCards(
  currentRow: DungeonCardData[],
  floor: number,
  difficulty: DifficultyMode = 'STANDARD'
): DungeonCardData[] {
  if (floor > 0 && floor % 5 === 0) {
    return dealBossRoom(floor, difficulty);
  }

  const survivor = currentRow.find(
    (c) => !c.cleared && c.type !== 'BOSS' && c.type !== 'EXIT'
  );
  const nextRow: DungeonCardData[] = [];

  if (survivor) {
    if (survivor.type === 'MONSTER') {
      // Skipped monsters hunt you into the next floor enraged (+2 Power, capped below hero max HP)
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
      difficulty
    );
    nextRow.push(newCard);
    delayIndex += 1;
  }

  return enforceMonsterPresence(nextRow, floor, difficulty);
}

export function getMonsterMultiplierGain(power: number): number {
  if (power >= 15) return 0.15;
  if (power >= 12) return 0.1;
  if (power >= 9) return 0.06;
  if (power >= 7) return 0.04;
  return 0.02;
}

export function getGoldMultiplierGain(gold: number): number {
  return Math.max(0.01, Math.round(gold * 0.003 * 100) / 100);
}

export function getSpellMultiplierGain(power: number): number {
  return Math.max(0.01, Math.round(power * 0.005 * 100) / 100);
}

export function previewMonsterCombat(
  monsterPower: number,
  hero: HeroState,
  customRewardMult?: number,
  difficulty: DifficultyMode = 'STANDARD',
  isHorde = false
): CombatPreview {
  const weaponPower = hero.weapon?.power ?? 0;
  const shieldArmor = hero.shield?.armor ?? 0;

  const weaponAbsorbed = Math.min(weaponPower, monsterPower);
  const afterWeapon = monsterPower - weaponAbsorbed;

  const shieldAbsorbed = Math.min(shieldArmor, afterWeapon);
  const hpDamage = afterWeapon - shieldAbsorbed;

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
      : scaleMultiplierGain(baseMult, difficulty),
  };
}
