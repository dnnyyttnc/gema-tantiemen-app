import type { GemaRoyaltyEntry, ImportedStatement } from './gema';
import type { DistributorEntry, ImportedDistributorStatement } from './distributor';
import type { UnlockedAchievement } from './achievements';

export interface RoyaltyStoreState {
  entries: GemaRoyaltyEntry[];
  statements: ImportedStatement[];
  distributorEntries: DistributorEntry[];
  distributorStatements: ImportedDistributorStatement[];
  eurUsdRate: number;
  isLoading: boolean;
  parseError: string | null;
  addEntries: (entries: GemaRoyaltyEntry[], statement: ImportedStatement) => void;
  addDistributorEntries: (entries: DistributorEntry[], statement: ImportedDistributorStatement) => void;
  removeStatement: (statementId: string) => void;
  removeDistributorStatement: (statementId: string) => void;
  setEurUsdRate: (rate: number) => void;
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
