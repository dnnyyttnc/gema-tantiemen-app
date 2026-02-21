'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Disc3, ArrowRight, BarChart3, Zap, Sparkles } from 'lucide-react';
import { DropZone } from '@/components/upload/drop-zone';
import { useRoyaltyStore } from '@/lib/store/royalty-store';
import { useHydration } from '@/lib/hooks/use-hydration';
import { useFileUpload } from '@/lib/hooks/use-file-upload';
import { Button } from '@/components/ui/button';
import { formatEur } from '@/lib/utils/format';

export default function LandingPage() {
  const router = useRouter();
  const hydrated = useHydration();
  const entries = useRoyaltyStore((s) => s.entries);
  const { uploadFile } = useFileUpload();
  const [loadingDemo, setLoadingDemo] = useState(false);

  const loadDemo = async () => {
    setLoadingDemo(true);
    try {
      for (const file of ['/demo/gema-detailaufstellung-2023-Q3.csv', '/demo/gema-detailaufstellung-2024-Q3.csv']) {
        const res = await fetch(file);
        const text = await res.text();
        const blob = new Blob([text], { type: 'text/csv' });
        const f = new File([blob], file.split('/').pop()!, { type: 'text/csv' });
        await uploadFile(f);
      }
      router.push('/overview');
    } catch (e) {
      console.error('Demo load failed:', e);
    } finally {
      setLoadingDemo(false);
    }
  };
  const hasData = hydrated && entries.length > 0;
  const totalBetrag = entries.reduce((sum, e) => sum + e.betrag, 0);

  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <Disc3 className="w-7 h-7 text-primary" />
          <span className="font-bold text-lg tracking-tight">GEMA Royalties</span>
        </div>
        {hasData && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/overview')}
            className="gap-2"
          >
            Dashboard <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 max-w-2xl"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', bounce: 0.4, delay: 0.2 }}
            className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-sm text-primary mb-6"
          >
            <Zap className="w-4 h-4" />
            Deine Tantiemen, spielerisch visualisiert
          </motion.div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
            GEMA-Tantiemen
            <br />
            <span className="bg-gradient-to-r from-primary via-purple-400 to-pink-400 bg-clip-text text-transparent">
              auf einen Blick
            </span>
          </h1>

          <p className="mt-4 text-lg text-muted-foreground max-w-lg mx-auto">
            Lade deine GEMA-Abrechnung hoch und entdecke sofort, welche Plattformen und Songs am meisten einbringen.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="w-full"
        >
          <DropZone onSuccess={() => router.push('/overview')} />

          {!hasData && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-4 text-center"
            >
              <button
                onClick={loadDemo}
                disabled={loadingDemo}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                {loadingDemo ? 'Demo wird geladen...' : 'Oder Demo-Daten laden zum Ausprobieren'}
              </button>
            </motion.div>
          )}
        </motion.div>

        {hasData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8"
          >
            <button
              onClick={() => router.push('/overview')}
              className="group flex items-center gap-4 bg-card/50 backdrop-blur border border-border rounded-xl px-6 py-4 hover:bg-card/80 transition-all"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium">Du hast bereits Daten importiert</p>
                <p className="text-xs text-muted-foreground">
                  {entries.length} Einträge &middot; {formatEur(totalBetrag)} Gesamt
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors ml-2" />
            </button>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl w-full"
        >
          {[
            { icon: '🔒', title: '100% Privat', description: 'Deine Daten bleiben in deinem Browser. Kein Upload auf Server.' },
            { icon: '📊', title: 'Sofortige Analyse', description: 'CSV oder PDF hochladen und sofort Einblicke erhalten.' },
            { icon: '🎮', title: 'Gamifiziert', description: 'Level, Achievements und spielerische Visualisierungen.' },
          ].map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + i * 0.1 }}
              className="text-center p-4"
            >
              <div className="text-2xl mb-2">{feature.icon}</div>
              <h3 className="font-semibold text-sm">{feature.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </main>
    </div>
  );
}
