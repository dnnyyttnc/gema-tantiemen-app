'use client';

import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { formatPerStreamRate, formatPerStreamRateUsd } from '@/lib/utils/format';
import type { PlatformComparison } from '@/lib/analysis/comparison';

interface RateComparisonTableProps {
  platforms: PlatformComparison[];
  eurUsdRate: number;
}

export function RateComparisonTable({ platforms, eurUsdRate }: RateComparisonTableProps) {
  // Only show platforms where at least one source has data
  const rows = platforms.filter(
    (p) => (p.gema.plays > 0 || p.distributor.plays > 0) && (p.gema.revenueEur > 0 || p.distributor.revenueUsd > 0)
  );

  if (rows.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="overflow-x-auto"
    >
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-xs text-muted-foreground">
            <th className="text-left py-3 px-2 font-medium">Plattform</th>
            <th className="text-right py-3 px-2 font-medium">Vertrieb $/Play</th>
            <th className="text-right py-3 px-2 font-medium">GEMA /Play</th>
            <th className="text-right py-3 px-2 font-medium">Kombiniert</th>
            <th className="text-right py-3 px-2 font-medium">GEMA Uplift</th>
            <th className="text-center py-3 px-2 font-medium">Plays</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p, i) => {
            const combinedPerPlay =
              p.gema.perPlay + p.distributor.perPlayUsd * eurUsdRate;
            const isHighDiscrepancy = p.playDiscrepancy.pctDiff > 20;

            return (
              <motion.tr
                key={p.platformKey}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="border-b border-border/50 hover:bg-accent/30 transition-colors"
              >
                <td className="py-3 px-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: p.platformColor }}
                    />
                    <span className="font-medium">{p.platformName}</span>
                  </div>
                </td>
                <td className="text-right py-3 px-2 font-mono text-xs">
                  {p.distributor.plays > 0 ? formatPerStreamRateUsd(p.distributor.perPlayUsd) : '–'}
                </td>
                <td className="text-right py-3 px-2 font-mono text-xs text-primary">
                  {p.gema.plays > 0 ? formatPerStreamRate(p.gema.perPlay) : '–'}
                </td>
                <td className="text-right py-3 px-2 font-mono text-xs font-semibold">
                  {combinedPerPlay > 0 ? formatPerStreamRate(combinedPerPlay) : '–'}
                </td>
                <td className="text-right py-3 px-2">
                  {p.combined.gemaUpliftPct > 0 && p.combined.gemaUpliftPct !== Infinity ? (
                    <span className="text-xs font-semibold text-emerald-400">
                      +{p.combined.gemaUpliftPct.toFixed(0)}%
                    </span>
                  ) : p.gema.revenueEur > 0 && p.distributor.revenueUsd === 0 ? (
                    <span className="text-xs text-muted-foreground">nur GEMA</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">–</span>
                  )}
                </td>
                <td className="text-center py-3 px-2">
                  <div className="flex items-center justify-center gap-1">
                    {isHighDiscrepancy && (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    <div className="text-xs text-muted-foreground">
                      {p.distributor.plays > 0 && (
                        <span>{p.distributor.plays.toLocaleString('de-DE')}</span>
                      )}
                      {p.distributor.plays > 0 && p.gema.plays > 0 && ' / '}
                      {p.gema.plays > 0 && (
                        <span className="text-primary">{p.gema.plays.toLocaleString('de-DE')}</span>
                      )}
                    </div>
                  </div>
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>

      {/* Legend for plays column */}
      <div className="flex items-center gap-4 mt-3 text-[10px] text-muted-foreground">
        <span>Plays: Vertrieb / <span className="text-primary">GEMA</span></span>
        <span className="flex items-center gap-1">
          <AlertTriangle className="w-3 h-3 text-amber-400" /> {'>'}20% Abweichung
        </span>
      </div>
    </motion.div>
  );
}
