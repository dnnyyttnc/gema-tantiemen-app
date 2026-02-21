'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb } from 'lucide-react';
import { useFilteredEntries } from '@/lib/hooks/use-royalty-data';
import { generateInsights } from '@/lib/analysis/insights-engine';
import { useRoyaltyStore } from '@/lib/store/royalty-store';
import { ACHIEVEMENTS } from '@/lib/constants/achievements';
import { useAchievementsStore } from '@/lib/store/achievements-store';

export default function InsightsPage() {
  const entries = useFilteredEntries();
  const allEntries = useRoyaltyStore((s) => s.entries);
  const unlocked = useAchievementsStore((s) => s.unlocked);

  const insights = useMemo(() => generateInsights(entries), [entries]);

  if (allEntries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Lightbulb className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold">Noch keine Daten</h2>
        <p className="text-muted-foreground text-sm">Lade eine Abrechnung hoch, um Insights zu erhalten.</p>
      </div>
    );
  }

  const tierColors = {
    bronze: 'from-amber-700 to-amber-900',
    silver: 'from-slate-400 to-slate-600',
    gold: 'from-yellow-400 to-yellow-600',
    platinum: 'from-cyan-300 to-cyan-500',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Insights</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Spannende Erkenntnisse aus deinen Tantiemen
        </p>
      </div>

      {/* Insight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((insight, i) => (
          <motion.div
            key={insight.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glow-hover bg-card border border-border rounded-xl p-5"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{insight.emoji}</span>
              <div className="min-w-0">
                <p className="text-sm font-semibold">{insight.title}</p>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{insight.body}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {insights.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Noch nicht genug Daten für detaillierte Insights. Lade weitere Abrechnungen hoch!
        </div>
      )}

      {/* Achievements */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-lg font-semibold mb-4">Achievements</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {ACHIEVEMENTS.map((achievement) => {
            const isUnlocked = unlocked.some((u) => u.achievementId === achievement.id);
            return (
              <div
                key={achievement.id}
                className={`relative rounded-xl border p-4 text-center transition-all ${
                  isUnlocked
                    ? 'border-primary/30 bg-card'
                    : 'border-border/50 bg-muted/30 opacity-50'
                }`}
              >
                {isUnlocked && (
                  <div className={`absolute inset-0 bg-gradient-to-br ${tierColors[achievement.tier]} opacity-5 rounded-xl`} />
                )}
                <div className="text-2xl mb-2">
                  {isUnlocked ? '✨' : '🔒'}
                </div>
                <p className="text-xs font-semibold">{achievement.title}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{achievement.description}</p>
                <span
                  className={`inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    isUnlocked
                      ? `bg-gradient-to-r ${tierColors[achievement.tier]} text-white`
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {achievement.tier}
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
