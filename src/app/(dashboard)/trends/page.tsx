'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Upload } from 'lucide-react';
import { TrendLine } from '@/components/charts/trend-line';
import { useRoyaltyStore } from '@/lib/store/royalty-store';
import { useAvailablePeriods, useFilteredEntries, useCategoryBreakdown } from '@/lib/hooks/use-royalty-data';
import { formatEur } from '@/lib/utils/format';
import { CATEGORY_INFO } from '@/lib/constants/categories';
import type { CategoryGroup } from '@/types/gema';
import Link from 'next/link';

export default function TrendsPage() {
  const entries = useRoyaltyStore((s) => s.entries);
  const periods = useAvailablePeriods();
  const filtered = useFilteredEntries();
  const categories = useCategoryBreakdown();

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <TrendingUp className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold">Noch keine Daten</h2>
        <p className="text-muted-foreground text-sm">Lade eine Abrechnung hoch, um Trends zu sehen.</p>
      </div>
    );
  }

  if (periods.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <TrendingUp className="w-12 h-12 text-muted-foreground mb-4 mx-auto" />
          <h2 className="text-lg font-semibold">Mehr Daten benötigt</h2>
          <p className="text-muted-foreground text-sm mt-1 max-w-md">
            Lade Abrechnungen aus mindestens 2 verschiedenen Perioden hoch, um Trends zu vergleichen.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Aktuell: {periods.length} Periode{periods.length !== 1 ? 'n' : ''}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-primary hover:underline text-sm mt-4"
          >
            <Upload className="w-4 h-4" /> Weitere Abrechnung hochladen
          </Link>
        </motion.div>
      </div>
    );
  }

  // Calculate growth
  const periodTotals = periods.map((p) => ({
    period: p,
    total: entries
      .filter((e) => e.geschaeftsjahr === p)
      .reduce((sum, e) => sum + e.betrag, 0),
  }));

  const latestTwo = periodTotals.slice(-2);
  const growth = latestTwo.length === 2 && latestTwo[0].total > 0
    ? ((latestTwo[1].total - latestTwo[0].total) / latestTwo[0].total) * 100
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl tracking-tight">Trends</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Vergleiche deine Einnahmen über verschiedene Perioden
        </p>
      </div>

      {/* Growth indicator */}
      {growth !== null && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <p className="text-sm text-muted-foreground">Wachstum</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-3xl font-bold ${growth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {growth >= 0 ? '+' : ''}{growth.toFixed(1)}%
            </span>
            <span className="text-sm text-muted-foreground">
              von {latestTwo[0].period} zu {latestTwo[1].period}
            </span>
          </div>
        </motion.div>
      )}

      {/* Trend Line */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card border border-border rounded-xl p-6"
      >
        <h2 className="text-lg font-semibold mb-4">Einnahmen über Zeit</h2>
        <TrendLine entries={filtered} />
      </motion.div>

      {/* Category breakdown per period */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card border border-border rounded-xl p-6"
      >
        <h2 className="text-lg font-semibold mb-4">Kategorien pro Periode</h2>
        <div className="space-y-4">
          {periods.map((period) => {
            const periodEntries = entries.filter((e) => e.geschaeftsjahr === period);
            const total = periodEntries.reduce((sum, e) => sum + e.betrag, 0);
            const catMap: Record<string, number> = {};
            for (const e of periodEntries) {
              catMap[e.categoryGroup] = (catMap[e.categoryGroup] || 0) + e.betrag;
            }
            const cats = Object.entries(catMap).sort(([, a], [, b]) => b - a);

            return (
              <div key={period} className="border-b border-border/50 pb-3 last:border-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold">{period}</span>
                  <span className="text-sm font-bold">{formatEur(total)}</span>
                </div>
                <div className="flex h-3 rounded-full overflow-hidden bg-muted">
                  {cats.map(([cat, val]) => {
                    const info = CATEGORY_INFO[cat as CategoryGroup];
                    const pct = total > 0 ? (val / total) * 100 : 0;
                    return (
                      <div
                        key={cat}
                        className="h-full first:rounded-l-full last:rounded-r-full"
                        style={{ width: `${pct}%`, backgroundColor: info?.color || '#666' }}
                        title={`${info?.label || cat}: ${formatEur(val)} (${pct.toFixed(1)}%)`}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
