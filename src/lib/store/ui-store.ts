import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UIStoreState } from '@/types/store';

export const useUIStore = create<UIStoreState>()(
  persist(
    (set) => ({
      selectedPeriod: null,
      selectedCategory: null,
      theme: 'dark',
      sidebarCollapsed: false,

      setSelectedPeriod: (period) => set({ selectedPeriod: period }),
      setSelectedCategory: (category) => set({ selectedCategory: category }),
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    }),
    {
      name: 'gema-ui-prefs',
    }
  )
);
