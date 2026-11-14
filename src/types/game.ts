export type CardType =
  | 'MONSTER'
  | 'BOSS'
  | 'WEAPON'
  | 'SHIELD'
  | 'POTION'
  | 'GOLD'
  | 'SPELL'
  | 'BONUS'
  | 'MERCHANT_ITEM'
  | 'SHRINE_BOON'
  | 'EXIT';

export type MonsterVariant =
  | 'skeleton'
  | 'goblin'
  | 'hound'
  | 'cultist'
  | 'golem'
  | 'demon'
  | 'dragon';

export type BossVariant =
  | 'crypt_warden'
  | 'blood_lord'
  | 'abyssal_sovereign'
  | 'inferno_wyrm';

export type WeaponVariant = 'torch' | 'emberblade' | 'halberd' | 'greatsword';
export type ShieldVariant = 'buckler' | 'kite' | 'tower' | 'aegis';
export type PotionVariant = 'crimson' | 'elixir' | 'phoenix';
export type GoldVariant = 'chest' | 'coins' | 'crown';
export type SpellVariant = 'fireball' | 'sunburst' | 'ward';
export type BonusVariant = 'chalice' | 'crown' | 'relic';
export type SanctuaryVariant =
  | 'merchant_blade'
  | 'merchant_shield'
  | 'merchant_elixir'
  | 'merchant_relic'
  | 'shrine_anvil'
  | 'shrine_blessing'
  | 'shrine_vitality'
  | 'shrine_fortune'
  | 'shrine_ward'
  | 'exit_stairs';

export type SanctuaryEffectKind =
  | 'WEAPON'
  | 'SHIELD'
  | 'HEAL'
  | 'RELIC'
  | 'UPGRADE_GEAR'
  | 'BLESSING'
  | 'FORTIFY'
  | 'FORTUNE'
  | 'LEAVE';

export interface DungeonCardData {
  id: string;
  type: CardType;
  name: string;
  value: number;
  variant:
    | MonsterVariant
    | BossVariant
    | WeaponVariant
    | ShieldVariant
    | PotionVariant
    | GoldVariant
    | SpellVariant
    | BonusVariant
    | SanctuaryVariant;
  cleared: boolean;
  carriedOver?: boolean;
  enraged?: boolean;
  dealDelayMs?: number;
  goldCost?: number;
  hpCost?: number;
  rewardMult?: number;
  subtitle?: string;
  effectKind?: SanctuaryEffectKind;
}

export interface EquippedWeapon {
  name: string;
  power: number;
  maxPower: number;
  variant: WeaponVariant;
}

export interface EquippedShield {
  name: string;
  armor: number;
  maxArmor: number;
  variant: ShieldVariant;
}

export interface HeroState {
  hp: number;
  maxHp: number;
  gold: number;
  weapon: EquippedWeapon | null;
  shield: EquippedShield | null;
}

export type ScreenMode = 'TITLE' | 'GAME';
export type RunPhase = 'IDLE' | 'PLAYING' | 'CASHED_OUT' | 'DEFEAT';
export type RoomMode = 'COMBAT' | 'BOSS' | 'MERCHANT' | 'SHRINE';
export type DifficultyMode = 'STANDARD' | 'HARDCORE';

export interface GearSalvagePreview {
  isSalvage: boolean;
  temperAmount: number;
  goldGain: number;
}

export interface CombatPreview {
  weaponAbsorbed: number;
  shieldAbsorbed: number;
  hpDamage: number;
  weaponBreaks: boolean;
  shieldBreaks: boolean;
  isLethal: boolean;
  multiplierGain: number;
}

export interface FloatingFeedback {
  id: string;
  target: 'HERO' | 'WEAPON' | 'SHIELD' | 'GOLD';
  text: string;
  tone: 'damage' | 'block' | 'heal' | 'gold' | 'ember' | 'spell' | 'bonus';
}

export interface BonusBanner {
  id: number;
  title: string;
  rewardText: string;
}

export interface BonusBuyOption {
  id: 'armory' | 'relic_vault' | 'dragons_wrath' | 'horde_escape';
  name: string;
  subtitle: string;
  costMultiplier: number;
  startingMultiplier: number;
  startingFloor: number;
  multBoost?: number;
  weapon: EquippedWeapon;
  shield: EquippedShield;
  perks: string[];
  accent: 'orange' | 'violet' | 'amber' | 'crimson';
  speedMode?: boolean;
}

export interface RecentRunEntry {
  id: string;
  mult: number;
  mode: DifficultyMode;
  win: boolean;
  horde?: boolean;
}

export interface SessionStats {
  runsPlayed: number;
  bestFloor: number;
  bestMultiplier: number;
  totalPayout: number;
}

export interface ParticleBurstRequest {
  id: number;
  xRatio: number;
  yRatio: number;
  color: string;
  count: number;
  celebration?: boolean;
  palette?: string[];
}

export interface RgsConfig {
  mode: 'mock' | 'rgs';
  rgsUrl: string | null;
  sessionID: string | null;
  currency: string;
  unitScale: number;
  betOptions: number[];
}

export interface RgsAuthResult {
  balance: number;
  currency: string;
  unitScale: number;
  betOptions: number[];
}

export type TorchFlameId = 'amber' | 'crimson' | 'emerald' | 'violet' | 'solar';

export interface TorchFlameTheme {
  id: TorchFlameId;
  name: string;
  unlockRank: number;
  emberColors: string[];
  heroBorderClass: string;
  heroGlowClass: string;
  textAccentClass: string;
  dotColor: string;
}

export interface RankTier {
  rank: number;
  title: string;
  minEmbers: number;
  flameUnlock?: TorchFlameId;
}

export type BountyMetric =
  | 'KILLS'
  | 'PARRIES'
  | 'FLOORS'
  | 'GOLD'
  | 'BOSSES'
  | 'CASHOUT';

export interface RunBounty {
  id: string;
  title: string;
  description: string;
  metric: BountyMetric;
  target: number;
  progress: number;
  rewardEmbers: number;
}

export interface RetentionProfile {
  embers: number;
  activeBounty: RunBounty;
  completedBounties: number;
  selectedFlameId: TorchFlameId;
}

export interface RunRetentionSummary {
  embersEarned: number;
  bountyCompletedTitle: string | null;
  rankedUpTo: RankTier | null;
  unlockedFlame: TorchFlameTheme | null;
  newBestFloor: boolean;
  newBestMult: boolean;
  floorDeltaToBest: number;
}
