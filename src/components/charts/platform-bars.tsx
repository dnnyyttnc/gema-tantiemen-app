'use client';

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { getPlatformName, getPlatformColor } from '@/lib/constants/platforms';
import { formatEur } from '@/lib/utils/format';

interface PlatformBarsProps {
  data: Record<string, { betrag: number; nutzungen: number; count: number }>;
  maxItems?: number;
}

export function PlatformBars({ data, maxItems = 8 }: PlatformBarsProps) {
  const chartData = Object.entries(data)
    .map(([name, val]) => ({
      name: getPlatformName(name),
      originalName: name,
      value: val.betrag,
      plays: val.nutzungen,
      color: getPlatformColor(name),
    }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, maxItems);

  if (chartData.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="w-full"
    >
      <ResponsiveContainer width="100%" height={chartData.length * 48 + 20}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            width={120}
            tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const d = payload[0].payload;
                return (
                  <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-xl text-sm">
                    <p className="font-semibold">{d.name}</p>
                    <p className="text-muted-foreground">{formatEur(d.value)}</p>
                    {d.plays > 0 && (
                      <p className="text-muted-foreground text-xs">{d.plays.toLocaleString('de-DE')} Plays</p>
                    )}
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="value" radius={[0, 6, 6, 0]} animationDuration={800}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
