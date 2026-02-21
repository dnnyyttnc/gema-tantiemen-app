import Papa from 'papaparse';
import type { GemaRoyaltyEntry, RawCsvRow, ImportedStatement } from '@/types/gema';
import {
  mapSparteToCategory,
  CATEGORY_CODE_TO_SPARTE,
  PROFESSIONAL_CATEGORY_MAP,
  ROLE_CODE_MAP,
} from '@/lib/constants/categories';
import { parseGermanNumber, parseNumber, parseAnteil, generateEntryId, stripBOM } from './parser-utils';

// ============================================================================
// COLUMN MAPPING
// Supports all GEMA CSV format versions:
//   v1.0 (≤ April 2025): German column headers, comma decimal separator
//   v2.0 (June 2025): Consolidated English column headers, period decimal separator
//   v2.1 (July 2025): Reduced detail structures
//   v2.2 (Nov 2025): Added distribution_type to KMP
//
// Source: GEMA Royalty Specifications v2.20 (01.11.2025)
// ============================================================================
const COLUMN_MAP: Record<string, string> = {
  // === Werknummer / Work Number ===
  'werk-nr.': 'werknummer',
  'werknummer': 'werknummer',
  'werknr': 'werknummer',
  'werk-nr': 'werknummer',
  'werkfassungsnummer': 'werknummer',
  'werk': 'werknummer',
  'work_number': 'werknummer',             // KMP v2.0+
  'work_version_number': 'werkVersionNr',  // Detail v2.0+ (format: "123456-001")

  // === Version Number (KMP separate field) ===
  'fas': 'fassung',
  'fassung': 'fassung',
  'fassungsnummer': 'fassung',
  'version_number': 'fassung',             // KMP v2.0+

  // === Werktitel / Work Title ===
  'werktitel': 'werktitel',
  'werkfassungstitel': 'werktitel',
  'titel': 'werktitel',
  'work title': 'werktitel',
  'titel des werkes': 'werktitel',
  'work_version_titel': 'werktitel',       // v2.0+ (all formats)

  // === Rolle / Role ===
  'rolle': 'rolle',
  'role': 'rolle',                         // v2.0+ detail formats (numeric 0-5)
  'beteiligtenrolle': 'rolle',
  'rol': 'rolle',
  'rolle_didas': 'rolle',
  'berufsgruppe': 'berufsgruppe',
  'professional_category': 'professionalCategory', // KMP v2.0+ (numeric 0-9)

  // === Anteil / Percentage ===
  'anteil': 'anteil',
  'anteil prozent': 'anteilProzent',
  'share': 'anteil',
  'zaehler': 'anteilZaehler',
  'nenner': 'anteilNenner',
  'u_zaehler': 'anteilZaehler',
  'u_nenner': 'anteilNenner',
  'anteilart': 'anteilArt',
  'ant': 'anteilArt',
  'percentage': 'anteilProzent',           // v2.0+ (all formats, decimal with '.')

  // === Sparte / Category ===
  'sparte': 'sparte',
  'bezeichnung abrechnungssparte': 'sparte',
  'abrechnungssparte': 'sparte',
  'category': 'sparte',
  'verteilungssparte': 'sparte',
  'spartennummer': 'sparteCode',
  'spartencode': 'sparteCode',
  'spartenkürzel': 'sparteKuerzel',
  'spartengruppe': 'spartengruppe',
  'category_code': 'categoryCode',                 // KMP v2.0+
  'category_abbreviation': 'categoryAbbreviation',  // KMP v2.0+
  'segment_group': 'segmentGroup',                  // Detail v2.0+
  'distribution_category': 'distributionCategory',  // Detail v2.0+

  // === Nutzungsanzahl / Quantity ===
  'nutzungsanzahl': 'nutzungsanzahl',
  'usage count': 'nutzungsanzahl',
  'nutzungen': 'nutzungsanzahl',
  'menge/anzahl': 'nutzungsanzahl',
  'anzahl aufführungen': 'nutzungsanzahlAlt',
  'anzahl ausstrahlungen': 'nutzungsanzahlAlt2',
  'quantity': 'nutzungsanzahl',                      // v2.0+
  'number_of_performances': 'nutzungsanzahlAlt',     // Live v2.0+
  'number_of_broadcasts': 'nutzungsanzahlAlt2',      // Radio/TV v2.0+

  // === Betrag / Amount ===
  'betrag': 'betrag',
  'betrag gebucht': 'betragGebucht',
  'betrag (brutto)': 'betrag',
  'netto-betrag': 'betrag',
  'nettobetrag': 'betrag',
  'amount': 'betrag',                                // v2.0+ (base amount)
  'abrechnungsbetrag': 'betrag',
  'ausschuettungsbetrag': 'betrag',
  'ausschüttungsbetrag': 'betrag',
  'u_betrag': 'betrag',
  'neu-eur': 'betrag',
  'alt-eur': 'betragAlt',
  'delta-eur': 'betragDelta',
  'betrag ausfallzuschlag': 'betragAusfallzuschlag',
  'betrag sonstige zuschläge': 'betragSonstigeZuschlaege',
  'booked_amount': 'betragGebucht',                  // v2.0+ (final incl. supplements)
  'gross_amount': 'betrag',                          // MECH v2.0+
  'amount_other_supplements': 'betragSonstigeZuschlaege', // v2.0+
  'amount_unallocated_royalties': 'betragUnallocated',    // v2.0+
  'commission_amount': 'kommissionBetrag',                // v2.0+
  'commission_rate_in_prc': 'kommissionRate',             // v2.0+

  // === Nutzer / Plattform / Sender ===
  'nutzer': 'nutzer',
  'sendeanstalt': 'nutzer',
  'sender': 'nutzer',
  'plattform': 'nutzer',
  'lizenznehmer': 'nutzer',
  'user': 'nutzer',
  'licensee': 'nutzer',                     // v2.0+ (Online, MECH, Foreign)
  'broadcaster': 'sender',                  // v2.0+ (Radio, TV)
  'katalognummer': 'katalognummer',
  'catalogue_number': 'katalognummer',       // v2.0+
  'art des streaming-abos': 'streamingAbo',
  'type_of_streaming_subscription': 'streamingAbo', // v2.0+

  // === Geschäftsjahr / Year ===
  'geschäftsjahr': 'geschaeftsjahr',
  'geschaeftsjahr': 'geschaeftsjahr',
  'gj': 'geschaeftsjahr',
  'fiscal year': 'geschaeftsjahr',
  'jahr': 'geschaeftsjahr',
  'nutzungsjahr': 'nutzungsjahr',
  'year_of_use': 'nutzungsjahr',            // v2.0+

  // === Abrechnungsnummer / Statement Number ===
  'abrechnungsnummer': 'abrechnungsnummer',
  'abrechnungs-nr.': 'abrechnungsnummer',
  'abrenr': 'abrechnungsnummer',
  'statement_number': 'abrechnungsnummer',   // v2.0+

  // === Abrechnungsdatum / Payout Date ===
  'abre_datum_alt': 'abrechnungsDatum',
  'datum der urspruenglichen abrechnung': 'abrechnungsDatum',
  'abrechnungsdatum': 'abrechnungsDatum',
  'payout_date': 'payoutDate',               // v2.0+ (YYYY-MM-DD)

  // === Verteilungsperiode / Distribution Period ===
  'verteilungstermin': 'verteilungsPeriode',
  'ausschüttungstermin': 'verteilungsPeriode',
  'vtl-nr': 'verteilungsNummer',
  'vtl-bez': 'verteilungsPeriode',
  'period': 'verteilungsPeriode',
  'nutzungsdatum von': 'dateOfUseFrom',       // v1.0 detail (DD.MM.YYYY)
  'nutzungsdatum bis': 'dateOfUseUntil',      // v1.0 detail (DD.MM.YYYY)
  'date_of_use_from': 'dateOfUseFrom',        // v2.0+ (YYYY-MM-DD)
  'date_of_use_until': 'dateOfUseUntil',      // v2.0+ (YYYY-MM-DD)
  'quartal von': 'quarterFrom',               // KMP v1.0
  'quartal bis': 'quarterUntil',              // KMP v1.0
  'quarter_from': 'quarterFrom',              // KMP v2.0+
  'quarter_until': 'quarterUntil',            // KMP v2.0+

  // === Verteilungsart / Distribution Type ===
  'verteilungsart': 'distributionType',       // v1.0 (German: Hauptverteilung etc.)
  'verteilart': 'distributionType',           // v2.0 hybrid (German label for dist. type code)
  'distribution_type': 'distributionType',    // v2.0+ (HV/NV/KV/VV/FV)
  'distribution_code': 'distributionCode',    // v2.0+ (foreign dist. codes)

  // === Debit/Credit ===
  'rück-/nachverrechnung': 'debitCredit',     // v1.0
  'debit_credit_adjustment': 'debitCredit',   // v2.0+ (RV/NV/KA)

  // === Revenue Type ===
  'aufkommensart': 'revenueType',             // v1.0 (Hauptkonto/Sonderkonto)
  'umsatzart': 'salesType',                   // v1.0 Online detail
  'revenue_type': 'revenueType',              // v2.0+ (HK/SK)

  // === Zuschläge / Supplements (ZSL format) ===
  'zuschlagsart': 'supplementType',           // v1.0 ZSL

  // === Composer / Editor ===
  'komponist(en)': 'composer',               // v1.0 detail
  'composer': 'composer',                    // v2.0+
  'bearbeiter': 'editor',                    // v1.0 detail (also a column name)
  'editor': 'editor',                        // v2.0+

  // === Additional fields ===
  'iswc': 'iswc',                            // v1.0 + v2.0+
  'isrc': 'isrc',                            // v1.0 + v2.0+
  'identifikator': 'isrc',                   // v1.0 newer variant
  'trägerart': 'carrierCode',                // v1.0 (Streaming, Download, etc.)
  'carrier_code': 'carrierCode',             // v2.0+
  'verkaufsland': 'salesCountry',            // v1.0
  'sales_country': 'salesCountry',           // v2.0+
  'repertoire typ': 'repertoireType',        // v1.0 hybrid (added mid-2025)
  'type_of_repertoire': 'repertoireType',    // v2.0+
  'kommissionsbetrag': 'kommissionBetrag',   // v1.0 KMP/ZSL
  'kommissionssatz in %': 'kommissionRate',  // v1.0 KMP/ZSL
  'betrag nicht programmbelegter anteil': 'betragUnallocated', // v1.0 KMP
  'lizenzwert in euro': 'licenseValue',      // v1.0 KMP/detail
  'verteilungskategorie': 'distributionCategory', // v1.0 detail/KMP

  // === SUM (Summary Sheet) ===
  'nutzungsbereich': 'usageArea',             // SUM v1.0 (German)
  'usage_area': 'usageArea',                  // SUM v2.0+
  'satzzahl in kompaktaufstellung': 'recordCountCompact',
  'satzzahl in kombinierter aufstellung': 'recordCountDetail',
  'satzzahl in detailaufstellungen': 'recordCountDetail',
  'record_count_in_compact_statement': 'recordCountCompact',
  'record_count_in_detailed_statement': 'recordCountDetail',
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

/** Detect whether this is a v2.0+ machine-readable format (English column names, period decimals) */
function isV2Format(headers: string[]): boolean {
  const headerSet = new Set(headers.map(h => h.toLowerCase().trim()));
  return headerSet.has('payout_date') ||
    headerSet.has('booked_amount') ||
    headerSet.has('work_version_number') ||
    headerSet.has('work_version_titel') ||
    headerSet.has('segment_group') ||
    headerSet.has('category_code');
}

function detectCsvVariant(headers: string[]): 'detail' | 'compact' | 'summary' {
  const headerSet = new Set(headers.map((h) => h.toLowerCase().trim()));

  // === v2.0+ format detection ===
  // SUM: has usage_area (v2.0+) or nutzungsbereich (v1.0)
  if (headerSet.has('usage_area') || headerSet.has('record_count_in_compact_statement') || headerSet.has('nutzungsbereich')) {
    return 'summary';
  }
  // KMP: has category_code (unique to compact statement)
  if (headerSet.has('category_code') || headerSet.has('category_abbreviation')) {
    return 'compact';
  }
  // Detail formats: have segment_group + distribution_category
  if (headerSet.has('segment_group') && headerSet.has('distribution_category')) {
    return 'detail';
  }

  // === v1.0 format detection ===
  if (headerSet.has('satzzahl in kompaktaufstellung') || headerSet.has('satzzahl in detailaufstellungen')) {
    return 'summary';
  }
  if (headerSet.has('spartencode') || headerSet.has('spartenkürzel')) {
    return 'compact';
  }
  if (headerSet.has('spartengruppe') || headerSet.has('verdichtungsnummer')) {
    return 'detail';
  }
  if (headerSet.has('nutzer') || headerSet.has('sendeanstalt') || headerSet.has('nutzungsanzahl')) {
    return 'detail';
  }
  if (headerSet.has('werknummer') || headerSet.has('werk-nr.') || headerSet.has('werktitel')) {
    return 'compact';
  }
  return 'summary';
}

/** Extract 4-digit year from date strings in either YYYY-MM-DD or DD.MM.YYYY format */
function extractYear(dateStr: string): string {
  if (/^\d{4}[/-]/.test(dateStr)) return dateStr.substring(0, 4); // ISO: YYYY-MM-DD
  const match = dateStr.match(/(\d{4})$/);
  if (match) return match[1]; // German: DD.MM.YYYY
  return dateStr.substring(0, 4); // fallback
}

// Map text role names to short codes
const ROLLE_TEXT: Record<string, string> = {
  'komponist': 'K',
  'textdichter': 'T',
  'bearbeiter': 'B',
  'verleger': 'V',
  'verlag': 'V',
};

// Clean up licensee names to friendly platform names
function cleanPlatformName(lizenznehmer: string, katalog: string, aboType: string): string {
  const friendly = katalog || aboType || '';
  if (friendly) {
    const cleaned = friendly.replace(/-+$/, '').replace(/[_-](HIFI|normal|premium|free|family).*$/i, '').trim();
    if (cleaned) return cleaned;
  }
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
  const v2 = isV2Format(result.meta.fields);
  const now = Date.now();

  // Choose number parser based on format version
  // v2.0+ uses '.' as decimal separator, v1.0 uses ',' (German locale)
  const parseNum = v2 ? parseNumber : parseGermanNumber;

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
      if (!mapped.werknummer && !mapped.werkVersionNr && !hasBetrag) return null;

      // =====================================================================
      // WORK NUMBER resolution
      // v2.0+ detail: work_version_number = "123456-001" (combined)
      // v2.0+ KMP: work_number + version_number (separate fields)
      // v1.0: werknummer + fassung (separate fields)
      // =====================================================================
      let werknummer = '';
      if (mapped.werkVersionNr) {
        // v2.0+ detail format: already combined "123456-001"
        werknummer = mapped.werkVersionNr.trim().replace(/^"|"$/g, '');
      } else {
        werknummer = (mapped.werknummer || '').trim().replace(/^"|"$/g, '');
        const fassung = (mapped.fassung || '').trim().replace(/^"|"$/g, '');
        if (werknummer && fassung && !werknummer.includes('-')) {
          werknummer = `${werknummer}-${fassung.padStart(3, '0')}`;
        }
      }

      const werktitel = (mapped.werktitel || 'Unbekannt').trim();

      // =====================================================================
      // ROLE resolution
      // v2.0+ KMP: professional_category (0-9)
      // v2.0+ detail: role (0-5)
      // v1.0: text name / berufsgruppe / numeric
      // =====================================================================
      let rolle: string;
      const profCat = (mapped.professionalCategory || '').trim();
      const rolleRaw = (mapped.rolle || '').trim();
      const berufsgruppe = (mapped.berufsgruppe || '').trim();

      if (profCat && PROFESSIONAL_CATEGORY_MAP[profCat]) {
        rolle = PROFESSIONAL_CATEGORY_MAP[profCat];
      } else if (rolleRaw && ROLE_CODE_MAP[rolleRaw]) {
        // v2.0+ detail format: numeric 0-5
        rolle = ROLE_CODE_MAP[rolleRaw];
      } else if (rolleRaw && ROLLE_TEXT[rolleRaw.toLowerCase()]) {
        // v1.0: German text name
        rolle = ROLLE_TEXT[rolleRaw.toLowerCase()];
      } else if (berufsgruppe && PROFESSIONAL_CATEGORY_MAP[berufsgruppe]) {
        rolle = PROFESSIONAL_CATEGORY_MAP[berufsgruppe];
      } else {
        rolle = rolleRaw || 'K';
      }

      // =====================================================================
      // SHARE / PERCENTAGE resolution
      // v2.0+ all formats: "percentage" field (decimal with '.', e.g., 41.6666666667)
      // v1.0: anteil fraction (5/12), percentage (64,0000000000), zaehler/nenner
      // =====================================================================
      let anteilRaw = (mapped.anteil || '').trim();
      const anteilProzent = (mapped.anteilProzent || '').trim();
      let anteilDecimal: number;

      if (anteilProzent) {
        const pct = parseNum(anteilProzent);
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

      // =====================================================================
      // SPARTE / CATEGORY resolution
      // v2.0+ KMP: category_code (e.g., "12") + category_abbreviation (e.g., "MOD S")
      // v2.0+ detail: segment_group + distribution_category
      // v1.0: spartencode / spartenkürzel / text description
      // =====================================================================
      const categoryCode = (mapped.categoryCode || '').trim();
      const categoryAbbr = (mapped.categoryAbbreviation || '').trim();
      const segmentGroup = (mapped.segmentGroup || '').trim();
      const distCategory = (mapped.distributionCategory || '').trim();
      const sparteDescription = (mapped.sparte || '').trim();
      const sparteCode = (mapped.sparteCode || '').trim().replace(/^"|"$/g, '');
      const sparteKuerzel = (mapped.sparteKuerzel || '').trim().replace(/^"|"$/g, '');

      let sparteForMapping = '';
      let sparteDisplay = '';

      if (categoryAbbr) {
        // v2.0+ KMP: abbreviation is the direct sparte name
        sparteDisplay = categoryAbbr;
        sparteForMapping = categoryAbbr;
      } else if (categoryCode && CATEGORY_CODE_TO_SPARTE[categoryCode]) {
        // v2.0+ KMP: resolve numeric code to sparte name
        sparteDisplay = CATEGORY_CODE_TO_SPARTE[categoryCode];
        sparteForMapping = categoryCode;
      } else if (distCategory) {
        // v2.0+ detail: distribution_category IS the sparte name
        sparteDisplay = distCategory;
        sparteForMapping = distCategory;
      } else if (sparteKuerzel) {
        sparteDisplay = sparteKuerzel;
        sparteForMapping = sparteKuerzel;
      } else if (sparteCode) {
        sparteDisplay = CATEGORY_CODE_TO_SPARTE[sparteCode] || sparteCode;
        sparteForMapping = sparteCode;
      } else if (sparteDescription) {
        // Extract short code from descriptions like "Music on Demand Streaming (MOD S)"
        const parenMatch = sparteDescription.match(/\(([^)]+)\)\s*$/);
        const colonMatch = sparteDescription.match(/^([^:]+):/);
        sparteDisplay = parenMatch ? parenMatch[1].trim() : colonMatch ? colonMatch[1].trim() : sparteDescription;
        sparteForMapping = sparteDisplay;
      }

      const sparte = sparteDisplay || sparteForMapping;

      // =====================================================================
      // AMOUNT resolution
      // v2.0+: booked_amount is the final amount (includes all supplements)
      // v1.0: "Betrag gebucht" or "Betrag"
      // =====================================================================
      const betragGebuchtRaw = (mapped.betragGebucht || '').trim();
      const betragRaw = betragGebuchtRaw || (mapped.betrag || '0').trim();

      // =====================================================================
      // PLATFORM / USER resolution
      // v2.0+: licensee (Online, MECH) or broadcaster (Radio, TV)
      // v1.0: nutzer / sendeanstalt / lizenznehmer
      // =====================================================================
      const lizenznehmer = (mapped.nutzer || '').trim();
      const sender = (mapped.sender || '').trim();
      const katalog = (mapped.katalognummer || '').trim();
      const streamingAbo = (mapped.streamingAbo || '').trim();
      const nutzer = cleanPlatformName(sender || lizenznehmer, katalog, streamingAbo);

      // =====================================================================
      // QUANTITY / USAGE COUNT resolution
      // =====================================================================
      let nutzungsanzahlStr = (mapped.nutzungsanzahl || '').trim();
      if (!nutzungsanzahlStr) nutzungsanzahlStr = (mapped.nutzungsanzahlAlt || '').trim();
      if (!nutzungsanzahlStr) nutzungsanzahlStr = (mapped.nutzungsanzahlAlt2 || '').trim();

      // =====================================================================
      // YEAR / PERIOD resolution
      // v2.0+: payout_date (YYYY-MM-DD), year_of_use, date_of_use_from/until
      // v1.0: geschaeftsjahr, nutzungsjahr, abrechnungsdatum
      // =====================================================================
      const payoutDate = (mapped.payoutDate || '').trim();
      const dateOfUseFrom = (mapped.dateOfUseFrom || '').trim();
      const abreDatum = (mapped.abrechnungsDatum || '').trim();
      let gj = (mapped.nutzungsjahr || mapped.geschaeftsjahr || '').trim();

      if (!gj && dateOfUseFrom && dateOfUseFrom.length >= 4) {
        gj = extractYear(dateOfUseFrom);
      }
      if (!gj && payoutDate && payoutDate.length >= 4) {
        gj = extractYear(payoutDate);
      }
      if (!gj && abreDatum && abreDatum.length >= 4) {
        gj = extractYear(abreDatum);
      }

      // Build a period string from available data
      let vp = (mapped.verteilungsPeriode || '').trim();
      if (!vp && payoutDate) {
        vp = payoutDate.substring(0, 7); // YYYY-MM
      }

      if (gj && !geschaeftsjahr) geschaeftsjahr = gj;
      if (vp && !verteilungsPeriode) verteilungsPeriode = vp;

      const betrag = parseNum(betragRaw);

      return {
        id: generateEntryId(werknummer, sparte, nutzer, gj || verteilungsPeriode, betragRaw),
        werknummer,
        werktitel,
        rolle: rolle as GemaRoyaltyEntry['rolle'],
        anteilRaw,
        anteilDecimal,
        sparte,
        categoryGroup: mapSparteToCategory(sparteForMapping || sparte),
        nutzungsanzahl: parseNum(nutzungsanzahlStr || '0'),
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
