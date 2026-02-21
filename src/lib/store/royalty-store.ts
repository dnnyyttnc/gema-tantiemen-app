import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { indexedDBStorage } from './storage';
import type { RoyaltyStoreState } from '@/types/store';

export const useRoyaltyStore = create<RoyaltyStoreState>()(
  persist(
    (set) => ({
      entries: [],
      statements: [],
      isLoading: false,
      parseError: null,

      addEntries: (newEntries, statement) => {
        set((state) => ({
          entries: [...state.entries, ...newEntries],
          statements: [...state.statements, statement],
          parseError: null,
        }));
      },

      removeStatement: (statementId) => {
        set((state) => ({
          entries: state.entries.filter((e) => e.sourceFile !== statementId),
          statements: state.statements.filter((s) => s.id !== statementId),
        }));
      },

      clearAll: () => set({ entries: [], statements: [], parseError: null }),

      setLoading: (loading) => set({ isLoading: loading }),
      setParseError: (error) => set({ parseError: error }),
    }),
    {
      name: 'gema-royalty-data',
      storage: createJSONStorage(() => indexedDBStorage),
      partialize: (state) => ({
        entries: state.entries,
        statements: state.statements,
      }),
    }
  )
);
