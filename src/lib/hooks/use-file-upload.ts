'use client';

import { useCallback } from 'react';
import { useRoyaltyStore } from '@/lib/store/royalty-store';
import { parseCsvFile } from '@/lib/parsers/csv-parser';
import { parsePdfFile } from '@/lib/parsers/pdf-parser';
import { detectFileFormat } from '@/lib/parsers/parser-utils';

export function useFileUpload() {
  const { addEntries, setLoading, setParseError } = useRoyaltyStore();

  const uploadFile = useCallback(
    async (file: File) => {
      setLoading(true);
      setParseError(null);

      try {
        const format = detectFileFormat(file);

        if (format === 'csv') {
          const text = await file.text();
          const result = parseCsvFile(text, file.name);
          addEntries(result.entries, result.statement);
          return result;
        } else {
          const buffer = await file.arrayBuffer();
          const result = await parsePdfFile(buffer, file.name);
          addEntries(result.entries, result.statement);
          return result;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unbekannter Fehler beim Parsen';
        setParseError(message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [addEntries, setLoading, setParseError]
  );

  return { uploadFile };
}
