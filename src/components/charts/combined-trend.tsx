'use client';

import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { formatEur } from '@/lib/utils/format';
import type { TimeSeriesPoint } from '@/lib/analysis/comparison';

interface CombinedTrendProps {
  data: TimeSeriesPoint[];
}

const GEMA_COLOR = 'oklch(0.7 0.15 280)';
const DIST_COLOR = 'oklch(0.7 0.12 180)';

export function CombinedTrend({ data }: CombinedTrendProps) {
  if (data.length < 2) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="w-full h-72"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="gemaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={GEMA_COLOR} stopOpacity={0.4} />
              <stop offset="100%" stopColor={GEMA_COLOR} stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="distGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={DIST_COLOR} stopOpacity={0.4} />
              <stop offset="100%" stopColor={DIST_COLOR} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="period"
            tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v.toFixed(0)}`}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const gema = payload.find((p) => p.dataKey === 'gemaEur');
                const dist = payload.find((p) => p.dataKey === 'distEur');
                const combined = (gema?.value as number || 0) + (dist?.value as number || 0);
                return (
                  <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-xl text-sm">
                    <p className="font-semibold mb-1">{label}</p>
                    <p className="text-muted-foreground">
                      <span className="inline-block w-2.5 h-2.5 rounded-sm mr-1" style={{ backgroundColor: GEMA_COLOR }} />
                      GEMA: {formatEur(gema?.value as number || 0)}
                    </p>
                    <p className="text-muted-foreground">
                      <span className="inline-block w-2.5 h-2.5 rounded-sm mr-1" style={{ backgroundColor: DIST_COLOR }} />
                      Vertrieb: {formatEur(dist?.value as number || 0)}
                    </p>
                    <p className="font-semibold mt-1 pt-1 border-t border-border">
                      Gesamt: {formatEur(combined)}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            formatter={(value: string) => (
              <span className="text-muted-foreground text-xs">{value}</span>
            )}
          />
          <Area
            type="monotone"
            dataKey="distEur"
            name="Vertrieb"
            stroke={DIST_COLOR}
            fill="url(#distGrad)"
            strokeWidth={2}
            stackId="1"
            animationDuration={1200}
          />
          <Area
            type="monotone"
            dataKey="gemaEur"
            name="GEMA"
            stroke={GEMA_COLOR}
            fill="url(#gemaGrad)"
            strokeWidth={2}
            stackId="1"
            animationDuration={1200}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
