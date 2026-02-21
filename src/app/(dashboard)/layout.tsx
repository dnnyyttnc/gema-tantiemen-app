'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { TopBar } from '@/components/layout/topbar';
import { MobileNav } from '@/components/layout/mobile-nav';
import { useHydration } from '@/lib/hooks/use-hydration';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const hydrated = useHydration();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6">
          {hydrated ? children : (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
