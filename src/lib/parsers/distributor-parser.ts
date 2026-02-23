import type { DistributorEntry, ImportedDistributorStatement } from '@/types/distributor';
import { normalizeRetailerName } from '@/lib/constants/platforms';
import { classifySalesType } from '@/lib/constants/sales-types';

// --- Column Profiles ---

interface ColumnProfile {
  name: string;
  /** Headers that must be present (case-insensitive substring match) */
  requiredHeaders: string[];
  /** Map from our field → column header name */
  columns: {
    period?: string;
    retailer?: string;
    reportingPeriod?: string;
    labelName?: string;
    mainArtist?: string;
    albumName?: string;
    trackName?: string;
    isrc?: string;
    countryCode?: string;
    salesDescription?: string;
    quantity?: string;
    netAmount?: string;
  };
}

const PROFILES: ColumnProfile[] = [
  {
    name: 'argonauta',
    requiredHeaders: ['retailer', 'main artist', 'album name', 'net amount after fees'],
    columns: {
      period: 'period',
      retailer: 'retailer',
      reportingPeriod: 'retailer reporting period',
      labelName: 'label name',
      mainArtist: 'main artist',
      albumName: 'album name',
      trackName: 'track name',
      isrc: 'isrc',
      countryCode: 'country code a2',
      salesDescription: 'sales description',
      quantity: 'quantity',
      netAmount: 'net amount after fees (usd)',
    },
  },
  {
    name: 'distrokid',
    requiredHeaders: ['reporting date', 'store', 'earnings (usd)'],
    columns: {
      period: 'reporting date',
      retailer: 'store',
      reportingPeriod: 'sale month',
      mainArtist: 'artist',
      albumName: 'album',
      trackName: 'title',
      isrc: 'isrc',
      countryCode: 'country of sale',
      salesDescription: 'sale type',
      quantity: 'quantity',
      netAmount: 'earnings (usd)',
    },
  },
  {
    name: 'tunecore',
    requiredHeaders: ['store name', 'sales period'],
    columns: {
      period: 'sales period',
      retailer: 'store name',
      reportingPeriod: 'sales period',
      labelName: 'label',
      mainArtist: 'artist',
      albumName: 'release title',
      trackName: 'song title',
      isrc: 'isrc',
      countryCode: 'country code',
      salesDescription: 'sales type',
      quantity: 'quantity',
      netAmount: 'total earned',
    },
  },
  {
    name: 'cdbaby',
    requiredHeaders: ['payable', 'qty'],
    columns: {
      period: 'trans date',
      retailer: 'channel',
      mainArtist: 'artist',
      albumName: 'album',
      trackName: 'disc/track',
      isrc: 'upc/ean',
      countryCode: 'country',
      salesDescription: 'unit',
      quantity: 'qty',
      netAmount: 'payable',
    },
  },
];

/** Generic profile: auto-detect by scanning for known column name patterns */
const GENERIC_COLUMN_PATTERNS: Record<string, string[]> = {
  period: ['period', 'date', 'month', 'reporting date', 'sales period', 'trans date'],
  retailer: ['retailer', 'store', 'store name', 'channel', 'platform', 'service', 'dsp'],
  mainArtist: ['artist', 'main artist', 'performer'],
  albumName: ['album', 'album name', 'release', 'release title', 'product'],
  trackName: ['track', 'track name', 'title', 'song', 'song title'],
  isrc: ['isrc', 'upc', 'upc/ean', 'ean', 'gtin'],
  countryCode: ['country code', 'country code a2', 'country', 'territory', 'region'],
  salesDescription: ['sales description', 'sales type', 'sale type', 'type', 'unit', 'content type'],
  quantity: ['quantity', 'qty', 'plays', 'streams', 'units', 'count'],
  netAmount: ['net amount', 'earnings', 'revenue', 'payable', 'total earned', 'amount', 'payout'],
  labelName: ['label', 'label name'],
  reportingPeriod: ['reporting period', 'retailer reporting period', 'sale month'],
};

export interface DistributorParseResult {
  entries: DistributorEntry[];
  statement: ImportedDistributorStatement;
}

export async function parseDistributorFile(
  buffer: ArrayBuffer,
  fileName: string
): Promise<DistributorParseResult> {
  // Dynamic import for code-splitting — SheetJS only loaded when needed
  const XLSX = await import('xlsx');

  const ext = fileName.toLowerCase().split('.').pop() || '';
  let workbook: ReturnType<typeof XLSX.read>;

  if (ext === 'tsv' || ext === 'txt') {
    const text = new TextDecoder('utf-8').decode(buffer);
    workbook = XLSX.read(text, { type: 'string', FS: '\t', raw: true });
  } else if (ext === 'csv') {
    const text = new TextDecoder('utf-8').decode(buffer);
    workbook = XLSX.read(text, { type: 'string', raw: true });
  } else {
    workbook = XLSX.read(buffer, { type: 'array', raw: true });
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error('Die Datei enthält keine Daten.');

  const sheet = workbook.Sheets[sheetName];
  const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  if (rows.length === 0) throw new Error('Die Datei enthält keine Datenzeilen.');

  const headers = Object.keys(rows[0]).map((h) => h.toLowerCase().trim());
  const profile = detectProfile(headers);
  const warnings: string[] = [];

  if (!profile) {
    throw new Error(
      'Unbekanntes Distributor-Format. Erwartete Spalten wie "Retailer", "Quantity", "Earnings" wurden nicht gefunden.'
    );
  }

  // Build column header mapping
  const colMap = resolveColumnMap(profile, headers, Object.keys(rows[0]));

  const now = Date.now();
  const fileType = ext === 'tsv' ? 'tsv' : ext === 'csv' ? 'csv' : 'xlsx';
  const entries: DistributorEntry[] = [];
  let totalAmountUsd = 0;
  let minPeriod = 'zzzz';
  let maxPeriod = '';

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    const retailerRaw = getVal(row, colMap.retailer);
    const quantity = parseNum(getVal(row, colMap.quantity));
    const netAmount = parseNum(getVal(row, colMap.netAmount));
    const period = normalizePeriod(getVal(row, colMap.period));
    const reportingPeriod = normalizePeriod(getVal(row, colMap.reportingPeriod)) || period;
    const countryCode = (getVal(row, colMap.countryCode) || '').toUpperCase().slice(0, 2);
    const salesDesc = getVal(row, colMap.salesDescription);
    const albumName = getVal(row, colMap.albumName);
    const trackName = getVal(row, colMap.trackName);
    const mainArtist = getVal(row, colMap.mainArtist);
    const isrc = getVal(row, colMap.isrc);
    const labelName = getVal(row, colMap.labelName);

    // Skip rows with no retailer (summary/total rows) or no data at all
    if (!retailerRaw) continue;
    if (netAmount === 0 && quantity === 0) continue;

    const retailerNormalized = normalizeRetailerName(retailerRaw);

    if (period && period < minPeriod) minPeriod = period;
    if (period && period > maxPeriod) maxPeriod = period;
    totalAmountUsd += netAmount;

    entries.push({
      id: `dist_${i}_${now.toString(36)}`,
      period,
      retailer: retailerRaw,
      retailerNormalized,
      reportingPeriod,
      labelName,
      mainArtist,
      albumName,
      trackName,
      isrc,
      countryCode,
      salesType: classifySalesType(salesDesc),
      quantity,
      netAmountUsd: netAmount,
      sourceFile: fileName,
      importedAt: now,
    });
  }

  if (entries.length === 0) {
    throw new Error('Keine gültigen Einträge in der Datei gefunden.');
  }

  const statement: ImportedDistributorStatement = {
    id: `distst_${now.toString(36)}`,
    fileName,
    fileType: fileType as 'xlsx' | 'csv' | 'tsv',
    distributorFormat: profile.name,
    importedAt: now,
    entryCount: entries.length,
    totalAmountUsd,
    dateRange: {
      from: minPeriod === 'zzzz' ? '' : minPeriod,
      to: maxPeriod,
    },
    warnings,
  };

  return { entries, statement };
}

// --- Helpers ---

function detectProfile(headers: string[]): ColumnProfile | null {
  // Score each profile
  let bestProfile: ColumnProfile | null = null;
  let bestScore = 0;

  for (const profile of PROFILES) {
    const matched = profile.requiredHeaders.filter((req) =>
      headers.some((h) => h.includes(req))
    ).length;
    const score = matched / profile.requiredHeaders.length;
    if (score > bestScore) {
      bestScore = score;
      bestProfile = profile;
    }
  }

  if (bestScore >= 0.6) return bestProfile;

  // Try generic detection
  const genericColumns: Record<string, string> = {};

  for (const [field, patterns] of Object.entries(GENERIC_COLUMN_PATTERNS)) {
    for (const pattern of patterns) {
      const match = headers.find((h) => h.includes(pattern));
      if (match) {
        genericColumns[field] = match;
        break;
      }
    }
  }

  // Need at least retailer/store + amount to be useful
  if (genericColumns.retailer && genericColumns.netAmount) {
    return {
      name: 'generic',
      requiredHeaders: [],
      columns: genericColumns as ColumnProfile['columns'],
    };
  }

  return null;
}

function resolveColumnMap(
  profile: ColumnProfile,
  headersLower: string[],
  headersOriginal: string[]
): Record<string, string> {
  const map: Record<string, string> = {};

  for (const [field, colName] of Object.entries(profile.columns)) {
    if (!colName) continue;
    const lower = colName.toLowerCase();
    // Find exact header (case-insensitive)
    const idx = headersLower.findIndex((h) => h === lower || h.includes(lower));
    if (idx >= 0) {
      map[field] = headersOriginal[idx];
    }
  }

  return map;
}

function getVal(row: Record<string, string>, colHeader: string | undefined): string {
  if (!colHeader) return '';
  const val = row[colHeader];
  return val != null ? String(val).trim() : '';
}

function parseNum(value: string): number {
  if (!value) return 0;
  // Remove currency symbols and whitespace
  const cleaned = value.replace(/[$€£¥,\s]/g, '').replace(/[()]/g, (m) => (m === '(' ? '-' : ''));
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/** Normalize period strings like "Mar 2024", "2024-03", "03/2024" → "2024-03" */
function normalizePeriod(value: string): string {
  if (!value) return '';

  // Excel serial date number (e.g. 44986 = 2023-03-01)
  const serial = parseFloat(value);
  if (!isNaN(serial) && serial > 30000 && serial < 70000 && /^\d+(\.\d+)?$/.test(value.trim())) {
    const date = new Date((serial - 25569) * 86400000);
    const y = date.getUTCFullYear();
    const m = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    return `${y}-${m}`;
  }

  // Already YYYY-MM
  const isoMatch = value.match(/^(\d{4})-(\d{1,2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}`;

  // MM/YYYY or MM-YYYY
  const mmYYYY = value.match(/^(\d{1,2})[/\-.](\d{4})$/);
  if (mmYYYY) return `${mmYYYY[2]}-${mmYYYY[1].padStart(2, '0')}`;

  // "Month YYYY" (English)
  const MONTHS: Record<string, string> = {
    jan: '01', january: '01', feb: '02', february: '02',
    mar: '03', march: '03', apr: '04', april: '04',
    may: '05', jun: '06', june: '06',
    jul: '07', july: '07', aug: '08', august: '08',
    sep: '09', september: '09', oct: '10', october: '10',
    nov: '11', november: '11', dec: '12', december: '12',
  };
  const monthMatch = value.match(/^([a-zA-Z]+)\s+(\d{4})$/);
  if (monthMatch) {
    const m = MONTHS[monthMatch[1].toLowerCase()];
    if (m) return `${monthMatch[2]}-${m}`;
  }

  // YYYY/MM
  const yyyyMM = value.match(/^(\d{4})[/.](\d{1,2})$/);
  if (yyyyMM) return `${yyyyMM[1]}-${yyyyMM[2].padStart(2, '0')}`;

  // Full date: YYYY-MM-DD → just YYYY-MM
  const fullDate = value.match(/^(\d{4})-(\d{1,2})-\d{1,2}/);
  if (fullDate) return `${fullDate[1]}-${fullDate[2].padStart(2, '0')}`;

  // MM/DD/YYYY → YYYY-MM
  const usFull = value.match(/^(\d{1,2})[/](\d{1,2})[/](\d{4})$/);
  if (usFull) return `${usFull[3]}-${usFull[1].padStart(2, '0')}`;

  return value;
}

/** Check if column headers look like a distributor report (not GEMA) */
export function isDistributorFormat(headers: string[]): boolean {
  const lower = headers.map((h) => h.toLowerCase().trim());

  // GEMA markers
  const gemaMarkers = ['spartencode', 'werknummer', 'werktitel', 'sparte', 'category_code', 'work_number'];
  if (gemaMarkers.some((m) => lower.some((h) => h.includes(m)))) return false;

  // Distributor markers
  const distMarkers = ['retailer', 'store', 'store name', 'channel', 'earnings', 'net amount', 'payable'];
  const matchCount = distMarkers.filter((m) => lower.some((h) => h.includes(m))).length;
  return matchCount >= 2;
}
