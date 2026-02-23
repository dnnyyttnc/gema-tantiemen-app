'use client';

import { useMemo } from 'react';
import { useRoyaltyStore } from '@/lib/store/royalty-store';
import { computeComparison, computeTimeSeries } from '@/lib/analysis/comparison';
import type { ComparisonSummary, TimeSeriesPoint } from '@/lib/analysis/comparison';
import { aggregateDistByRetailer, aggregateDistByCountry, totalDistUsd, totalDistPlays } from '@/lib/analysis/distributor-aggregations';

export function useHasBothSources(): boolean {
  const gemaCount = useRoyaltyStore((s) => s.entries.length);
  const distCount = useRoyaltyStore((s) => s.distributorEntries.length);
  return gemaCount > 0 && distCount > 0;
}

export function useHasDistributorData(): boolean {
  return useRoyaltyStore((s) => s.distributorEntries.length) > 0;
}

export function useComparisonData(): ComparisonSummary | null {
  const entries = useRoyaltyStore((s) => s.entries);
  const distEntries = useRoyaltyStore((s) => s.distributorEntries);
  const eurUsdRate = useRoyaltyStore((s) => s.eurUsdRate);

  return useMemo(() => {
    if (entries.length === 0 || distEntries.length === 0) return null;
    return computeComparison(entries, distEntries, eurUsdRate);
  }, [entries, distEntries, eurUsdRate]);
}

export function useComparisonTimeSeries(): TimeSeriesPoint[] {
  const entries = useRoyaltyStore((s) => s.entries);
  const distEntries = useRoyaltyStore((s) => s.distributorEntries);
  const eurUsdRate = useRoyaltyStore((s) => s.eurUsdRate);

  return useMemo(() => {
    if (entries.length === 0 && distEntries.length === 0) return [];
    return computeTimeSeries(entries, distEntries, eurUsdRate);
  }, [entries, distEntries, eurUsdRate]);
}

export function useDistributorStats() {
  const distEntries = useRoyaltyStore((s) => s.distributorEntries);

  return useMemo(() => {
    if (distEntries.length === 0) return null;
    return {
      totalUsd: totalDistUsd(distEntries),
      totalPlays: totalDistPlays(distEntries),
      byRetailer: aggregateDistByRetailer(distEntries),
      byCountry: aggregateDistByCountry(distEntries),
      entryCount: distEntries.length,
    };
  }, [distEntries]);
}
