'use client';

import { motion } from 'framer-motion';
import { usePlatformBreakdown, useFilteredEntries } from '@/lib/hooks/use-royalty-data';
import { PlatformBars } from '@/components/charts/platform-bars';
import { getPlatformName, getPlatformColor } from '@/lib/constants/platforms';
import { formatEur, formatNumber, formatPerStreamRate } from '@/lib/utils/format';
import { Layers } from 'lucide-react';

export default function PlatformsPage() {
  const platforms = usePlatformBreakdown();
  const entries = useFilteredEntries();

  const platformList = Object.entries(platforms)
    .map(([name, val]) => ({
      name: getPlatformName(name),
      originalName: name,
      color: getPlatformColor(name),
      betrag: val.betrag,
      nutzungen: val.nutzungen,
      count: val.count,
      rate: val.nutzungen > 0 ? val.betrag / val.nutzungen : 0,
    }))
    .filter((p) => p.betrag > 0)
    .sort((a, b) => b.betrag - a.betrag);

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Layers className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold">Noch keine Daten</h2>
        <p className="text-muted-foreground text-sm">Lade eine Abrechnung hoch, um Plattformen zu vergleichen.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Plattformen</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Vergleiche Einnahmen und Pro-Play-Raten über alle Plattformen
        </p>
      </div>

      {/* Platform Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {platformList.slice(0, 8).map((p, i) => (
          <motion.div
            key={p.originalName}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glow-hover bg-card border border-border rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: p.color }}
              />
              <p className="text-sm font-semibold truncate">{p.name}</p>
            </div>
            <p className="text-xl font-bold">{formatEur(p.betrag)}</p>
            <div className="mt-2 space-y-1">
              {p.nutzungen > 0 && (
                <p className="text-xs text-muted-foreground">
                  {formatNumber(p.nutzungen)} Plays
                </p>
              )}
              {p.rate > 0 && (
                <p className="text-xs text-primary font-medium">
                  {formatPerStreamRate(p.rate)} / Play
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Revenue Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card border border-border rounded-xl p-6"
      >
        <h2 className="text-lg font-semibold mb-4">Einnahmen-Vergleich</h2>
        <PlatformBars data={platforms} maxItems={12} />
      </motion.div>

      {/* Per-Stream Rate Table */}
      {platformList.some((p) => p.rate > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <h2 className="text-lg font-semibold mb-4">Pro-Play-Rate</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Wie viel zahlt jede Plattform pro Play? Sortiert nach Rate.
          </p>
          <div className="space-y-2">
            {platformList
              .filter((p) => p.rate > 0)
              .sort((a, b) => b.rate - a.rate)
              .map((p, i) => {
                const maxRate = platformList.reduce((max, pl) => Math.max(max, pl.rate), 0);
                const barWidth = maxRate > 0 ? (p.rate / maxRate) * 100 : 0;
                return (
                  <div key={p.originalName} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-6 text-right">{i + 1}</span>
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: p.color }}
                    />
                    <span className="text-sm font-medium w-32 truncate">{p.name}</span>
                    <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${barWidth}%` }}
                        transition={{ delay: 0.5 + i * 0.05, duration: 0.6 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: p.color }}
                      />
                    </div>
                    <span className="text-xs font-mono text-right w-24 shrink-0">
                      {formatPerStreamRate(p.rate)}
                    </span>
                  </div>
                );
              })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
