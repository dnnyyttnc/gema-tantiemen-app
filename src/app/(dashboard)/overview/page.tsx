'use client';

import { Euro, Play, Music, Crown, TrendingUp, ArrowUpRight, GitCompareArrows } from 'lucide-react';
import { StatCard } from '@/components/cards/stat-card';
import { RevenueDonut } from '@/components/charts/revenue-donut';
import { PlatformBars } from '@/components/charts/platform-bars';
import { useStats, useCategoryBreakdown, usePlatformBreakdown, useSongRankings } from '@/lib/hooks/use-royalty-data';
import { useRoyaltyStore } from '@/lib/store/royalty-store';
import { useHasBothSources } from '@/lib/hooks/use-comparison-data';
import { formatEur, formatNumber, formatPerStreamRate } from '@/lib/utils/format';
import { CATEGORY_INFO } from '@/lib/constants/categories';
import { getPlatformName, getPlatformColor } from '@/lib/constants/platforms';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function OverviewPage() {
  const router = useRouter();
  const stats = useStats();
  const categories = useCategoryBreakdown();
  const platforms = usePlatformBreakdown();
  const songs = useSongRankings();
  const entries = useRoyaltyStore((s) => s.entries);
  const hasBothSources = useHasBothSources();

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Music className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold">Noch keine Daten</h2>
        <p className="text-muted-foreground text-sm mt-1 mb-4">
          Lade deine erste GEMA-Abrechnung hoch, um loszulegen.
        </p>
        <button
          onClick={() => router.push('/')}
          className="text-primary hover:underline text-sm font-medium"
        >
          Zur Upload-Seite
        </button>
      </div>
    );
  }

  const topCat = stats.topCategory;
  const topCatLabel = topCat ? (CATEGORY_INFO[topCat]?.label || topCat) : '–';

  // Per-play rate rankings
  const platformRates = Object.entries(platforms)
    .filter(([, v]) => v.nutzungen > 0)
    .map(([name, v]) => ({
      name: getPlatformName(name),
      originalName: name,
      color: getPlatformColor(name),
      rate: v.betrag / v.nutzungen,
      betrag: v.betrag,
      nutzungen: v.nutzungen,
    }))
    .sort((a, b) => b.rate - a.rate);

  const bestRate = platformRates[0];
  const worstRate = platformRates.length > 1 ? platformRates[platformRates.length - 1] : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl tracking-tight">Übersicht</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Deine GEMA-Tantiemen im Überblick
        </p>
      </div>

      {/* Comparison banner */}
      {hasBothSources && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link
            href="/vergleich"
            className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-xl px-5 py-3 hover:bg-primary/15 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <GitCompareArrows className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">GEMA + Distributor-Daten verfügbar</span>
            </div>
            <span className="text-xs text-primary flex items-center gap-1 group-hover:underline">
              Zum Vergleich <ArrowUpRight className="w-3 h-3" />
            </span>
          </Link>
        </motion.div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Gesamteinnahmen"
          value={stats.totalEarnings}
          formatter={formatEur}
          icon={Euro}
          gradient="bg-gradient-to-br from-emerald-500 to-emerald-700"
          delay={0}
        />
        <StatCard
          label="Gesamt-Plays"
          value={stats.totalPlays}
          formatter={formatNumber}
          icon={Play}
          gradient="bg-gradient-to-br from-blue-500 to-blue-700"
          delay={0.1}
        />
        <StatCard
          label="Werke"
          value={stats.uniqueWorks}
          icon={Music}
          gradient="bg-gradient-to-br from-amber-500 to-amber-700"
          delay={0.2}
        />
        <StatCard
          label="Top-Kategorie"
          value={0}
          formatter={() => topCatLabel}
          icon={Crown}
          gradient="bg-gradient-to-br from-orange-500 to-orange-700"
          delay={0.3}
        />
      </div>

      {/* Pro-Play Revenue Highlight */}
      {bestRate && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card border border-border rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Verdienst pro Play</h2>
            </div>
            <Link href="/platforms" className="text-xs text-primary hover:underline flex items-center gap-1">
              Details <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {platformRates.slice(0, 6).map((p, i) => {
              const maxRate = platformRates[0].rate;
              const barWidth = maxRate > 0 ? (p.rate / maxRate) * 100 : 0;
              return (
                <div key={p.originalName} className="flex items-center gap-3 py-1.5">
                  <span className="text-xs text-muted-foreground w-4 text-right font-mono">{i + 1}</span>
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-sm font-medium truncate">{p.name}</span>
                      <span className="text-xs font-mono text-primary ml-2 shrink-0">{formatPerStreamRate(p.rate)}</span>
                    </div>
                    <div className="bg-muted rounded-full h-1.5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${barWidth}%` }}
                        transition={{ delay: 0.3 + i * 0.04, duration: 0.5 }}
                        className="h-full rounded-full bg-primary/70"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {bestRate && worstRate && (
            <p className="text-xs text-muted-foreground mt-4 border-t border-border pt-3">
              <span className="text-primary font-medium">{bestRate.name}</span> zahlt{' '}
              <span className="text-primary font-medium">{(bestRate.rate / worstRate.rate).toFixed(1)}x</span>{' '}
              mehr pro Play als <span className="font-medium">{worstRate.name}</span>.
              {bestRate.name !== 'Spotify' && (
                <> Tipp: Mehr {bestRate.name} promoten!</>
              )}
            </p>
          )}
        </motion.div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Donut */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <h2 className="text-lg font-semibold mb-4">Einnahmen nach Kategorie</h2>
          <RevenueDonut data={categories} totalEarnings={stats.totalEarnings} />
        </motion.div>

        {/* Platform Quick Compare */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Top Plattformen</h2>
            <Link href="/platforms" className="text-xs text-primary hover:underline">
              Alle anzeigen
            </Link>
          </div>
          <PlatformBars data={platforms} maxItems={6} />
        </motion.div>
      </div>

      {/* Top Songs Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-card border border-border rounded-xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Top Songs</h2>
          <Link href="/leaderboard" className="text-xs text-primary hover:underline">
            Rangliste anzeigen
          </Link>
        </div>
        <div className="space-y-3">
          {songs.slice(0, 5).map((song, i) => (
            <div
              key={song.werknummer}
              className="flex items-center gap-4 py-2 border-b border-border/50 last:border-0"
            >
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-sm font-bold shrink-0">
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{song.werktitel}</p>
                <p className="text-xs text-muted-foreground">{song.werknummer}</p>
              </div>
              <p className="text-sm font-semibold text-right shrink-0">
                {formatEur(song.totalBetrag)}
              </p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
