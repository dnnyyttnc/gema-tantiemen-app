import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { indexedDBStorage } from './storage';
import type { RoyaltyStoreState } from '@/types/store';
import type { GemaRoyaltyEntry } from '@/types/gema';

/** Deterministic key for cross-file deduplication.
 *  Two entries represent the same payment if they share:
 *  werknummer + sparte + betrag (normalized) + period.
 *  This catches KMP ↔ Detail duplicates while allowing
 *  different roles within the same file (e.g. K 50% + T 50%). */
function computeDedupKey(e: GemaRoyaltyEntry): string {
  return `${e.werknummer}|${e.sparte}|${e.betrag.toFixed(10)}|${e.geschaeftsjahr || e.verteilungsPeriode}`;
}

export const useRoyaltyStore = create<RoyaltyStoreState>()(
  persist(
    (set) => ({
      entries: [],
      statements: [],
      isLoading: false,
      parseError: null,

      addEntries: (newEntries, statement) => {
        set((state) => {
          // Prevent re-importing the exact same file
          if (state.statements.some(s => s.fileName === statement.fileName)) {
            return { ...state, parseError: `„${statement.fileName}" wurde bereits importiert.` };
          }

          // Cross-file deduplication: skip entries that match existing ones
          // from other files (prevents KMP + Detail double-counting)
          const existingKeys = new Set(state.entries.map(computeDedupKey));
          const unique = newEntries.filter(e => !existingKeys.has(computeDedupKey(e)));

          return {
            entries: [...state.entries, ...unique],
            statements: [...state.statements, statement],
            parseError: null,
          };
        });
      },

      removeStatement: (statementId) => {
        set((state) => {
          const stm = state.statements.find(s => s.id === statementId);
          const fileName = stm?.fileName;
          return {
            entries: fileName
              ? state.entries.filter((e) => e.sourceFile !== fileName)
              : state.entries,
            statements: state.statements.filter((s) => s.id !== statementId),
          };
        });
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
