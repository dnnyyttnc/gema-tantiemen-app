import type { GemaRoyaltyEntry } from '@/types/gema';
import type { DistributorEntry } from '@/types/distributor';
import { getCanonicalPlatformKey, getPlatformName, getPlatformColor } from '@/lib/constants/platforms';

export interface PlatformComparison {
  platformKey: string;
  platformName: string;
  platformColor: string;
  gema: { revenueEur: number; plays: number; perPlay: number };
  distributor: { revenueUsd: number; plays: number; perPlayUsd: number };
  combined: { totalEur: number; gemaUpliftPct: number };
  playDiscrepancy: { pctDiff: number; moreIn: 'gema' | 'distributor' | 'equal' };
}

export interface ComparisonSummary {
  gemaTotalEur: number;
  distTotalUsd: number;
  distTotalEur: number;
  combinedTotalEur: number;
  gemaUpliftPct: number;
  platforms: PlatformComparison[];
  matchedCount: number;
  unmatchedGema: string[];
  unmatchedDist: string[];
}

export interface TimeSeriesPoint {
  period: string;
  gemaEur: number;
  distEur: number;
  combinedEur: number;
}

export function computeComparison(
  gemaEntries: GemaRoyaltyEntry[],
  distEntries: DistributorEntry[],
  eurUsdRate: number
): ComparisonSummary {
  // Aggregate GEMA by canonical platform key
  const gemaByPlatform = new Map<string, { revenue: number; plays: number }>();
  for (const e of gemaEntries) {
    const key = getCanonicalPlatformKey(e.nutzer);
    const existing = gemaByPlatform.get(key) || { revenue: 0, plays: 0 };
    existing.revenue += e.betrag;
    existing.plays += e.nutzungsanzahl;
    gemaByPlatform.set(key, existing);
  }

  // Aggregate distributor by normalized retailer
  const distByPlatform = new Map<string, { revenueUsd: number; plays: number }>();
  for (const e of distEntries) {
    const key = e.retailerNormalized;
    const existing = distByPlatform.get(key) || { revenueUsd: 0, plays: 0 };
    existing.revenueUsd += e.netAmountUsd;
    existing.plays += e.quantity;
    distByPlatform.set(key, existing);
  }

  const allKeys = new Set([...gemaByPlatform.keys(), ...distByPlatform.keys()]);
  const platforms: PlatformComparison[] = [];
  const unmatchedGema: string[] = [];
  const unmatchedDist: string[] = [];
  let matchedCount = 0;

  for (const key of allKeys) {
    const gema = gemaByPlatform.get(key);
    const dist = distByPlatform.get(key);

    if (gema && !dist) {
      unmatchedGema.push(key);
    } else if (dist && !gema) {
      unmatchedDist.push(key);
    }

    if (gema || dist) {
      if (gema && dist) matchedCount++;

      const gemaRevenue = gema?.revenue || 0;
      const gemaPlays = gema?.plays || 0;
      const distRevenueUsd = dist?.revenueUsd || 0;
      const distPlays = dist?.plays || 0;
      const distRevenueEur = distRevenueUsd * eurUsdRate;
      const combinedEur = gemaRevenue + distRevenueEur;
      const gemaUplift = distRevenueEur > 0 ? (gemaRevenue / distRevenueEur) * 100 : gemaRevenue > 0 ? Infinity : 0;

      // Play discrepancy
      const maxPlays = Math.max(gemaPlays, distPlays);
      const pctDiff = maxPlays > 0 ? Math.abs(gemaPlays - distPlays) / maxPlays * 100 : 0;
      const moreIn: 'gema' | 'distributor' | 'equal' =
        pctDiff < 5 ? 'equal' : gemaPlays > distPlays ? 'gema' : 'distributor';

      platforms.push({
        platformKey: key,
        platformName: getPlatformName(key),
        platformColor: getPlatformColor(key),
        gema: {
          revenueEur: gemaRevenue,
          plays: gemaPlays,
          perPlay: gemaPlays > 0 ? gemaRevenue / gemaPlays : 0,
        },
        distributor: {
          revenueUsd: distRevenueUsd,
          plays: distPlays,
          perPlayUsd: distPlays > 0 ? distRevenueUsd / distPlays : 0,
        },
        combined: { totalEur: combinedEur, gemaUpliftPct: gemaUplift },
        playDiscrepancy: { pctDiff, moreIn },
      });
    }
  }

  // Sort by combined revenue
  platforms.sort((a, b) => b.combined.totalEur - a.combined.totalEur);

  const gemaTotalEur = gemaEntries.reduce((s, e) => s + e.betrag, 0);
  const distTotalUsd = distEntries.reduce((s, e) => s + e.netAmountUsd, 0);
  const distTotalEur = distTotalUsd * eurUsdRate;
  const combinedTotalEur = gemaTotalEur + distTotalEur;
  const gemaUpliftPct = distTotalEur > 0 ? (gemaTotalEur / distTotalEur) * 100 : 0;

  return {
    gemaTotalEur,
    distTotalUsd,
    distTotalEur,
    combinedTotalEur,
    gemaUpliftPct,
    platforms,
    matchedCount,
    unmatchedGema,
    unmatchedDist,
  };
}

export function computeTimeSeries(
  gemaEntries: GemaRoyaltyEntry[],
  distEntries: DistributorEntry[],
  eurUsdRate: number
): TimeSeriesPoint[] {
  const periodMap = new Map<string, { gema: number; dist: number }>();

  for (const e of gemaEntries) {
    const period = e.geschaeftsjahr || e.verteilungsPeriode || '';
    if (!period) continue;
    const existing = periodMap.get(period) || { gema: 0, dist: 0 };
    existing.gema += e.betrag;
    periodMap.set(period, existing);
  }

  for (const e of distEntries) {
    const period = e.period || '';
    if (!period) continue;
    const existing = periodMap.get(period) || { gema: 0, dist: 0 };
    existing.dist += e.netAmountUsd;
    periodMap.set(period, existing);
  }

  return Array.from(periodMap.entries())
    .map(([period, data]) => ({
      period,
      gemaEur: data.gema,
      distEur: data.dist * eurUsdRate,
      combinedEur: data.gema + data.dist * eurUsdRate,
    }))
    .sort((a, b) => a.period.localeCompare(b.period));
}
