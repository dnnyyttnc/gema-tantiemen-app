import Papa from 'papaparse';
import type { GemaRoyaltyEntry, RawCsvRow, ImportedStatement } from '@/types/gema';
import { mapSparteToCategory } from '@/lib/constants/categories';
import { parseGermanNumber, parseAnteil, generateEntryId, stripBOM } from './parser-utils';

// Map various German CSV column headers to our internal field names
// Includes official GEMA Datensatzbeschreibung field names (ABRENR, WERKNR, etc.)
// as well as common portal export column names
const COLUMN_MAP: Record<string, string> = {
  // Werknummer — official field: WERKNR (col I), FAS (col J = Fassung)
  'werk-nr.': 'werknummer',
  'werknummer': 'werknummer',
  'werknr': 'werknummer',
  'werk-nr': 'werknummer',
  'werkfassungsnummer': 'werknummer',
  'werk': 'werknummer',
  // Werktitel — official field: WERKTITEL (col H)
  'werktitel': 'werktitel',
  'titel': 'werktitel',
  'work title': 'werktitel',
  'titel des werkes': 'werktitel',
  // Fassung
  'fas': 'fassung',
  'fassung': 'fassung',
  'fassungsnummer': 'fassung',
  // Rolle — official field: ROLLE (col W), numeric: 1=K, 2=B, 3=T, 4=V
  'rolle': 'rolle',
  'role': 'rolle',
  'beteiligtenrolle': 'rolle',
  'rol': 'rolle',
  'rolle_didas': 'rolle',
  // Anteil
  'anteil': 'anteil',
  'share': 'anteil',
  'zaehler': 'anteilZaehler',
  'nenner': 'anteilNenner',
  'u_zaehler': 'anteilZaehler',
  'u_nenner': 'anteilNenner',
  'anteilart': 'anteilArt',
  'ant': 'anteilArt',
  // Sparte — official: SPARTE (col D = Bezeichnung), SPARTENNUMMER (col E = Code)
  'sparte': 'sparte',
  'bezeichnung abrechnungssparte': 'sparte',
  'abrechnungssparte': 'sparte',
  'category': 'sparte',
  'verteilungssparte': 'sparte',
  'spartennummer': 'sparteCode',
  // Nutzungsanzahl
  'nutzungsanzahl': 'nutzungsanzahl',
  'anzahl': 'nutzungsanzahl',
  'usage count': 'nutzungsanzahl',
  'nutzungen': 'nutzungsanzahl',
  // Betrag — official: BETRAG (col Z), U_BETRAG (col AK)
  'betrag': 'betrag',
  'netto-betrag': 'betrag',
  'nettobetrag': 'betrag',
  'amount': 'betrag',
  'abrechnungsbetrag': 'betrag',
  'ausschuettungsbetrag': 'betrag',
  'u_betrag': 'betrag',
  'neu-eur': 'betrag',
  'alt-eur': 'betragAlt',
  'delta-eur': 'betragDelta',
  // Nutzer / Plattform / Sender
  'nutzer': 'nutzer',
  'sendeanstalt': 'nutzer',
  'sender': 'nutzer',
  'plattform': 'nutzer',
  'lizenznehmer': 'nutzer',
  'user': 'nutzer',
  // Geschäftsjahr / Abrechnungsdatum
  'geschäftsjahr': 'geschaeftsjahr',
  'geschaeftsjahr': 'geschaeftsjahr',
  'gj': 'geschaeftsjahr',
  'fiscal year': 'geschaeftsjahr',
  'jahr': 'geschaeftsjahr',
  // Abrechnungsnummer — official: ABRENR (col A)
  'abrechnungsnummer': 'abrechnungsnummer',
  'abrechnungs-nr.': 'abrechnungsnummer',
  'abrenr': 'abrechnungsnummer',
  // Abrechnungsdatum — official: ABRE_DATUM_ALT (col C), format JJJJMMTT
  'abre_datum_alt': 'abrechnungsDatum',
  'datum der urspruenglichen abrechnung': 'abrechnungsDatum',
  'abrechnungsdatum': 'abrechnungsDatum',
  // Verteilungsperiode
  'verteilungstermin': 'verteilungsPeriode',
  'ausschüttungstermin': 'verteilungsPeriode',
  'vtl-nr': 'verteilungsNummer',
  'vtl-bez': 'verteilungsPeriode',
  'period': 'verteilungsPeriode',
};

function mapColumns(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  for (const header of headers) {
    const key = header.toLowerCase().trim();
    if (COLUMN_MAP[key]) {
      mapping[header] = COLUMN_MAP[key];
    }
  }
  return mapping;
}

function detectCsvVariant(headers: string[]): 'detail' | 'compact' | 'summary' {
  const headerSet = new Set(headers.map((h) => h.toLowerCase().trim()));
  if (headerSet.has('nutzer') || headerSet.has('sendeanstalt') || headerSet.has('nutzungsanzahl')) {
    return 'detail';
  }
  if (headerSet.has('werknummer') || headerSet.has('werk-nr.') || headerSet.has('werktitel')) {
    return 'compact';
  }
  return 'summary';
}

export interface CsvParseResult {
  entries: GemaRoyaltyEntry[];
  statement: ImportedStatement;
}

export function parseCsvFile(fileContent: string, fileName: string): CsvParseResult {
  const cleaned = stripBOM(fileContent);
  const warnings: string[] = [];

  // Parse with Papa Parse - GEMA CSVs use semicolons
  const result = Papa.parse<RawCsvRow>(cleaned, {
    header: true,
    delimiter: ';',
    skipEmptyLines: true,
    dynamicTyping: false,
  });

  if (result.errors.length > 0) {
    const critical = result.errors.filter((e) => e.type === 'FieldMismatch');
    if (critical.length > 0) {
      warnings.push(`${critical.length} Zeilen mit Feldabweichungen`);
    }
  }

  if (!result.meta.fields || result.meta.fields.length === 0) {
    throw new Error('CSV enthält keine Spaltenüberschriften');
  }

  const columnMapping = mapColumns(result.meta.fields);
  const variant = detectCsvVariant(result.meta.fields);
  const now = Date.now();

  let geschaeftsjahr = '';
  let verteilungsPeriode = '';

  const entries: GemaRoyaltyEntry[] = result.data
    .map((row) => {
      // Map raw CSV columns to internal field names
      const mapped: Record<string, string> = {};
      for (const [csvCol, internalField] of Object.entries(columnMapping)) {
        if (row[csvCol] !== undefined && row[csvCol] !== '') {
          mapped[internalField] = row[csvCol];
        }
      }

      // Skip rows without work number or amount
      if (!mapped.werknummer && !mapped.betrag) return null;

      // Build werknummer from WERKNR + FAS if separate
      let werknummer = (mapped.werknummer || '').trim();
      const fassung = (mapped.fassung || '').trim();
      if (werknummer && fassung && !werknummer.includes('-')) {
        werknummer = `${werknummer}-${fassung.padStart(3, '0')}`;
      }

      const werktitel = (mapped.werktitel || 'Unbekannt').trim();

      // Convert official numeric role codes to letters
      const rolleRaw = (mapped.rolle || '').trim();
      const ROLLE_NUMERIC: Record<string, string> = {
        '1': 'K', '2': 'B', '3': 'T', '4': 'V', '5': 'V',
        '6': 'K', '7': 'B', '8': 'T', '9': 'V',
      };
      const rolle = (ROLLE_NUMERIC[rolleRaw] || rolleRaw) as GemaRoyaltyEntry['rolle'];

      // Build anteil from zaehler/nenner if available
      let anteilRaw = (mapped.anteil || '').trim();
      if (!anteilRaw && mapped.anteilZaehler && mapped.anteilNenner) {
        anteilRaw = `${mapped.anteilZaehler}/${mapped.anteilNenner}`;
      }
      if (!anteilRaw) anteilRaw = '12/12';

      // Resolve sparte: prefer the short code, extract from description if needed
      const sparteDescription = (mapped.sparte || '').trim();
      const sparteCode = (mapped.sparteCode || '').trim();
      // Extract short code from descriptions like "MOD S: Music-on-Demand (Streaming)" → "MOD S"
      const sparteShort = sparteDescription.includes(':')
        ? sparteDescription.split(':')[0].trim()
        : sparteDescription;
      // For category mapping: prefer numeric/short code, then extracted short text
      const sparteForMapping = sparteCode || sparteShort;
      // For display: use the short readable name
      const sparte = sparteShort || sparteCode;
      const betragRaw = (mapped.betrag || '0').trim();
      const nutzer = (mapped.nutzer || '').trim();

      // Parse date format JJJJMMTT to year
      const abreDatum = (mapped.abrechnungsDatum || '').trim();
      let gj = (mapped.geschaeftsjahr || '').trim();
      if (!gj && abreDatum && abreDatum.length >= 4) {
        gj = abreDatum.substring(0, 4);
      }
      const vp = (mapped.verteilungsPeriode || '').trim();

      if (gj && !geschaeftsjahr) geschaeftsjahr = gj;
      if (vp && !verteilungsPeriode) verteilungsPeriode = vp;

      const betrag = parseGermanNumber(betragRaw);
      const anteilDecimal = parseAnteil(anteilRaw);

      return {
        id: generateEntryId(werknummer, sparte, nutzer, gj || verteilungsPeriode, betragRaw),
        werknummer,
        werktitel,
        rolle,
        anteilRaw,
        anteilDecimal,
        sparte,
        categoryGroup: mapSparteToCategory(sparteForMapping),
        nutzungsanzahl: parseGermanNumber(mapped.nutzungsanzahl || '0'),
        betrag,
        betragRaw,
        nutzer,
        geschaeftsjahr: gj || geschaeftsjahr,
        verteilungsPeriode: vp || verteilungsPeriode,
        sourceFile: fileName,
        importedAt: now,
      } satisfies GemaRoyaltyEntry;
    })
    .filter((e): e is GemaRoyaltyEntry => e !== null);

  const totalBetrag = entries.reduce((sum, e) => sum + e.betrag, 0);

  if (entries.length === 0) {
    warnings.push('Keine gültigen Einträge gefunden');
  }

  const statement: ImportedStatement = {
    id: `csv_${now}_${fileName}`,
    fileName,
    fileType: 'csv',
    formatVariant: variant,
    importedAt: now,
    geschaeftsjahr: geschaeftsjahr || 'Unbekannt',
    verteilungsPeriode: verteilungsPeriode || geschaeftsjahr || 'Unbekannt',
    entryCount: entries.length,
    totalBetrag,
    warnings,
  };

  return { entries, statement };
}
