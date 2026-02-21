'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useState } from 'react';
import Image from 'next/image';
import { ArrowRight, BarChart3, Sparkles, Shield, LineChart, Zap } from 'lucide-react';
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
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <Image src="/logos/logo-white.png" alt="exe" width={32} height={32} className="opacity-90" />
          <span className="font-display text-lg tracking-tight">GEMA Royalties</span>
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

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-12 max-w-2xl"
        >
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl tracking-tight leading-[1.05]">
            Deine Tantiemen.
            <br />
            <span className="text-primary">Dein Durchblick.</span>
          </h1>

          <p className="mt-6 text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
            GEMA-Abrechnung hochladen, sofort sehen wo dein Geld herkommt &mdash; und wo du mehr rausholen kannst.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="w-full"
        >
          <DropZone onSuccess={() => router.push('/overview')} />

          {!hasData && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-5 text-center"
            >
              <button
                onClick={loadDemo}
                disabled={loadingDemo}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                {loadingDemo ? 'Demo wird geladen...' : 'Demo-Daten laden zum Ausprobieren'}
              </button>
            </motion.div>
          )}
        </motion.div>

        {hasData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8"
          >
            <button
              onClick={() => router.push('/overview')}
              className="group flex items-center gap-4 bg-card/60 backdrop-blur border border-border rounded-xl px-6 py-4 hover:border-primary/30 transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium">Daten bereits importiert</p>
                <p className="text-xs text-muted-foreground">
                  {entries.length} Einträge &middot; {formatEur(totalBetrag)} Gesamt
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors ml-2" />
            </button>
          </motion.div>
        )}

        {/* Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl w-full"
        >
          {[
            { icon: Shield, title: '100% Privat', description: 'Alles bleibt in deinem Browser. Kein Server, keine Cookies.' },
            { icon: LineChart, title: 'Pro-Play Analyse', description: 'Finde heraus welche Plattform dir pro Klick am meisten zahlt.' },
            { icon: Zap, title: 'Sofort loslegen', description: 'CSV oder PDF hochladen und in Sekunden Insights erhalten.' },
          ].map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.08 }}
              className="text-center p-4"
            >
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/8 mb-3">
                <feature.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-bold text-sm">{feature.title}</h3>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="flex items-center justify-center gap-2 pb-6 text-xs text-muted-foreground">
        <span>Powered by</span>
        <a href="https://www.exe.ist/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
          <Image src="/logos/logo-white.png" alt="exe" width={16} height={16} className="opacity-70" />
          <span className="font-bold">exe</span>
        </a>
      </footer>
    </div>
  );
}
