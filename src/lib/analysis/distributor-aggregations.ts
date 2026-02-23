import type { DistributorEntry } from '@/types/distributor';

export function aggregateDistByRetailer(
  entries: DistributorEntry[]
): Record<string, { usd: number; plays: number; count: number }> {
  const result: Record<string, { usd: number; plays: number; count: number }> = {};
  for (const e of entries) {
    const key = e.retailerNormalized || e.retailer || 'unknown';
    if (!result[key]) result[key] = { usd: 0, plays: 0, count: 0 };
    result[key].usd += e.netAmountUsd;
    result[key].plays += e.quantity;
    result[key].count += 1;
  }
  return result;
}

export function aggregateDistByCountry(
  entries: DistributorEntry[]
): Record<string, { usd: number; plays: number }> {
  const result: Record<string, { usd: number; plays: number }> = {};
  for (const e of entries) {
    const key = e.countryCode || 'XX';
    if (!result[key]) result[key] = { usd: 0, plays: 0 };
    result[key].usd += e.netAmountUsd;
    result[key].plays += e.quantity;
  }
  return result;
}

export function aggregateDistBySalesType(
  entries: DistributorEntry[]
): Record<string, { usd: number; plays: number }> {
  const result: Record<string, { usd: number; plays: number }> = {};
  for (const e of entries) {
    const key = e.salesType;
    if (!result[key]) result[key] = { usd: 0, plays: 0 };
    result[key].usd += e.netAmountUsd;
    result[key].plays += e.quantity;
  }
  return result;
}

export function aggregateDistByAlbum(
  entries: DistributorEntry[]
): Record<string, { usd: number; plays: number }> {
  const result: Record<string, { usd: number; plays: number }> = {};
  for (const e of entries) {
    const key = e.albumName || 'Unknown Album';
    if (!result[key]) result[key] = { usd: 0, plays: 0 };
    result[key].usd += e.netAmountUsd;
    result[key].plays += e.quantity;
  }
  return result;
}

export function aggregateDistByPeriod(
  entries: DistributorEntry[]
): Record<string, { usd: number; plays: number }> {
  const result: Record<string, { usd: number; plays: number }> = {};
  for (const e of entries) {
    const key = e.period || 'unknown';
    if (!result[key]) result[key] = { usd: 0, plays: 0 };
    result[key].usd += e.netAmountUsd;
    result[key].plays += e.quantity;
  }
  return result;
}

export function totalDistUsd(entries: DistributorEntry[]): number {
  return entries.reduce((sum, e) => sum + e.netAmountUsd, 0);
}

export function totalDistPlays(entries: DistributorEntry[]): number {
  return entries.reduce((sum, e) => sum + e.quantity, 0);
}
