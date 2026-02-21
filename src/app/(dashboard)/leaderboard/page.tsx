'use client';

import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { useSongRankings, useFilteredEntries } from '@/lib/hooks/use-royalty-data';
import { formatEur, formatNumber } from '@/lib/utils/format';
import { CATEGORY_INFO } from '@/lib/constants/categories';
import type { CategoryGroup } from '@/types/gema';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function LeaderboardPage() {
  const songs = useSongRankings();
  const entries = useFilteredEntries();

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Trophy className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold">Noch keine Daten</h2>
        <p className="text-muted-foreground text-sm">Lade eine Abrechnung hoch, um die Rangliste zu sehen.</p>
      </div>
    );
  }

  const top3 = songs.slice(0, 3);
  const rest = songs.slice(3);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl tracking-tight">Song-Rangliste</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Deine erfolgreichsten Werke nach Einnahmen
        </p>
      </div>

      {/* Podium */}
      {top3.length > 0 && (
        <div className="flex items-end justify-center gap-4 pt-8 pb-4">
          {/* 2nd place */}
          {top3[1] && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, type: 'spring', bounce: 0.4 }}
              className="flex flex-col items-center w-28 md:w-36"
            >
              <div className="text-3xl mb-2">{MEDALS[1]}</div>
              <p className="text-xs font-medium text-center truncate w-full">{top3[1].werktitel}</p>
              <p className="text-sm font-bold mt-1">{formatEur(top3[1].totalBetrag)}</p>
              <div className="w-full h-20 bg-gradient-to-t from-slate-400/20 to-slate-400/5 rounded-t-lg mt-3 border border-b-0 border-border/50" />
            </motion.div>
          )}

          {/* 1st place */}
          {top3[0] && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, type: 'spring', bounce: 0.4 }}
              className="flex flex-col items-center w-32 md:w-40"
            >
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.8, type: 'spring', bounce: 0.5 }}
                className="text-4xl mb-2"
              >
                {MEDALS[0]}
              </motion.div>
              <p className="text-sm font-semibold text-center truncate w-full">{top3[0].werktitel}</p>
              <p className="text-lg font-bold mt-1 text-primary">{formatEur(top3[0].totalBetrag)}</p>
              <div className="w-full h-28 bg-gradient-to-t from-primary/20 to-primary/5 rounded-t-lg mt-3 border border-b-0 border-primary/20" />
            </motion.div>
          )}

          {/* 3rd place */}
          {top3[2] && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, type: 'spring', bounce: 0.4 }}
              className="flex flex-col items-center w-28 md:w-36"
            >
              <div className="text-3xl mb-2">{MEDALS[2]}</div>
              <p className="text-xs font-medium text-center truncate w-full">{top3[2].werktitel}</p>
              <p className="text-sm font-bold mt-1">{formatEur(top3[2].totalBetrag)}</p>
              <div className="w-full h-14 bg-gradient-to-t from-amber-700/20 to-amber-700/5 rounded-t-lg mt-3 border border-b-0 border-border/50" />
            </motion.div>
          )}
        </div>
      )}

      {/* Full List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-card border border-border rounded-xl divide-y divide-border"
      >
        {songs.map((song, i) => {
          const topCategories = Object.entries(song.byCategory)
            .sort(([, a], [, b]) => (b?.betrag || 0) - (a?.betrag || 0))
            .slice(0, 3);

          return (
            <motion.div
              key={song.werknummer}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + i * 0.03 }}
              className="flex items-center gap-4 px-5 py-4 hover:bg-accent/30 transition-colors"
            >
              <div className="w-8 text-center shrink-0">
                {i < 3 ? (
                  <span className="text-lg">{MEDALS[i]}</span>
                ) : (
                  <span className="text-sm font-bold text-muted-foreground">#{i + 1}</span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{song.werktitel}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground font-mono">{song.werknummer}</span>
                  {song.totalNutzungen > 0 && (
                    <span className="text-xs text-muted-foreground">
                      &middot; {formatNumber(song.totalNutzungen)} Plays
                    </span>
                  )}
                </div>
                {topCategories.length > 0 && (
                  <div className="flex gap-1.5 mt-1.5">
                    {topCategories.map(([cat, data]) => {
                      const info = CATEGORY_INFO[cat as CategoryGroup];
                      return (
                        <span
                          key={cat}
                          className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-full"
                          style={{
                            backgroundColor: `${info?.color || '#666'}15`,
                            color: info?.color || '#666',
                          }}
                        >
                          {info?.labelShort || cat}: {formatEur(data?.betrag || 0)}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              <p className="text-sm font-bold text-right shrink-0">
                {formatEur(song.totalBetrag)}
              </p>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
