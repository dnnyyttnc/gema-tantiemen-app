'use client';

import { useMemo } from 'react';
import { useRoyaltyStore } from '@/lib/store/royalty-store';
import { useUIStore } from '@/lib/store/ui-store';
import {
  aggregateByCategory,
  aggregateByPlatform,
  aggregateByWork,
  totalEarnings,
  totalPlays,
  uniqueWorks,
  uniquePlatforms,
  topCategory,
} from '@/lib/analysis/aggregations';

export function useFilteredEntries() {
  const entries = useRoyaltyStore((s) => s.entries);
  const selectedPeriod = useUIStore((s) => s.selectedPeriod);
  const selectedCategory = useUIStore((s) => s.selectedCategory);

  return useMemo(() => {
    let filtered = entries;
    if (selectedPeriod) {
      filtered = filtered.filter(
        (e) => e.verteilungsPeriode === selectedPeriod || e.geschaeftsjahr === selectedPeriod
      );
    }
    if (selectedCategory) {
      filtered = filtered.filter((e) => e.categoryGroup === selectedCategory);
    }
    return filtered;
  }, [entries, selectedPeriod, selectedCategory]);
}

export function useCategoryBreakdown() {
  const filtered = useFilteredEntries();
  return useMemo(() => aggregateByCategory(filtered), [filtered]);
}

export function usePlatformBreakdown() {
  const filtered = useFilteredEntries();
  return useMemo(() => aggregateByPlatform(filtered), [filtered]);
}

export function useSongRankings() {
  const filtered = useFilteredEntries();
  return useMemo(() => aggregateByWork(filtered), [filtered]);
}

export function useStats() {
  const filtered = useFilteredEntries();
  return useMemo(
    () => ({
      totalEarnings: totalEarnings(filtered),
      totalPlays: totalPlays(filtered),
      uniqueWorks: uniqueWorks(filtered),
      uniquePlatforms: uniquePlatforms(filtered),
      topCategory: topCategory(filtered),
      entryCount: filtered.length,
    }),
    [filtered]
  );
}

export function useAvailablePeriods() {
  const entries = useRoyaltyStore((s) => s.entries);
  return useMemo(() => {
    const periods = new Set<string>();
    for (const e of entries) {
      if (e.geschaeftsjahr) periods.add(e.geschaeftsjahr);
    }
    return Array.from(periods).sort();
  }, [entries]);
}
