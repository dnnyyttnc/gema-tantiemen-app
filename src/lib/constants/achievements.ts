import type { Achievement } from '@/types/achievements';

export const ACHIEVEMENTS: Achievement[] = [
  // Upload
  { id: 'first_upload', title: 'First Drop', description: 'Lade deine erste Abrechnung hoch', icon: 'Upload', tier: 'bronze', category: 'uploads' },
  { id: 'multi_period', title: 'Time Traveler', description: 'Lade Abrechnungen aus 2+ Perioden hoch', icon: 'Clock', tier: 'silver', category: 'uploads' },
  { id: 'data_hoarder', title: 'Data Hoarder', description: 'Lade 5+ Abrechnungen hoch', icon: 'Database', tier: 'gold', category: 'uploads' },

  // Earnings
  { id: 'first_euro', title: 'First Euro', description: 'Verdiene deinen ersten vollen Euro', icon: 'Euro', tier: 'bronze', category: 'earnings' },
  { id: 'hundred_club', title: '100 Club', description: 'Mehr als 100 EUR Gesamteinnahmen', icon: 'TrendingUp', tier: 'silver', category: 'earnings' },
  { id: 'thousand_club', title: 'Comma Club', description: 'Mehr als 1.000 EUR Gesamteinnahmen', icon: 'Crown', tier: 'gold', category: 'earnings' },
  { id: 'ten_k', title: 'Five Figures', description: 'Mehr als 10.000 EUR Gesamteinnahmen', icon: 'Gem', tier: 'platinum', category: 'earnings' },

  // Discovery
  { id: 'platform_explorer', title: 'Platform Explorer', description: 'Einnahmen von 5+ verschiedenen Plattformen', icon: 'Globe', tier: 'silver', category: 'discovery' },
  { id: 'radio_star', title: 'Video Killed the Radio Star', description: 'Einnahmen aus dem Radio', icon: 'Radio', tier: 'bronze', category: 'discovery' },
  { id: 'vinyl_revival', title: 'Vinyl Revival', description: 'Einnahmen von physischen Medien', icon: 'Disc3', tier: 'silver', category: 'discovery' },
  { id: 'screen_time', title: 'Screen Time', description: 'Einnahmen aus dem Fernsehen', icon: 'Tv', tier: 'bronze', category: 'discovery' },
  { id: 'social_butterfly', title: 'Social Butterfly', description: 'Einnahmen von YouTube, TikTok oder Instagram', icon: 'Share2', tier: 'gold', category: 'discovery' },

  // Milestones
  { id: 'ten_songs', title: 'Growing Catalog', description: '10+ Werke in deinem Katalog', icon: 'Music', tier: 'silver', category: 'milestones' },
  { id: 'million_streams', title: 'Millionaire', description: '1.000.000 Streams erreicht', icon: 'Zap', tier: 'platinum', category: 'milestones' },
];

export const LEVEL_THRESHOLDS = [
  { level: 1, name: 'Bedroom Producer', threshold: 0 },
  { level: 2, name: 'Open Mic Artist', threshold: 100 },
  { level: 3, name: 'Local Hero', threshold: 500 },
  { level: 4, name: 'Club Regular', threshold: 1_000 },
  { level: 5, name: 'Radio Darling', threshold: 5_000 },
  { level: 6, name: 'Chart Contender', threshold: 10_000 },
  { level: 7, name: 'Hit Machine', threshold: 25_000 },
  { level: 8, name: 'Gold Record', threshold: 50_000 },
  { level: 9, name: 'Platinum Artist', threshold: 100_000 },
  { level: 10, name: 'Hall of Fame', threshold: 250_000 },
] as const;

export function getLevelForEarnings(totalEarnings: number) {
  let current: (typeof LEVEL_THRESHOLDS)[number] = LEVEL_THRESHOLDS[0];
  for (const level of LEVEL_THRESHOLDS) {
    if (totalEarnings >= level.threshold) {
      current = level;
    } else {
      break;
    }
  }
  const nextIndex = LEVEL_THRESHOLDS.findIndex((l) => l.level === current.level) + 1;
  const next: (typeof LEVEL_THRESHOLDS)[number] | null = nextIndex < LEVEL_THRESHOLDS.length ? LEVEL_THRESHOLDS[nextIndex] : null;
  const progress = next
    ? (totalEarnings - current.threshold) / (next.threshold - current.threshold)
    : 1;

  return { ...current, progress: Math.min(1, Math.max(0, progress)), next };
}
