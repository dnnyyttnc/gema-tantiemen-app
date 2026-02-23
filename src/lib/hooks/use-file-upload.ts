'use client';

import { useCallback } from 'react';
import { useRoyaltyStore } from '@/lib/store/royalty-store';
import { parseCsvFile } from '@/lib/parsers/csv-parser';
import { parsePdfFile } from '@/lib/parsers/pdf-parser';
import { detectFileFormat } from '@/lib/parsers/parser-utils';
import { isDistributorFormat } from '@/lib/parsers/distributor-parser';

export interface UploadResult {
  entries: { length: number };
  statement: { totalBetrag: number; fileName: string };
  isDistributor?: boolean;
  totalUsd?: number;
}

export function useFileUpload() {
  const { addEntries, addDistributorEntries, setLoading, setParseError } = useRoyaltyStore();

  const uploadFile = useCallback(
    async (file: File): Promise<UploadResult> => {
      setLoading(true);
      setParseError(null);

      try {
        const format = detectFileFormat(file);

        // XLSX/XLS/TSV → always distributor
        if (format === 'xlsx') {
          const { parseDistributorFile } = await import('@/lib/parsers/distributor-parser');
          const buffer = await file.arrayBuffer();
          const result = await parseDistributorFile(buffer, file.name);
          addDistributorEntries(result.entries, result.statement);
          return {
            entries: { length: result.entries.length },
            statement: { totalBetrag: 0, fileName: result.statement.fileName },
            isDistributor: true,
            totalUsd: result.statement.totalAmountUsd,
          };
        }

        if (format === 'pdf') {
          const buffer = await file.arrayBuffer();
          const result = await parsePdfFile(buffer, file.name);
          addEntries(result.entries, result.statement);
          return {
            entries: { length: result.entries.length },
            statement: { totalBetrag: result.statement.totalBetrag, fileName: result.statement.fileName },
          };
        }

        // CSV: check if it's a distributor format or GEMA
        const text = await file.text();
        const firstLine = text.split('\n')[0] || '';
        const headers = firstLine.split(/[,;\t]/).map((h) => h.replace(/"/g, '').trim());

        if (isDistributorFormat(headers)) {
          const { parseDistributorFile } = await import('@/lib/parsers/distributor-parser');
          const buffer = new TextEncoder().encode(text).buffer;
          const result = await parseDistributorFile(buffer as ArrayBuffer, file.name);
          addDistributorEntries(result.entries, result.statement);
          return {
            entries: { length: result.entries.length },
            statement: { totalBetrag: 0, fileName: result.statement.fileName },
            isDistributor: true,
            totalUsd: result.statement.totalAmountUsd,
          };
        }

        // Default: GEMA CSV
        const result = parseCsvFile(text, file.name);
        addEntries(result.entries, result.statement);
        return {
          entries: { length: result.entries.length },
          statement: { totalBetrag: result.statement.totalBetrag, fileName: result.statement.fileName },
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unbekannter Fehler beim Parsen';
        setParseError(message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [addEntries, addDistributorEntries, setLoading, setParseError]
  );

  return { uploadFile };
}
