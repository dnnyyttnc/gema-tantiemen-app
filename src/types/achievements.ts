export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'earnings' | 'uploads' | 'milestones' | 'discovery';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export interface UnlockedAchievement {
  achievementId: string;
  unlockedAt: number;
  value?: number;
}
