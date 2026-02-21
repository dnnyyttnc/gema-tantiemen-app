// Official GEMA distribution categories (Sparten) from v2.20 specs
export type SparteCode =
  // Online
  | 'MOD S' | 'MOD S VR'   // Music on Demand Streaming
  | 'MOD D' | 'MOD D VR'   // Music on Demand Download
  | 'GOP' | 'GOP VR'       // Gemischte Online-Plattformen (YouTube, TikTok etc.)
  | 'VOD S' | 'VOD S VR'   // Video on Demand Streaming
  | 'VOD D' | 'VOD D VR'   // Video on Demand Download
  | 'WEB' | 'WEB VR'       // Websites Streaming
  | 'KMOD' | 'KMOD VR'     // Ruftonmelodien
  // Radio
  | 'R' | 'R VR'           // Radio / Radio Vervielfältigungsrecht
  | 'R GR' | 'R GR VR'     // Radio Großes Recht
  // TV / Film
  | 'FS' | 'FS VR'         // Fernsehen
  | 'FS GR' | 'FS GR VR'   // Fernsehen Großes Recht
  | 'T' | 'T FS' | 'T FS VR' // Kino/Tonfilm
  | 'TD' | 'TD VR'         // Tonfilm Direktverteilung
  | 'MED' | 'MED VR'       // Mediatheken
  // Live / Wiedergabe
  | 'U' | 'UD'             // Unterhaltungsmusik / Direktverteilung
  | 'M' | 'M UD'           // Musikwiedergaben / Direktverteilung
  | 'MD'                    // Musikwiedergaben Direktverteilung
  | 'E' | 'ED' | 'EM'     // Ernste Musik
  | 'BM'                    // Bühnenmusik
  | 'DK' | 'DK VR'         // Diskotheken
  // Physical
  | 'PHONO VR'              // Tonträger
  | 'BT VR'                 // Bildtonträger
  // International
  | 'A' | 'A VR'           // Ausland
  // Special
  | 'ZSL'                   // Zuschläge (Supplements)
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
