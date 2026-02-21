'use client';

import { motion } from 'framer-motion';
import { type LucideIcon } from 'lucide-react';
import { AnimatedNumber } from '@/components/shared/animated-number';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: number;
  formatter?: (value: number) => string;
  icon: LucideIcon;
  gradient: string;
  delay?: number;
}

export function StatCard({ label, value, formatter, icon: Icon, gradient, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', bounce: 0.3 }}
      className="glow-hover group relative overflow-hidden rounded-xl border border-border bg-card p-5"
    >
      <div className={cn('absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-20', gradient)} />

      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground font-medium">{label}</p>
          <div className="text-2xl font-bold mt-1 truncate">
            <AnimatedNumber
              value={value}
              formatter={formatter || ((v) => v.toLocaleString('de-DE'))}
            />
          </div>
        </div>
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0', gradient)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </motion.div>
  );
}
