export type SparteCode =
  | 'MOD S' | 'MOD S VR'
  | 'MOD D' | 'MOD D VR'
  | 'GOP' | 'GOP VR'
  | 'VOD S' | 'VOD S VR'
  | 'VOD D' | 'VOD D VR'
  | 'WEB' | 'WEB VR'
  | 'KMOD' | 'KMOD VR'
  | 'IR' | 'IFS'
  | 'R' | 'R VR'
  | 'FS' | 'FS VR'
  | 'T' | 'T FS' | 'T FS VR'
  | 'TD' | 'TD VR'
  | 'MED' | 'MED VR'
  | 'U' | 'UD'
  | 'E' | 'ED' | 'EM'
  | 'BM' | 'KI'
  | 'DK' | 'DK VR'
  | 'PHONO VR' | 'BT VR'
  | 'MT VR' | 'GT VR'
  | 'A' | 'A AR' | 'A VR'
  | string;

export type CategoryGroup =
  | 'streaming'
  | 'download'
  | 'social_platforms'
  | 'radio'
  | 'television'
  | 'live'
  | 'media_libraries'
  | 'physical'
  | 'international'
  | 'other';

export type RolleCode = 'K' | 'T' | 'V' | 'B' | string;

export interface GemaRoyaltyEntry {
  id: string;
  werknummer: string;
  werktitel: string;
  rolle: RolleCode;
  anteilRaw: string;
  anteilDecimal: number;
  sparte: SparteCode;
  categoryGroup: CategoryGroup;
  nutzungsanzahl: number;
  betrag: number;
  betragRaw: string;
  nutzer: string;
  geschaeftsjahr: string;
  verteilungsPeriode: string;
  sourceFile: string;
  importedAt: number;
}

export interface WorkSummary {
  werknummer: string;
  werktitel: string;
  totalBetrag: number;
  totalNutzungen: number;
  byCategory: Partial<Record<CategoryGroup, { betrag: number; nutzungen: number }>>;
  byPlatform: Record<string, { betrag: number; nutzungen: number }>;
  rank: number;
}

export interface PeriodSummary {
  geschaeftsjahr: string;
  verteilungsPeriode: string;
  totalBetrag: number;
  totalNutzungen: number;
  entryCount: number;
  byCategory: Partial<Record<CategoryGroup, number>>;
  topWorks: WorkSummary[];
}

export interface ImportedStatement {
  id: string;
  fileName: string;
  fileType: 'csv' | 'pdf';
  formatVariant: 'detail' | 'compact' | 'summary' | 'pdf_standard';
  importedAt: number;
  geschaeftsjahr: string;
  verteilungsPeriode: string;
  entryCount: number;
  totalBetrag: number;
  warnings: string[];
}

export interface RawCsvRow {
  [key: string]: string;
}
