'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { motion } from 'framer-motion';
import { formatEur } from '@/lib/utils/format';

interface RevenueSplitDonutProps {
  gemaEur: number;
  distEur: number;
}

const GEMA_COLOR = 'oklch(0.7 0.15 280)';
const DIST_COLOR = 'oklch(0.7 0.12 180)';

export function RevenueSplitDonut({ gemaEur, distEur }: RevenueSplitDonutProps) {
  const total = gemaEur + distEur;
  if (total <= 0) return null;

  const gemaPct = ((gemaEur / total) * 100).toFixed(1);
  const distPct = ((distEur / total) * 100).toFixed(1);

  const chartData = [
    { name: 'GEMA', value: gemaEur, color: GEMA_COLOR },
    { name: 'Vertrieb', value: distEur, color: DIST_COLOR },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2, type: 'spring', bounce: 0.3 }}
      className="relative"
    >
      <div className="w-full aspect-square max-w-[260px] mx-auto relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius="48%"
              outerRadius="80%"
              paddingAngle={3}
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
                  const pct = ((d.value as number) / total * 100).toFixed(1);
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
            <p className="text-lg font-bold">{formatEur(total)}</p>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex justify-center gap-6">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: GEMA_COLOR }} />
          <span className="text-muted-foreground">GEMA</span>
          <span className="font-semibold">{gemaPct}%</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: DIST_COLOR }} />
          <span className="text-muted-foreground">Vertrieb</span>
          <span className="font-semibold">{distPct}%</span>
        </div>
      </div>
    </motion.div>
  );
}
