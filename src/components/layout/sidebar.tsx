'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Layers,
  Trophy,
  TrendingUp,
  Lightbulb,
  GitCompareArrows,
  Settings,
  Upload,
  ChevronLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/lib/store/ui-store';
import { useRoyaltyStore } from '@/lib/store/royalty-store';
import { getLevelForEarnings } from '@/lib/constants/achievements';
import { Progress } from '@/components/ui/progress';

const NAV_ITEMS = [
  { href: '/overview', label: 'Übersicht', icon: LayoutDashboard },
  { href: '/platforms', label: 'Plattformen', icon: Layers },
  { href: '/leaderboard', label: 'Rangliste', icon: Trophy },
  { href: '/trends', label: 'Trends', icon: TrendingUp },
  { href: '/vergleich', label: 'Vergleich', icon: GitCompareArrows },
  { href: '/insights', label: 'Insights', icon: Lightbulb },
];

export function Sidebar() {
  const pathname = usePathname();
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const entries = useRoyaltyStore((s) => s.entries);
  const totalEarnings = entries.reduce((sum, e) => sum + e.betrag, 0);
  const level = getLevelForEarnings(totalEarnings);

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 240 }}
      className="hidden md:flex flex-col h-screen bg-sidebar border-r border-sidebar-border sticky top-0 overflow-hidden"
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-2.5 min-w-0">
          <Image src="/logos/logo-white.png" alt="exe" width={26} height={26} className="shrink-0 opacity-90" />
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-display text-sm tracking-tight truncate"
            >
              GEMA Royalties
            </motion.span>
          )}
        </Link>
        <button
          onClick={toggleSidebar}
          className="p-1 rounded-md hover:bg-sidebar-accent text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
        >
          <ChevronLeft
            className={cn('w-4 h-4 transition-transform', collapsed && 'rotate-180')}
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-sidebar-primary rounded-lg"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                />
              )}
              <item.icon className="w-5 h-5 relative z-10 shrink-0" />
              {!collapsed && (
                <span className="relative z-10 truncate">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* XP Bar / Level */}
      {!collapsed && entries.length > 0 && (
        <div className="px-4 pb-3">
          <div className="bg-sidebar-accent rounded-lg p-3">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-sidebar-foreground">
                Lv. {level.level}
              </span>
              <span className="text-sidebar-foreground/60">{level.name}</span>
            </div>
            <Progress value={level.progress * 100} className="h-1.5" />
            {level.next && (
              <p className="text-[10px] text-sidebar-foreground/40 mt-1.5">
                Nächstes Level: {level.next.name}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Bottom actions */}
      <div className="px-2 pb-4 space-y-1 border-t border-sidebar-border pt-4">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        >
          <Upload className="w-5 h-5 shrink-0" />
          {!collapsed && <span className="truncate">Upload</span>}
        </Link>
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        >
          <Settings className="w-5 h-5 shrink-0" />
          {!collapsed && <span className="truncate">Einstellungen</span>}
        </Link>
      </div>
    </motion.aside>
  );
}
