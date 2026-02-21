import Papa from 'papaparse';
import type { GemaRoyaltyEntry, RawCsvRow, ImportedStatement } from '@/types/gema';
import { mapSparteToCategory } from '@/lib/constants/categories';
import { parseGermanNumber, parseAnteil, generateEntryId, stripBOM } from './parser-utils';

// Map various German CSV column headers to our internal field names
// Covers: KMP (Kompakt), MOD.S/R detail, SUM (Summary), ZSL (Zuschlag) formats
const COLUMN_MAP: Record<string, string> = {
  // === Werknummer ===
  'werk-nr.': 'werknummer',
  'werknummer': 'werknummer',
  'werknr': 'werknummer',
  'werk-nr': 'werknummer',
  'werkfassungsnummer': 'werknummer',
  'werk': 'werknummer',
  // === Werktitel ===
  'werktitel': 'werktitel',
  'werkfassungstitel': 'werktitel',
  'titel': 'werktitel',
  'work title': 'werktitel',
  'titel des werkes': 'werktitel',
  // === Fassung ===
  'fas': 'fassung',
  'fassung': 'fassung',
  'fassungsnummer': 'fassung',
  // === Rolle ===
  'rolle': 'rolle',
  'role': 'rolle',
  'beteiligtenrolle': 'rolle',
  'rol': 'rolle',
  'rolle_didas': 'rolle',
  'berufsgruppe': 'berufsgruppe',
  // === Anteil ===
  'anteil': 'anteil',
  'anteil prozent': 'anteilProzent',
  'share': 'anteil',
  'zaehler': 'anteilZaehler',
  'nenner': 'anteilNenner',
  'u_zaehler': 'anteilZaehler',
  'u_nenner': 'anteilNenner',
  'anteilart': 'anteilArt',
  'ant': 'anteilArt',
  // === Sparte ===
  'sparte': 'sparte',
  'bezeichnung abrechnungssparte': 'sparte',
  'abrechnungssparte': 'sparte',
  'category': 'sparte',
  'verteilungssparte': 'sparte',
  'spartennummer': 'sparteCode',
  'spartencode': 'sparteCode',
  'spartenkürzel': 'sparteKuerzel',
  'spartengruppe': 'spartengruppe',
  // === Nutzungsanzahl ===
  'nutzungsanzahl': 'nutzungsanzahl',
  'usage count': 'nutzungsanzahl',
  'nutzungen': 'nutzungsanzahl',
  'menge/anzahl': 'nutzungsanzahl',
  'anzahl aufführungen': 'nutzungsanzahlAlt',
  'anzahl ausstrahlungen': 'nutzungsanzahlAlt2',
  // === Betrag ===
  'betrag': 'betrag',
  'betrag gebucht': 'betragGebucht',
  'betrag (brutto)': 'betrag',
  'netto-betrag': 'betrag',
  'nettobetrag': 'betrag',
  'amount': 'betrag',
  'abrechnungsbetrag': 'betrag',
  'ausschuettungsbetrag': 'betrag',
  'ausschüttungsbetrag': 'betrag',
  'u_betrag': 'betrag',
  'neu-eur': 'betrag',
  'alt-eur': 'betragAlt',
  'delta-eur': 'betragDelta',
  'betrag ausfallzuschlag': 'betragAusfallzuschlag',
  'betrag sonstige zuschläge': 'betragSonstigeZuschlaege',
  // === Nutzer / Plattform / Sender ===
  'nutzer': 'nutzer',
  'sendeanstalt': 'nutzer',
  'sender': 'nutzer',
  'plattform': 'nutzer',
  'lizenznehmer': 'nutzer',
  'user': 'nutzer',
  'katalognummer': 'katalognummer',
  'art des streaming-abos': 'streamingAbo',
  // === Geschäftsjahr / Datum ===
  'geschäftsjahr': 'geschaeftsjahr',
  'geschaeftsjahr': 'geschaeftsjahr',
  'gj': 'geschaeftsjahr',
  'fiscal year': 'geschaeftsjahr',
  'jahr': 'geschaeftsjahr',
  'nutzungsjahr': 'nutzungsjahr',
  // === Abrechnungsnummer ===
  'abrechnungsnummer': 'abrechnungsnummer',
  'abrechnungs-nr.': 'abrechnungsnummer',
  'abrenr': 'abrechnungsnummer',
  // === Abrechnungsdatum ===
  'abre_datum_alt': 'abrechnungsDatum',
  'datum der urspruenglichen abrechnung': 'abrechnungsDatum',
  'abrechnungsdatum': 'abrechnungsDatum',
  // === Verteilungsperiode ===
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
  // SUM files have "satzzahl in kompaktaufstellung" and few columns
  if (headerSet.has('satzzahl in kompaktaufstellung') || headerSet.has('satzzahl in detailaufstellungen')) {
    return 'summary';
  }
  // KMP files have "spartencode" + "werknummer"
  if (headerSet.has('spartencode') || headerSet.has('spartenkürzel')) {
    return 'compact';
  }
  // Detail files (MOD.S, R, etc.) have "spartengruppe" + "verteilungssparte"
  if (headerSet.has('spartengruppe') || headerSet.has('verdichtungsnummer')) {
    return 'detail';
  }
  // Old-style detail detection
  if (headerSet.has('nutzer') || headerSet.has('sendeanstalt') || headerSet.has('nutzungsanzahl')) {
    return 'detail';
  }
  if (headerSet.has('werknummer') || headerSet.has('werk-nr.') || headerSet.has('werktitel')) {
    return 'compact';
  }
  return 'summary';
}

// Map text role names to short codes
const ROLLE_TEXT: Record<string, string> = {
  'komponist': 'K',
  'textdichter': 'T',
  'bearbeiter': 'B',
  'verleger': 'V',
  'verlag': 'V',
};

// Map Berufsgruppe numeric codes
const BERUFSGRUPPE_MAP: Record<string, string> = {
  '1': 'K', // Komponist
  '2': 'B', // Bearbeiter
  '3': 'T', // Textdichter
  '4': 'V', // Verleger
  '5': 'V',
};

// Map Beteiligtenrolle numeric codes
const ROLLE_NUMERIC: Record<string, string> = {
  '1': 'K', '2': 'B', '3': 'T', '4': 'V', '5': 'V',
  '6': 'K', '7': 'B', '8': 'T', '9': 'V',
};

// Clean up licensee names to friendly platform names
function cleanPlatformName(lizenznehmer: string, katalog: string, aboType: string): string {
  // Prefer catalog number (friendly name) or abo type over full company name
  const friendly = katalog || aboType || '';
  if (friendly) {
    // Clean up patterns like "Tidal-HIFI-normal-" → "Tidal" or "Tidal" → "Tidal"
    const cleaned = friendly.replace(/-+$/, '').replace(/[_-](HIFI|normal|premium|free|family).*$/i, '').trim();
    if (cleaned) return cleaned;
  }
  // Fall back to Lizenznehmer, strip company suffixes
  return lizenznehmer
    .replace(/\s+(AS|SA|GmbH|Inc|Ltd|LLC|SE|AG|B\.V\.|BV|AB|Oy|S\.A\.|SAS|S\.r\.l\.)\.?\s*$/i, '')
    .replace(/\s+Music\s*$/i, '')
    .trim();
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
      const hasBetrag = mapped.betragGebucht || mapped.betrag;
      if (!mapped.werknummer && !hasBetrag) return null;

      // Build werknummer from WERKNR + FAS if separate
      let werknummer = (mapped.werknummer || '').trim();
      // Strip surrounding quotes that sometimes appear in GEMA CSVs
      werknummer = werknummer.replace(/^"|"$/g, '');
      const fassung = (mapped.fassung || '').trim().replace(/^"|"$/g, '');
      if (werknummer && fassung && !werknummer.includes('-')) {
        werknummer = `${werknummer}-${fassung.padStart(3, '0')}`;
      }

      const werktitel = (mapped.werktitel || 'Unbekannt').trim();

      // Resolve role: text name > berufsgruppe > numeric code
      let rolleRaw = (mapped.rolle || '').trim();
      const berufsgruppe = (mapped.berufsgruppe || '').trim();
      let rolle: string;
      // Check if it's a full text role name
      const textRole = ROLLE_TEXT[rolleRaw.toLowerCase()];
      if (textRole) {
        rolle = textRole;
      } else if (BERUFSGRUPPE_MAP[berufsgruppe]) {
        rolle = BERUFSGRUPPE_MAP[berufsgruppe];
      } else if (ROLLE_NUMERIC[rolleRaw]) {
        rolle = ROLLE_NUMERIC[rolleRaw];
      } else {
        rolle = rolleRaw || 'K';
      }

      // Resolve anteil: "Anteil Prozent" (e.g., 64.0) > fraction > zaehler/nenner
      let anteilRaw = (mapped.anteil || '').trim();
      const anteilProzent = (mapped.anteilProzent || '').trim();
      let anteilDecimal: number;

      if (anteilProzent) {
        // Real GEMA uses percentage like "64,0000000000" = 64%
        const pct = parseGermanNumber(anteilProzent);
        anteilDecimal = pct > 0 ? pct / 100 : 1;
        anteilRaw = `${pct}%`;
      } else if (anteilRaw) {
        anteilDecimal = parseAnteil(anteilRaw);
      } else if (mapped.anteilZaehler && mapped.anteilNenner) {
        anteilRaw = `${mapped.anteilZaehler}/${mapped.anteilNenner}`;
        anteilDecimal = parseAnteil(anteilRaw);
      } else {
        anteilRaw = '100%';
        anteilDecimal = 1;
      }

      // Resolve sparte: prefer Spartenkürzel > Spartencode > extract from description
      const sparteDescription = (mapped.sparte || '').trim();
      const sparteCode = (mapped.sparteCode || '').trim().replace(/^"|"$/g, '');
      const sparteKuerzel = (mapped.sparteKuerzel || '').trim().replace(/^"|"$/g, '');
      // Extract short code from descriptions like "Music on Demand Streaming (MOD S)" → "MOD S"
      // or "MOD S: Music-on-Demand (Streaming)" → "MOD S"
      let sparteShort = '';
      if (sparteDescription) {
        const parenMatch = sparteDescription.match(/\(([^)]+)\)\s*$/);
        const colonMatch = sparteDescription.match(/^([^:]+):/);
        sparteShort = parenMatch ? parenMatch[1].trim() : colonMatch ? colonMatch[1].trim() : sparteDescription;
      }
      // For category mapping: prefer kuerzel, then numeric code, then extracted
      const sparteForMapping = sparteKuerzel || sparteCode || sparteShort;
      // For display: prefer the readable abbreviation
      const sparte = sparteKuerzel || sparteShort || sparteCode;

      // Resolve betrag: prefer "Betrag gebucht" (includes supplements) over raw "Betrag"
      const betragGebuchtRaw = (mapped.betragGebucht || '').trim();
      const betragRaw = betragGebuchtRaw || (mapped.betrag || '0').trim();

      // Resolve nutzer/platform: prefer Katalognummer > Streaming-Abo > Lizenznehmer > Sender
      const lizenznehmer = (mapped.nutzer || '').trim();
      const katalog = (mapped.katalognummer || '').trim();
      const streamingAbo = (mapped.streamingAbo || '').trim();
      const nutzer = cleanPlatformName(lizenznehmer, katalog, streamingAbo);

      // Resolve nutzungsanzahl: pick the most specific count available
      let nutzungsanzahlStr = (mapped.nutzungsanzahl || '').trim();
      if (!nutzungsanzahlStr) nutzungsanzahlStr = (mapped.nutzungsanzahlAlt || '').trim();
      if (!nutzungsanzahlStr) nutzungsanzahlStr = (mapped.nutzungsanzahlAlt2 || '').trim();

      // Resolve geschaeftsjahr: nutzungsjahr > geschaeftsjahr > extract from date
      const abreDatum = (mapped.abrechnungsDatum || '').trim();
      let gj = (mapped.nutzungsjahr || mapped.geschaeftsjahr || '').trim();
      if (!gj && abreDatum && abreDatum.length >= 4) {
        gj = abreDatum.substring(0, 4);
      }
      const vp = (mapped.verteilungsPeriode || '').trim();

      if (gj && !geschaeftsjahr) geschaeftsjahr = gj;
      if (vp && !verteilungsPeriode) verteilungsPeriode = vp;

      const betrag = parseGermanNumber(betragRaw);

      return {
        id: generateEntryId(werknummer, sparte, nutzer, gj || verteilungsPeriode, betragRaw),
        werknummer,
        werktitel,
        rolle: rolle as GemaRoyaltyEntry['rolle'],
        anteilRaw,
        anteilDecimal,
        sparte,
        categoryGroup: mapSparteToCategory(sparteForMapping),
        nutzungsanzahl: parseGermanNumber(nutzungsanzahlStr || '0'),
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
