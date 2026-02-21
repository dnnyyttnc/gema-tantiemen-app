import type { GemaRoyaltyEntry, WorkSummary, CategoryGroup } from '@/types/gema';

export function aggregateByCategory(entries: GemaRoyaltyEntry[]): Record<string, { betrag: number; nutzungen: number; count: number }> {
  const result: Record<string, { betrag: number; nutzungen: number; count: number }> = {};
  for (const entry of entries) {
    const key = entry.categoryGroup;
    if (!result[key]) result[key] = { betrag: 0, nutzungen: 0, count: 0 };
    result[key].betrag += entry.betrag;
    result[key].nutzungen += entry.nutzungsanzahl;
    result[key].count += 1;
  }
  return result;
}

export function aggregateByPlatform(entries: GemaRoyaltyEntry[]): Record<string, { betrag: number; nutzungen: number; count: number }> {
  const result: Record<string, { betrag: number; nutzungen: number; count: number }> = {};
  for (const entry of entries) {
    const key = entry.nutzer || 'Unbekannt';
    if (!result[key]) result[key] = { betrag: 0, nutzungen: 0, count: 0 };
    result[key].betrag += entry.betrag;
    result[key].nutzungen += entry.nutzungsanzahl;
    result[key].count += 1;
  }
  return result;
}

export function aggregateByWork(entries: GemaRoyaltyEntry[]): WorkSummary[] {
  const workMap = new Map<string, {
    werknummer: string;
    werktitel: string;
    totalBetrag: number;
    totalNutzungen: number;
    byCategory: Record<string, { betrag: number; nutzungen: number }>;
    byPlatform: Record<string, { betrag: number; nutzungen: number }>;
  }>();

  for (const entry of entries) {
    const key = entry.werknummer || entry.werktitel;
    if (!workMap.has(key)) {
      workMap.set(key, {
        werknummer: entry.werknummer,
        werktitel: entry.werktitel,
        totalBetrag: 0,
        totalNutzungen: 0,
        byCategory: {},
        byPlatform: {},
      });
    }
    const work = workMap.get(key)!;
    work.totalBetrag += entry.betrag;
    work.totalNutzungen += entry.nutzungsanzahl;

    const cat = entry.categoryGroup;
    if (!work.byCategory[cat]) work.byCategory[cat] = { betrag: 0, nutzungen: 0 };
    work.byCategory[cat].betrag += entry.betrag;
    work.byCategory[cat].nutzungen += entry.nutzungsanzahl;

    const plat = entry.nutzer || 'Unbekannt';
    if (!work.byPlatform[plat]) work.byPlatform[plat] = { betrag: 0, nutzungen: 0 };
    work.byPlatform[plat].betrag += entry.betrag;
    work.byPlatform[plat].nutzungen += entry.nutzungsanzahl;
  }

  return Array.from(workMap.values())
    .sort((a, b) => b.totalBetrag - a.totalBetrag)
    .map((work, index) => ({
      ...work,
      rank: index + 1,
      byCategory: work.byCategory as Partial<Record<CategoryGroup, { betrag: number; nutzungen: number }>>,
    }));
}

export function totalEarnings(entries: GemaRoyaltyEntry[]): number {
  return entries.reduce((sum, e) => sum + e.betrag, 0);
}

export function totalPlays(entries: GemaRoyaltyEntry[]): number {
  return entries.reduce((sum, e) => sum + e.nutzungsanzahl, 0);
}

export function uniqueWorks(entries: GemaRoyaltyEntry[]): number {
  return new Set(entries.map((e) => e.werknummer || e.werktitel)).size;
}

export function uniquePlatforms(entries: GemaRoyaltyEntry[]): string[] {
  return [...new Set(entries.map((e) => e.nutzer).filter(Boolean))];
}

export function topCategory(entries: GemaRoyaltyEntry[]): CategoryGroup | null {
  const cats = aggregateByCategory(entries);
  let max: { key: string; value: number } | null = null;
  for (const [key, val] of Object.entries(cats)) {
    if (!max || val.betrag > max.value) {
      max = { key, value: val.betrag };
    }
  }
  return (max?.key as CategoryGroup) || null;
}
