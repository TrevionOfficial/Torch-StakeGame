import { RgsAuthResult, RgsConfig } from '../types/game';

export const DEFAULT_BET_CENTS = [100, 500, 1000, 5000];
export const MOCK_STARTING_BALANCE_CENTS = 25000;

export interface LaunchParams {
  rgsUrl: string | null;
  sessionID: string | null;
  currency: string;
}

export function getLaunchParams(): LaunchParams {
  const params = new URLSearchParams(window.location.search);
  const rawRgs = params.get('rgs_url')?.trim() || null;
  const sessionID = params.get('sessionID')?.trim() || null;
  const currency = (params.get('currency')?.trim() || 'USD').toUpperCase();

  return {
    rgsUrl: rawRgs ? rawRgs.replace(/^https?:\/\//i, '').replace(/\/+$/, '') : null,
    sessionID,
    currency,
  };
}

export function formatMoney(
  minorAmount: number,
  currency: string,
  unitScale = 100
): string {
  const major = minorAmount / unitScale;
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: unitScale > 100 ? 4 : 2,
    }).format(major);
  } catch {
    return `${currency} ${major.toFixed(2)}`;
  }
}

export async function initializeSession(): Promise<{
  config: RgsConfig;
  initialBalance: number;
  authError: string | null;
}> {
  const { rgsUrl, sessionID, currency } = getLaunchParams();

  if (!rgsUrl) {
    return {
      config: {
        mode: 'mock',
        rgsUrl: null,
        sessionID: null,
        currency,
        unitScale: 100,
        betOptions: DEFAULT_BET_CENTS,
      },
      initialBalance: MOCK_STARTING_BALANCE_CENTS,
      authError: null,
    };
  }

  try {
    const auth = await authenticateRgs(rgsUrl, sessionID || '', currency);
    return {
      config: {
        mode: 'rgs',
        rgsUrl,
        sessionID,
        currency: auth.currency,
        unitScale: auth.unitScale,
        betOptions: auth.betOptions,
      },
      initialBalance: auth.balance,
      authError: null,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Failed to authenticate RGS session.';
    return {
      config: {
        mode: 'rgs',
        rgsUrl,
        sessionID,
        currency,
        unitScale: 100,
        betOptions: DEFAULT_BET_CENTS,
      },
      initialBalance: 0,
      authError: message,
    };
  }
}

export async function authenticateRgs(
  rgsUrl: string,
  sessionID: string,
  fallbackCurrency: string
): Promise<RgsAuthResult> {
  if (!sessionID) {
    throw new Error('Missing sessionID query parameter for RGS authentication.');
  }

  const response = await fetch(`https://${rgsUrl}/wallet/authenticate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionID }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(
      `RGS /wallet/authenticate failed (${response.status})${text ? `: ${text}` : ''}`
    );
  }

  const data = await response.json();
  const balanceAmount = Number(data?.balance?.amount ?? 0);
  const currency = String(data?.balance?.currency || fallbackCurrency || 'USD');

  const rawDefaultBet = Number(data?.config?.defaultBetLevel ?? 0);
  const rawLevels: number[] = Array.isArray(data?.config?.betLevels)
    ? data.config.betLevels.map(Number).filter((n: number) => Number.isFinite(n) && n > 0)
    : [];

  const isMicroScale =
    rawDefaultBet >= 100000 || (rawLevels.length > 0 && Math.max(...rawLevels) >= 100000);
  const unitScale = isMicroScale ? 1_000_000 : 100;

  let betOptions = DEFAULT_BET_CENTS.map((c) => Math.round((c / 100) * unitScale));
  if (rawLevels.length > 0) {
    betOptions = Array.from(new Set(rawLevels)).slice(0, 6);
  }

  return {
    balance: balanceAmount,
    currency,
    unitScale,
    betOptions,
  };
}

export interface SettleRunPayload {
  rgsUrl: string;
  sessionID: string;
  betAmount: number;
  multiplier: number;
  payoutAmount: number;
  outcome: 'win' | 'loss';
  floorReached: number;
  monstersDefeated: number;
  mode?: 'BASE' | 'BONUS' | 'HARDCORE';
  difficultyMode?: 'STANDARD' | 'HARDCORE';
  parriesCount?: number;
  combosCount?: number;
  bossesSlain?: number;
}

export async function settleRgsPlay(
  payload: SettleRunPayload
): Promise<{ updatedBalance: number | null }> {
  const { rgsUrl, sessionID, betAmount, multiplier, payoutAmount, outcome } = payload;

  const response = await fetch(`https://${rgsUrl}/wallet/play`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionID,
      amount: betAmount,
      mode: payload.mode ?? 'BASE',
      multiplier: Number(multiplier.toFixed(2)),
      payout: payoutAmount,
      outcome,
      metadata: {
        game: 'torch',
        floorReached: payload.floorReached,
        monstersDefeated: payload.monstersDefeated,
        difficultyMode: payload.difficultyMode ?? 'STANDARD',
        parriesCount: payload.parriesCount ?? 0,
        combosCount: payload.combosCount ?? 0,
        bossesSlain: payload.bossesSlain ?? 0,
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(
      `RGS /wallet/play failed (${response.status})${text ? `: ${text}` : ''}`
    );
  }

  const data = await response.json();

  if (data?.round?.active === true || (outcome === 'win' && payoutAmount > 0)) {
    const endResp = await fetch(`https://${rgsUrl}/wallet/end-round`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionID }),
    });

    if (endResp.ok) {
      const endData = await endResp.json();
      if (typeof endData?.balance?.amount === 'number') {
        return { updatedBalance: endData.balance.amount };
      }
    }
  }

  const balanceAmount =
    typeof data?.balance?.amount === 'number' ? data.balance.amount : null;

  return { updatedBalance: balanceAmount };
}
