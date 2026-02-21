'use client';

import { useRouter } from 'next/navigation';
import { Upload, Disc3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useStats, useAvailablePeriods } from '@/lib/hooks/use-royalty-data';
import { useUIStore } from '@/lib/store/ui-store';
import { formatEurCompact } from '@/lib/utils/format';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function TopBar() {
  const router = useRouter();
  const stats = useStats();
  const periods = useAvailablePeriods();
  const selectedPeriod = useUIStore((s) => s.selectedPeriod);
  const setSelectedPeriod = useUIStore((s) => s.setSelectedPeriod);

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between h-16 px-4 md:px-6 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="flex items-center gap-3 md:hidden">
        <Disc3 className="w-6 h-6 text-primary" />
        <span className="font-bold text-sm">GEMA Royalties</span>
      </div>

      <div className="hidden md:flex items-center gap-3">
        {periods.length > 0 && (
          <Select
            value={selectedPeriod || 'all'}
            onValueChange={(v) => setSelectedPeriod(v === 'all' ? null : v)}
          >
            <SelectTrigger className="w-[160px] h-9 text-sm">
              <SelectValue placeholder="Alle Perioden" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Perioden</SelectItem>
              {periods.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {stats.totalEarnings > 0 && (
          <Badge variant="secondary" className="text-sm font-semibold gap-1.5 px-3 py-1">
            {formatEurCompact(stats.totalEarnings)}
          </Badge>
        )}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => router.push('/')}
        className="gap-2"
      >
        <Upload className="w-4 h-4" />
        <span className="hidden sm:inline">Upload</span>
      </Button>
    </header>
  );
}
