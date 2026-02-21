import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AchievementsStoreState } from '@/types/store';

export const useAchievementsStore = create<AchievementsStoreState>()(
  persist(
    (set) => ({
      unlocked: [],
      newlyUnlocked: [],

      unlock: (achievementId, value) => {
        set((state) => {
          if (state.unlocked.some((a) => a.achievementId === achievementId)) {
            return state;
          }
          return {
            unlocked: [...state.unlocked, { achievementId, unlockedAt: Date.now(), value }],
            newlyUnlocked: [...state.newlyUnlocked, achievementId],
          };
        });
      },

      dismissNew: (achievementId) => {
        set((state) => ({
          newlyUnlocked: state.newlyUnlocked.filter((id) => id !== achievementId),
        }));
      },
    }),
    {
      name: 'gema-achievements',
    }
  )
);
