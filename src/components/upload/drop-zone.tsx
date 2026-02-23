'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Music, Loader2, CheckCircle2, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { useFileUpload } from '@/lib/hooks/use-file-upload';
import type { UploadResult } from '@/lib/hooks/use-file-upload';
import { useRoyaltyStore } from '@/lib/store/royalty-store';
import { formatEur, formatNumber, formatUsd } from '@/lib/utils/format';
import { cn } from '@/lib/utils';

interface DropZoneProps {
  onSuccess?: () => void;
}

type UploadState = 'idle' | 'parsing' | 'success' | 'error';

export function DropZone({ onSuccess }: DropZoneProps) {
  const { uploadFile } = useFileUpload();
  const parseError = useRoyaltyStore((s) => s.parseError);
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [lastResult, setLastResult] = useState<{ entries: number; total: number; isDistributor?: boolean; totalUsd?: number } | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      for (const file of acceptedFiles) {
        setUploadState('parsing');
        try {
          const result: UploadResult = await uploadFile(file);
          setLastResult({
            entries: result.entries.length,
            total: result.statement.totalBetrag,
            isDistributor: result.isDistributor,
            totalUsd: result.totalUsd,
          });
          setUploadState('success');
          setTimeout(() => {
            onSuccess?.();
          }, 2000);
        } catch {
          setUploadState('error');
        }
      }
    },
    [uploadFile, onSuccess]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/tab-separated-values': ['.tsv'],
    },
    multiple: true,
  });

  const rootProps = getRootProps();

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        {...rootProps}
        className={cn(
          'relative cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-all duration-300',
          isDragActive
            ? 'border-primary bg-primary/10 scale-[1.02]'
            : 'border-border hover:border-primary/50 hover:bg-accent/50',
          uploadState === 'success' && 'border-emerald-500/50 bg-emerald-500/5',
          uploadState === 'error' && 'border-destructive/50 bg-destructive/5'
        )}
      >
        <input {...getInputProps()} />

        <AnimatePresence mode="wait">
          {uploadState === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center gap-4"
            >
              <motion.div
                className="relative"
                animate={isDragActive ? { scale: 1.2, rotate: 10 } : { scale: 1, rotate: 0 }}
              >
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  {isDragActive ? (
                    <Music className="w-10 h-10 text-primary" />
                  ) : (
                    <Upload className="w-10 h-10 text-primary" />
                  )}
                </div>
              </motion.div>

              <div>
                <p className="text-lg font-semibold">
                  {isDragActive ? 'Jetzt loslassen!' : 'GEMA oder Distributor-Report hochladen'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  CSV, PDF oder XLSX hier ablegen oder klicken zum Auswählen
                </p>
              </div>

              <div className="flex gap-3 mt-2">
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
                  <FileText className="w-3.5 h-3.5" /> CSV
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
                  <FileText className="w-3.5 h-3.5" /> PDF
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
                  <FileSpreadsheet className="w-3.5 h-3.5" /> XLSX
                </span>
              </div>
            </motion.div>
          )}

          {uploadState === 'parsing' && (
            <motion.div
              key="parsing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center gap-4"
            >
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <p className="text-lg font-semibold">Wird analysiert...</p>
              <p className="text-sm text-muted-foreground">Deine Daten werden ausgelesen</p>
            </motion.div>
          )}

          {uploadState === 'success' && lastResult && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center gap-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', bounce: 0.5 }}
              >
                <CheckCircle2 className="w-16 h-16 text-emerald-500" />
              </motion.div>
              <div>
                <p className="text-lg font-semibold text-emerald-400">Erfolgreich importiert!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {formatNumber(lastResult.entries)} Einträge &middot;{' '}
                  {lastResult.isDistributor
                    ? formatUsd(lastResult.totalUsd || 0)
                    : formatEur(lastResult.total)
                  } Gesamt
                </p>
                {lastResult.isDistributor && (
                  <p className="text-xs text-primary mt-1">Distributor-Report erkannt</p>
                )}
              </div>
            </motion.div>
          )}

          {uploadState === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center gap-4"
            >
              <AlertCircle className="w-12 h-12 text-destructive" />
              <div>
                <p className="text-lg font-semibold text-destructive">Fehler beim Import</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {parseError || 'Die Datei konnte nicht gelesen werden. Versuche es erneut.'}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setUploadState('idle');
                }}
                className="text-sm text-primary hover:underline"
              >
                Erneut versuchen
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
