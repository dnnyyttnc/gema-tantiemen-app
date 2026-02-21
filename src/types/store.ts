import type { GemaRoyaltyEntry, ImportedStatement } from './gema';
import type { UnlockedAchievement } from './achievements';

export interface RoyaltyStoreState {
  entries: GemaRoyaltyEntry[];
  statements: ImportedStatement[];
  isLoading: boolean;
  parseError: string | null;
  addEntries: (entries: GemaRoyaltyEntry[], statement: ImportedStatement) => void;
  removeStatement: (statementId: string) => void;
  clearAll: () => void;
  setLoading: (loading: boolean) => void;
  setParseError: (error: string | null) => void;
}

export interface UIStoreState {
  selectedPeriod: string | null;
  selectedCategory: string | null;
  theme: 'light' | 'dark' | 'system';
  sidebarCollapsed: boolean;
  setSelectedPeriod: (period: string | null) => void;
  setSelectedCategory: (category: string | null) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleSidebar: () => void;
}

export interface AchievementsStoreState {
  unlocked: UnlockedAchievement[];
  newlyUnlocked: string[];
  unlock: (achievementId: string, value?: number) => void;
  dismissNew: (achievementId: string) => void;
}
