import type { GemaRoyaltyEntry, ImportedStatement } from '@/types/gema';
import { mapSparteToCategory } from '@/lib/constants/categories';
import { parseGermanNumber, parseAnteil, generateEntryId } from './parser-utils';

interface TextItem {
  str: string;
  x: number;
  y: number;
  width: number;
}

interface ParsedLine {
  text: string;
  items: TextItem[];
}

// Patterns for extracting data from PDF lines
const WORK_NUMBER_PATTERN = /(\d{5,9}(?:-\d{1,3})?)/;
const AMOUNT_PATTERN = /(-?\d{1,3}(?:\.\d{3})*,\d{2,10})\s*(?:EUR)?/;
const SHARE_PATTERN = /(\d{1,2}\s*\/\s*12)/;
const ROLE_PATTERN = /\b([KTVB])\b/;
const SPARTE_PATTERN = /\b(MOD\s*S(?:\s*VR)?|MOD\s*D(?:\s*VR)?|GOP(?:\s*VR)?|VOD\s*[SD](?:\s*VR)?|R(?:\s*VR)?|FS(?:\s*VR)?|T(?:\s*FS)?(?:\s*VR)?|TD(?:\s*VR)?|MED(?:\s*VR)?|U|UD|E|ED|EM|BM|KI|DK(?:\s*VR)?|PHONO\s*VR|BT\s*VR|MT\s*VR|GT\s*VR|A(?:\s*AR|\s*VR)?|WEB(?:\s*VR)?|IR|IFS|KMOD(?:\s*VR)?)\b/i;
const YEAR_PATTERN = /\b(20\d{2})\b/;

async function loadPdfJs() {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  return pdfjsLib;
}

async function extractTextFromPdf(arrayBuffer: ArrayBuffer): Promise<ParsedLine[][]> {
  const pdfjsLib = await loadPdfJs();
  const doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages: ParsedLine[][] = [];

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const textContent = await page.getTextContent();
    const items: TextItem[] = textContent.items
      .filter((item) => 'str' in item && (item as { str: string }).str.trim().length > 0)
      .map((item) => {
        const ti = item as { str: string; transform: number[]; width: number };
        return {
          str: ti.str,
          x: ti.transform[4],
          y: ti.transform[5],
          width: ti.width,
        };
      });

    // Group by Y coordinate (same line, tolerance of 3px)
    const lineMap = new Map<number, TextItem[]>();
    for (const item of items) {
      const roundedY = Math.round(item.y / 3) * 3;
      if (!lineMap.has(roundedY)) lineMap.set(roundedY, []);
      lineMap.get(roundedY)!.push(item);
    }

    // Sort lines top to bottom (higher Y = earlier in page for PDF coords)
    const lines = Array.from(lineMap.entries())
      .sort(([a], [b]) => b - a)
      .map(([, lineItems]) => {
        const sorted = lineItems.sort((a, b) => a.x - b.x);
        return {
          text: sorted.map((i) => i.str).join(' '),
          items: sorted,
        };
      });

    pages.push(lines);
  }

  return pages;
}

export interface PdfParseResult {
  entries: GemaRoyaltyEntry[];
  statement: ImportedStatement;
}

export async function parsePdfFile(arrayBuffer: ArrayBuffer, fileName: string): Promise<PdfParseResult> {
  const pages = await extractTextFromPdf(arrayBuffer);
  const warnings: string[] = [];
  const now = Date.now();
  const entries: GemaRoyaltyEntry[] = [];

  let currentSparte = '';
  let geschaeftsjahr = '';
  let verteilungsPeriode = '';
  let currentNutzer = '';

  for (const pageLines of pages) {
    for (const line of pageLines) {
      const text = line.text;

      // Try to detect header info
      const sparteMatch = text.match(SPARTE_PATTERN);
      if (sparteMatch) {
        currentSparte = sparteMatch[1].replace(/\s+/g, ' ').trim().toUpperCase();
      }

      const yearMatch = text.match(YEAR_PATTERN);
      if (yearMatch && !geschaeftsjahr) {
        geschaeftsjahr = yearMatch[1];
      }

      // Detect period info
      if (/Geschäftsjahr|GJ|Fiscal/i.test(text) && yearMatch) {
        geschaeftsjahr = yearMatch[1];
      }
      if (/Ausschüttung|Verteilung|Distribution/i.test(text)) {
        const dateMatch = text.match(/(\d{2}\.\d{2}\.\d{4})/);
        if (dateMatch) verteilungsPeriode = dateMatch[1];
        else if (yearMatch) verteilungsPeriode = yearMatch[1];
      }

      // Detect nutzer/sender
      if (/Sendeanstalt|Nutzer|Plattform|Sender/i.test(text)) {
        const parts = text.split(/:\s*/);
        if (parts[1]) currentNutzer = parts[1].trim();
      }

      // Try to parse as a data line (must have work number and amount)
      const workMatch = text.match(WORK_NUMBER_PATTERN);
      const amountMatch = text.match(AMOUNT_PATTERN);

      if (workMatch && amountMatch) {
        const werknummer = workMatch[1];
        const betragRaw = amountMatch[1];
        const betrag = parseGermanNumber(betragRaw);

        // Extract title: text between work number and amount, excluding known patterns
        let werktitel = 'Unbekannt';
        const workIdx = text.indexOf(workMatch[0]) + workMatch[0].length;
        const amountIdx = text.indexOf(amountMatch[0]);
        if (amountIdx > workIdx) {
          const middle = text.substring(workIdx, amountIdx).trim();
          // Clean up: remove role codes, share fractions, sparte codes
          const cleaned = middle
            .replace(ROLE_PATTERN, '')
            .replace(SHARE_PATTERN, '')
            .replace(SPARTE_PATTERN, '')
            .replace(/\s+/g, ' ')
            .trim();
          if (cleaned.length > 1) werktitel = cleaned;
        }

        const roleMatch = text.match(ROLE_PATTERN);
        const shareMatch = text.match(SHARE_PATTERN);
        const lineSparteMatch = text.match(SPARTE_PATTERN);
        const sparte = lineSparteMatch
          ? lineSparteMatch[1].replace(/\s+/g, ' ').trim().toUpperCase()
          : currentSparte;

        const anteilRaw = shareMatch ? shareMatch[1] : '12/12';

        entries.push({
          id: generateEntryId(werknummer, sparte, currentNutzer, geschaeftsjahr, betragRaw),
          werknummer,
          werktitel,
          rolle: (roleMatch ? roleMatch[1] : '') as GemaRoyaltyEntry['rolle'],
          anteilRaw,
          anteilDecimal: parseAnteil(anteilRaw),
          sparte,
          categoryGroup: mapSparteToCategory(sparte),
          nutzungsanzahl: 0, // PDFs often don't show individual stream counts
          betrag,
          betragRaw,
          nutzer: currentNutzer,
          geschaeftsjahr,
          verteilungsPeriode: verteilungsPeriode || geschaeftsjahr,
          sourceFile: fileName,
          importedAt: now,
        });
      }
    }
  }

  if (entries.length === 0) {
    warnings.push('Keine Einträge im PDF erkannt. Möglicherweise unbekanntes Format.');
  }

  const totalBetrag = entries.reduce((sum, e) => sum + e.betrag, 0);

  const statement: ImportedStatement = {
    id: `pdf_${now}_${fileName}`,
    fileName,
    fileType: 'pdf',
    formatVariant: 'pdf_standard',
    importedAt: now,
    geschaeftsjahr: geschaeftsjahr || 'Unbekannt',
    verteilungsPeriode: verteilungsPeriode || geschaeftsjahr || 'Unbekannt',
    entryCount: entries.length,
    totalBetrag,
    warnings,
  };

  return { entries, statement };
}
