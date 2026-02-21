'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { motion } from 'framer-motion';
import { CATEGORY_INFO } from '@/lib/constants/categories';
import { formatEur } from '@/lib/utils/format';
import type { CategoryGroup } from '@/types/gema';

interface RevenueDonutProps {
  data: Record<string, { betrag: number; nutzungen: number; count: number }>;
  totalEarnings: number;
}

export function RevenueDonut({ data, totalEarnings }: RevenueDonutProps) {
  const chartData = Object.entries(data)
    .map(([key, val]) => ({
      name: CATEGORY_INFO[key as CategoryGroup]?.label || key,
      value: val.betrag,
      color: CATEGORY_INFO[key as CategoryGroup]?.color || '#6b7280',
    }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);

  if (chartData.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2, type: 'spring', bounce: 0.3 }}
      className="relative"
    >
      <div className="w-full aspect-square max-w-[300px] mx-auto relative">
        {/* Vinyl grooves background */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-[90%] h-[90%] rounded-full border border-border/30" />
          <div className="absolute w-[75%] h-[75%] rounded-full border border-border/20" />
          <div className="absolute w-[60%] h-[60%] rounded-full border border-border/10" />
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius="42%"
              outerRadius="80%"
              paddingAngle={2}
              dataKey="value"
              animationBegin={300}
              animationDuration={800}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0];
                  const pct = totalEarnings > 0
                    ? ((d.value as number) / totalEarnings * 100).toFixed(1)
                    : '0';
                  return (
                    <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-xl text-sm">
                      <p className="font-semibold">{d.name}</p>
                      <p className="text-muted-foreground">
                        {formatEur(d.value as number)} ({pct}%)
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center label */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Gesamt</p>
            <p className="text-lg font-bold">{formatEur(totalEarnings)}</p>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        {chartData.slice(0, 6).map((d) => (
          <div key={d.name} className="flex items-center gap-1.5 text-xs">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="text-muted-foreground">{d.name}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
