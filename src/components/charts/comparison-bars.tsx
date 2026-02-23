'use client';

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { formatEur } from '@/lib/utils/format';
import type { PlatformComparison } from '@/lib/analysis/comparison';

interface ComparisonBarsProps {
  platforms: PlatformComparison[];
  eurUsdRate: number;
  maxItems?: number;
}

export function ComparisonBars({ platforms, eurUsdRate, maxItems = 10 }: ComparisonBarsProps) {
  const chartData = platforms
    .filter((p) => p.gema.revenueEur > 0 || p.distributor.revenueUsd > 0)
    .slice(0, maxItems)
    .map((p) => ({
      name: p.platformName,
      gema: p.gema.revenueEur,
      vertrieb: p.distributor.revenueUsd * eurUsdRate,
      color: p.platformColor,
    }));

  if (chartData.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="w-full"
    >
      <ResponsiveContainer width="100%" height={chartData.length * 56 + 40}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20, top: 10, bottom: 10 }}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            width={110}
            tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-xl text-sm">
                    <p className="font-semibold mb-1">{label}</p>
                    {payload.map((p) => (
                      <p key={p.dataKey as string} className="text-muted-foreground">
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-sm mr-1.5"
                          style={{ backgroundColor: p.color as string }}
                        />
                        {p.name}: {formatEur(p.value as number)}
                      </p>
                    ))}
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            formatter={(value: string) => <span className="text-muted-foreground text-xs">{value}</span>}
          />
          <Bar
            dataKey="gema"
            name="GEMA"
            fill="oklch(0.7 0.15 280)"
            radius={[0, 4, 4, 0]}
            animationDuration={800}
          />
          <Bar
            dataKey="vertrieb"
            name="Vertrieb"
            fill="oklch(0.7 0.12 180)"
            radius={[0, 4, 4, 0]}
            animationDuration={800}
          />
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
