import type { GemaRoyaltyEntry } from '@/types/gema';
import type { DistributorEntry } from '@/types/distributor';
import { aggregateByCategory, aggregateByPlatform, aggregateByWork, totalEarnings, totalPlays } from './aggregations';
import { CATEGORY_INFO } from '@/lib/constants/categories';
import { getPlatformName } from '@/lib/constants/platforms';

export interface Insight {
  id: string;
  type: 'comparison' | 'milestone' | 'fun_fact' | 'discovery';
  emoji: string;
  title: string;
  body: string;
  importance: number;
}

export function generateInsights(entries: GemaRoyaltyEntry[]): Insight[] {
  if (entries.length === 0) return [];

  const insights: Insight[] = [];
  const cats = aggregateByCategory(entries);
  const platforms = aggregateByPlatform(entries);
  const works = aggregateByWork(entries);
  const total = totalEarnings(entries);
  const plays = totalPlays(entries);

  // Top category insight
  const sortedCats = Object.entries(cats).sort(([, a], [, b]) => b.betrag - a.betrag);
  if (sortedCats.length > 0) {
    const [topCat, topVal] = sortedCats[0];
    const pct = total > 0 ? Math.round((topVal.betrag / total) * 100) : 0;
    const info = CATEGORY_INFO[topCat as keyof typeof CATEGORY_INFO];
    insights.push({
      id: 'top_category',
      type: 'discovery',
      emoji: '🏆',
      title: `${info?.label || topCat} dominiert`,
      body: `${info?.label || topCat} macht ${pct}% deiner Gesamteinnahmen aus (${formatEur(topVal.betrag)}).`,
      importance: 9,
    });
  }

  // Platform per-stream rate comparison
  const platformRates = Object.entries(platforms)
    .filter(([, v]) => v.nutzungen > 0)
    .map(([name, v]) => ({
      name: getPlatformName(name),
      rate: v.betrag / v.nutzungen,
      betrag: v.betrag,
      nutzungen: v.nutzungen,
    }))
    .sort((a, b) => b.rate - a.rate);

  if (platformRates.length >= 2) {
    const best = platformRates[0];
    const worst = platformRates[platformRates.length - 1];
    const ratio = worst.rate > 0 ? (best.rate / worst.rate).toFixed(1) : '∞';
    insights.push({
      id: 'rate_comparison',
      type: 'comparison',
      emoji: '💰',
      title: `${best.name} zahlt am meisten pro Play`,
      body: `${best.name} zahlt ${ratio}x mehr pro Play als ${worst.name} (${formatEurCents(best.rate)} vs. ${formatEurCents(worst.rate)} pro Play).`,
      importance: 10,
    });

    // Promotion recommendation: find platform with best rate but not highest total
    const topEarner = [...platformRates].sort((a, b) => b.betrag - a.betrag)[0];
    if (best.name !== topEarner.name) {
      const potentialGain = best.rate * topEarner.nutzungen - topEarner.betrag;
      insights.push({
        id: 'promo_recommendation',
        type: 'discovery',
        emoji: '📣',
        title: 'Promotion-Empfehlung',
        body: `${best.name} zahlt pro Play am meisten, aber ${topEarner.name} hat die meisten Plays. Wenn du ${best.name} stärker bewirbst, könntest du ca. ${formatEur(potentialGain)} mehr verdienen.`,
        importance: 11,
      });
    }

    // Spotify vs. others comparison (if Spotify is in the data)
    const spotify = platformRates.find((p) => p.name === 'Spotify');
    if (spotify && best.name !== 'Spotify') {
      const spotifyRatio = (best.rate / spotify.rate).toFixed(1);
      insights.push({
        id: 'spotify_comparison',
        type: 'comparison',
        emoji: '🎧',
        title: `${best.name} schlägt Spotify`,
        body: `Pro Play verdienst du bei ${best.name} ${spotifyRatio}x mehr als bei Spotify. Es lohnt sich, Fans dorthin zu lenken!`,
        importance: 9.5,
      });
    }
  }

  // Top song
  if (works.length > 0) {
    const top = works[0];
    insights.push({
      id: 'top_song',
      type: 'milestone',
      emoji: '🎵',
      title: `Dein Top-Earner`,
      body: `"${top.werktitel}" ist dein erfolgreichstes Werk mit ${formatEur(top.totalBetrag)} Gesamteinnahmen.`,
      importance: 8,
    });
  }

  // Fun facts
  if (total > 0) {
    const coffees = Math.floor(total / 3.5);
    insights.push({
      id: 'coffee_equivalent',
      type: 'fun_fact',
      emoji: '☕',
      title: 'Kaffee-Äquivalent',
      body: `Deine Einnahmen entsprechen ${coffees.toLocaleString('de-DE')} Tassen Kaffee.`,
      importance: 3,
    });
  }

  if (plays > 0) {
    const daysNonStop = Math.floor((plays * 3.5) / 60 / 24); // avg 3.5 min per song
    if (daysNonStop > 0) {
      insights.push({
        id: 'play_duration',
        type: 'fun_fact',
        emoji: '⏱️',
        title: 'Dauerbeschallung',
        body: `Deine ${plays.toLocaleString('de-DE')} Plays entsprechen ${daysNonStop.toLocaleString('de-DE')} Tagen Musik ohne Pause.`,
        importance: 4,
      });
    }
  }

  // Multi-category discovery
  const categoryCount = Object.keys(cats).length;
  if (categoryCount >= 3) {
    insights.push({
      id: 'diverse_income',
      type: 'discovery',
      emoji: '🌈',
      title: 'Vielfältige Einnahmen',
      body: `Du verdienst in ${categoryCount} verschiedenen Kategorien. Diversifizierung ist top!`,
      importance: 5,
    });
  }

  // Underrated platform
  if (platformRates.length >= 3) {
    const mid = platformRates[Math.floor(platformRates.length / 2)];
    const hasHighRate = mid.rate > platformRates[0].rate * 0.5;
    if (hasHighRate) {
      insights.push({
        id: 'hidden_gem',
        type: 'discovery',
        emoji: '💎',
        title: 'Hidden Gem',
        body: `${mid.name} hat einen überraschend guten Pro-Play-Wert von ${formatEurCents(mid.rate)}.`,
        importance: 6,
      });
    }
  }

  return insights.sort((a, b) => b.importance - a.importance);
}

export function generateComparisonInsights(
  gemaEntries: GemaRoyaltyEntry[],
  distEntries: DistributorEntry[],
  eurUsdRate: number
): Insight[] {
  if (gemaEntries.length === 0 || distEntries.length === 0) return [];

  const insights: Insight[] = [];
  const gemaTotalEur = gemaEntries.reduce((s, e) => s + e.betrag, 0);
  const distTotalUsd = distEntries.reduce((s, e) => s + e.netAmountUsd, 0);
  const distTotalEur = distTotalUsd * eurUsdRate;
  const combinedEur = gemaTotalEur + distTotalEur;

  // GEMA Uplift
  if (distTotalEur > 0) {
    const upliftPct = (gemaTotalEur / distTotalEur) * 100;
    insights.push({
      id: 'gema_uplift',
      type: 'milestone',
      emoji: '🚀',
      title: 'GEMA-Mehrwert',
      body: `Die GEMA zahlt ${upliftPct.toFixed(0)}% obendrauf! Ohne GEMA-Mitgliedschaft würdest du ${formatEur(gemaTotalEur)} weniger verdienen.`,
      importance: 12,
    });
  }

  // Combined total
  if (combinedEur > 0) {
    insights.push({
      id: 'combined_earnings',
      type: 'discovery',
      emoji: '💎',
      title: 'Gesamtbild',
      body: `Dein kombiniertes Einkommen: ${formatEur(combinedEur)} (GEMA ${formatEur(gemaTotalEur)} + Vertrieb ${formatEur(distTotalEur)}).`,
      importance: 11,
    });
  }

  // Combined per-play rate
  const gemaPlays = gemaEntries.reduce((s, e) => s + e.nutzungsanzahl, 0);
  const distPlays = distEntries.reduce((s, e) => s + e.quantity, 0);
  if (gemaPlays > 0 && distPlays > 0) {
    const combinedRate = (gemaTotalEur + distTotalEur) / Math.max(gemaPlays, distPlays);
    const distOnlyRate = distTotalEur / distPlays;
    if (distOnlyRate > 0) {
      const rateUplift = ((combinedRate - distOnlyRate) / distOnlyRate) * 100;
      insights.push({
        id: 'combined_rate',
        type: 'comparison',
        emoji: '📈',
        title: 'Mehr pro Play',
        body: `Mit GEMA verdienst du ${rateUplift.toFixed(0)}% mehr pro Play (${formatEurCents(combinedRate)} statt ${formatEurCents(distOnlyRate)}).`,
        importance: 10,
      });
    }
  }

  return insights.sort((a, b) => b.importance - a.importance);
}

function formatEur(amount: number): string {
  return amount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
}

function formatEurCents(amount: number): string {
  if (amount < 0.01) {
    return `${(amount * 1000).toFixed(2)} Ct/1000`;
  }
  return `${amount.toFixed(4)} EUR`;
}
