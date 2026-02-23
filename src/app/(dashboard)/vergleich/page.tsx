'use client';

import { motion } from 'framer-motion';
import { GitCompareArrows, Upload, Euro, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';
import { StatCard } from '@/components/cards/stat-card';
import { ComparisonBars } from '@/components/charts/comparison-bars';
import { RevenueSplitDonut } from '@/components/charts/revenue-split-donut';
import { RateComparisonTable } from '@/components/charts/rate-comparison-table';
import { CombinedTrend } from '@/components/charts/combined-trend';
import { useComparisonData, useComparisonTimeSeries, useHasDistributorData } from '@/lib/hooks/use-comparison-data';
import { useRoyaltyStore } from '@/lib/store/royalty-store';
import { formatEur, formatUsd, formatPercent } from '@/lib/utils/format';
import Link from 'next/link';

export default function VergleichPage() {
  const gemaEntries = useRoyaltyStore((s) => s.entries);
  const hasDistributor = useHasDistributorData();
  const comparison = useComparisonData();
  const timeSeries = useComparisonTimeSeries();
  const eurUsdRate = useRoyaltyStore((s) => s.eurUsdRate);

  // Empty state: no data at all
  if (gemaEntries.length === 0 && !hasDistributor) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <GitCompareArrows className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold">Noch keine Daten</h2>
        <p className="text-muted-foreground text-sm mt-1 max-w-md">
          Lade deine GEMA-Abrechnung und deinen Distributor-Report hoch, um beide Einkommensquellen zu vergleichen.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-primary hover:underline text-sm mt-4"
        >
          <Upload className="w-4 h-4" /> Dateien hochladen
        </Link>
      </div>
    );
  }

  // Only GEMA data
  if (gemaEntries.length > 0 && !hasDistributor) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl tracking-tight">Vergleich</h1>
          <p className="text-muted-foreground text-sm mt-1">GEMA vs. Vertrieb</p>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl p-8 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <DollarSign className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-lg font-semibold">Distributor-Report fehlt</h2>
          <p className="text-muted-foreground text-sm mt-2 max-w-md mx-auto">
            Deine GEMA-Daten sind geladen. Importiere jetzt deinen Distributor-Report (XLSX von DistroKid, TuneCore, CD Baby etc.),
            um zu sehen, wie viel die GEMA obendrauf zahlt.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-primary hover:underline text-sm mt-4 font-medium"
          >
            <Upload className="w-4 h-4" /> Distributor-Report hochladen
          </Link>
        </motion.div>
      </div>
    );
  }

  // Only distributor data
  if (gemaEntries.length === 0 && hasDistributor) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl tracking-tight">Vergleich</h1>
          <p className="text-muted-foreground text-sm mt-1">GEMA vs. Vertrieb</p>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl p-8 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Euro className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-lg font-semibold">GEMA-Abrechnung fehlt</h2>
          <p className="text-muted-foreground text-sm mt-2 max-w-md mx-auto">
            Dein Distributor-Report ist geladen. Importiere jetzt deine GEMA-Abrechnung (CSV),
            um den GEMA-Mehrwert zu berechnen.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-primary hover:underline text-sm mt-4 font-medium"
          >
            <Upload className="w-4 h-4" /> GEMA-Abrechnung hochladen
          </Link>
        </motion.div>
      </div>
    );
  }

  // Both sources available
  if (!comparison) return null;

  const hasPlayDiscrepancy = comparison.platforms.some((p) => p.playDiscrepancy.pctDiff > 20);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl tracking-tight">Vergleich: GEMA vs. Vertrieb</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Deine beiden Einkommensquellen im direkten Vergleich
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Kombiniert"
          value={comparison.combinedTotalEur}
          formatter={formatEur}
          icon={Euro}
          gradient="bg-gradient-to-br from-emerald-500 to-emerald-700"
          delay={0}
        />
        <StatCard
          label="GEMA-Anteil"
          value={comparison.gemaTotalEur}
          formatter={formatEur}
          icon={Euro}
          gradient="bg-gradient-to-br from-violet-500 to-violet-700"
          delay={0.1}
        />
        <StatCard
          label="Vertrieb"
          value={comparison.distTotalUsd}
          formatter={formatUsd}
          icon={DollarSign}
          gradient="bg-gradient-to-br from-teal-500 to-teal-700"
          delay={0.2}
        />
        <StatCard
          label="GEMA-Uplift"
          value={comparison.gemaUpliftPct / 100}
          formatter={formatPercent}
          icon={TrendingUp}
          gradient="bg-gradient-to-br from-amber-500 to-amber-700"
          delay={0.3}
        />
      </div>

      {/* Play count discrepancy alert */}
      {hasPlayDiscrepancy && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-300">Play-Zahlen weichen ab</p>
            <p className="text-xs text-muted-foreground mt-1">
              Bei einigen Plattformen unterscheiden sich die Play-Zahlen zwischen GEMA und Vertrieb um mehr als 20%.
              Das kann an unterschiedlichen Abrechnungszeiträumen liegen — oder auf fehlende Meldungen hinweisen.
            </p>
          </div>
        </motion.div>
      )}

      {/* Revenue Split + Comparison Bars */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <h2 className="text-lg font-semibold mb-4">Einkommensverteilung</h2>
          <RevenueSplitDonut
            gemaEur={comparison.gemaTotalEur}
            distEur={comparison.distTotalEur}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <h2 className="text-lg font-semibold mb-4">Plattform-Vergleich</h2>
          <ComparisonBars
            platforms={comparison.platforms}
            eurUsdRate={eurUsdRate}
          />
        </motion.div>
      </div>

      {/* Rate comparison table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-card border border-border rounded-xl p-6"
      >
        <h2 className="text-lg font-semibold mb-4">Pro-Play-Vergleich</h2>
        <RateComparisonTable platforms={comparison.platforms} eurUsdRate={eurUsdRate} />
      </motion.div>

      {/* Combined timeline */}
      {timeSeries.length >= 2 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <h2 className="text-lg font-semibold mb-4">Einnahmen über Zeit</h2>
          <CombinedTrend data={timeSeries} />
        </motion.div>
      )}

      {/* Info footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-xs text-muted-foreground text-center pb-4"
      >
        EUR/USD-Kurs: {eurUsdRate.toFixed(4)} &middot;{' '}
        <Link href="/settings" className="text-primary hover:underline">
          In Einstellungen ändern
        </Link>
      </motion.div>
    </div>
  );
}
