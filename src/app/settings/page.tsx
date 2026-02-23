'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2, Download, FileText, FileSpreadsheet, ArrowLeft, DollarSign } from 'lucide-react';
import { useRoyaltyStore } from '@/lib/store/royalty-store';
import { useAchievementsStore } from '@/lib/store/achievements-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatEur, formatUsd } from '@/lib/utils/format';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import Link from 'next/link';

export default function SettingsPage() {
  const { statements, entries, distributorStatements, distributorEntries, eurUsdRate, removeStatement, removeDistributorStatement, setEurUsdRate, clearAll } = useRoyaltyStore();
  const [showClearDialog, setShowClearDialog] = useState(false);

  const handleExport = () => {
    const data = JSON.stringify({ entries, statements, distributorEntries, distributorStatements, eurUsdRate }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gema-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    clearAll();
    useAchievementsStore.getState().unlocked = [];
    setShowClearDialog(false);
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/overview" className="p-2 hover:bg-accent rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-display text-2xl tracking-tight">Einstellungen</h1>
          <p className="text-muted-foreground text-sm mt-1">Verwalte deine importierten Daten</p>
        </div>
      </div>

      {/* EUR/USD Rate */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-primary" />
            EUR/USD-Kurs
          </CardTitle>
          <CardDescription>
            Distributor-Einnahmen werden in USD gespeichert. Dieser Kurs wird für die Umrechnung in EUR verwendet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium">1 USD =</label>
            <input
              type="number"
              step="0.0001"
              min="0.01"
              max="2"
              value={eurUsdRate}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val) && val > 0) setEurUsdRate(val);
              }}
              className="w-28 bg-muted border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <span className="text-sm text-muted-foreground">EUR</span>
          </div>
        </CardContent>
      </Card>

      {/* Imported GEMA Statements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4" />
            GEMA-Abrechnungen
          </CardTitle>
          <CardDescription>
            {statements.length === 0
              ? 'Noch keine Abrechnungen importiert.'
              : `${statements.length} Abrechnung${statements.length !== 1 ? 'en' : ''} importiert`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {statements.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Lade deine erste Abrechnung auf der Startseite hoch.
            </p>
          ) : (
            <div className="space-y-3">
              {statements.map((s) => (
                <motion.div
                  key={s.id}
                  layout
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 group"
                >
                  <FileText className="w-5 h-5 text-muted-foreground shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{s.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.entryCount} Einträge &middot; {formatEur(s.totalBetrag)} &middot; {s.geschaeftsjahr}
                    </p>
                    {s.warnings.length > 0 && (
                      <p className="text-xs text-yellow-500 mt-0.5">{s.warnings.join(', ')}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeStatement(s.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Distributor Statements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-teal-400" />
            Distributor-Reports
          </CardTitle>
          <CardDescription>
            {distributorStatements.length === 0
              ? 'Noch keine Distributor-Reports importiert.'
              : `${distributorStatements.length} Report${distributorStatements.length !== 1 ? 's' : ''} importiert`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {distributorStatements.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Lade einen Distributor-Report (XLSX) auf der Startseite hoch.
            </p>
          ) : (
            <div className="space-y-3">
              {distributorStatements.map((s) => (
                <motion.div
                  key={s.id}
                  layout
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 group"
                >
                  <FileSpreadsheet className="w-5 h-5 text-teal-400 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{s.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.entryCount} Einträge &middot; {formatUsd(s.totalAmountUsd)} &middot;{' '}
                      {s.dateRange.from} – {s.dateRange.to} &middot;{' '}
                      <span className="capitalize">{s.distributorFormat}</span>
                    </p>
                    {s.warnings.length > 0 && (
                      <p className="text-xs text-yellow-500 mt-0.5">{s.warnings.join(', ')}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDistributorStatement(s.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daten exportieren</CardTitle>
          <CardDescription>Exportiere alle importierten Daten als JSON-Datei.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={handleExport} disabled={entries.length === 0 && distributorEntries.length === 0} className="gap-2">
            <Download className="w-4 h-4" />
            Als JSON exportieren
          </Button>
        </CardContent>
      </Card>

      {/* Clear */}
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="text-base text-destructive">Alle Daten löschen</CardTitle>
          <CardDescription>
            Entferne alle importierten Abrechnungen, Distributor-Reports und Achievements unwiderruflich.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
            <DialogTrigger asChild>
              <Button variant="destructive" disabled={entries.length === 0 && distributorEntries.length === 0} className="gap-2">
                <Trash2 className="w-4 h-4" />
                Alle Daten löschen
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Alle Daten löschen?</DialogTitle>
                <DialogDescription>
                  Das entfernt {entries.length} GEMA-Einträge und {distributorEntries.length} Distributor-Einträge.
                  Diese Aktion kann nicht rückgängig gemacht werden.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowClearDialog(false)}>
                  Abbrechen
                </Button>
                <Button variant="destructive" onClick={handleClear}>
                  Endgültig löschen
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Privacy info */}
      <div className="text-center text-xs text-muted-foreground pt-4">
        <p>Alle Daten werden ausschließlich in deinem Browser gespeichert.</p>
        <p className="mt-1">Kein Server, keine Datenbank, keine Cookies.</p>
      </div>
    </div>
  );
}
