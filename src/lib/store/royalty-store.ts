import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { indexedDBStorage } from './storage';
import type { RoyaltyStoreState } from '@/types/store';
import type { GemaRoyaltyEntry } from '@/types/gema';
import type { DistributorEntry } from '@/types/distributor';

/** Deterministic key for cross-file deduplication.
 *  Two entries represent the same payment if they share:
 *  werknummer + sparte + betrag (normalized) + period.
 *  This catches KMP ↔ Detail duplicates while allowing
 *  different roles within the same file (e.g. K 50% + T 50%). */
function computeDedupKey(e: GemaRoyaltyEntry): string {
  return `${e.werknummer}|${e.sparte}|${e.betrag.toFixed(10)}|${e.geschaeftsjahr || e.verteilungsPeriode}`;
}

/** Dedup key for distributor entries */
function computeDistDedupKey(e: DistributorEntry): string {
  return `${e.retailerNormalized}|${e.period}|${e.albumName}|${e.countryCode}|${e.netAmountUsd.toFixed(6)}`;
}

export const useRoyaltyStore = create<RoyaltyStoreState>()(
  persist(
    (set) => ({
      entries: [],
      statements: [],
      distributorEntries: [],
      distributorStatements: [],
      eurUsdRate: 0.92,
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

      addDistributorEntries: (newEntries, statement) => {
        set((state) => {
          if (state.distributorStatements.some(s => s.fileName === statement.fileName)) {
            return { ...state, parseError: `„${statement.fileName}" wurde bereits importiert.` };
          }

          const existingKeys = new Set(state.distributorEntries.map(computeDistDedupKey));
          const unique = newEntries.filter(e => !existingKeys.has(computeDistDedupKey(e)));

          return {
            distributorEntries: [...state.distributorEntries, ...unique],
            distributorStatements: [...state.distributorStatements, statement],
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

      removeDistributorStatement: (statementId) => {
        set((state) => {
          const stm = state.distributorStatements.find(s => s.id === statementId);
          const fileName = stm?.fileName;
          return {
            distributorEntries: fileName
              ? state.distributorEntries.filter((e) => e.sourceFile !== fileName)
              : state.distributorEntries,
            distributorStatements: state.distributorStatements.filter((s) => s.id !== statementId),
          };
        });
      },

      setEurUsdRate: (rate) => set({ eurUsdRate: rate }),

      clearAll: () => set({
        entries: [],
        statements: [],
        distributorEntries: [],
        distributorStatements: [],
        parseError: null,
      }),

      setLoading: (loading) => set({ isLoading: loading }),
      setParseError: (error) => set({ parseError: error }),
    }),
    {
      name: 'gema-royalty-data',
      storage: createJSONStorage(() => indexedDBStorage),
      partialize: (state) => ({
        entries: state.entries,
        statements: state.statements,
        distributorEntries: state.distributorEntries,
        distributorStatements: state.distributorStatements,
        eurUsdRate: state.eurUsdRate,
      }),
    }
  )
);
