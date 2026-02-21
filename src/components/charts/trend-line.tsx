'use client';

import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { motion } from 'framer-motion';
import { formatEur } from '@/lib/utils/format';
import type { GemaRoyaltyEntry } from '@/types/gema';

interface TrendLineProps {
  entries: GemaRoyaltyEntry[];
}

export function TrendLine({ entries }: TrendLineProps) {
  // Aggregate by period
  const periodMap = new Map<string, number>();
  for (const e of entries) {
    const period = e.geschaeftsjahr || e.verteilungsPeriode;
    if (!period) continue;
    periodMap.set(period, (periodMap.get(period) || 0) + e.betrag);
  }

  const data = Array.from(periodMap.entries())
    .map(([period, betrag]) => ({ period, betrag }))
    .sort((a, b) => a.period.localeCompare(b.period));

  if (data.length < 2) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="w-full h-64"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="period"
            tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${(v / 1).toFixed(0)}`}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-xl text-sm">
                    <p className="font-semibold">{label}</p>
                    <p className="text-primary">{formatEur(payload[0].value as number)}</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Line
            type="monotone"
            dataKey="betrag"
            stroke="var(--primary)"
            strokeWidth={2.5}
            dot={{ fill: 'var(--primary)', r: 4 }}
            activeDot={{ r: 6, strokeWidth: 2 }}
            animationDuration={1200}
          />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
