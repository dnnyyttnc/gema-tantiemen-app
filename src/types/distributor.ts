export type SalesType =
  | 'streaming_subscription'
  | 'streaming_ad'
  | 'download_track'
  | 'download_album'
  | 'streaming_video'
  | 'other';

export interface DistributorEntry {
  id: string;
  period: string;              // "2024-01" (YYYY-MM)
  retailer: string;            // Original: "Spotify", "YouTube Premium"
  retailerNormalized: string;  // Canonical: "spotify", "youtube"
  reportingPeriod: string;     // When usage occurred
  labelName: string;
  mainArtist: string;
  albumName: string;
  trackName: string;
  isrc: string;
  countryCode: string;         // ISO 2-letter
  salesType: SalesType;
  quantity: number;
  netAmountUsd: number;        // Revenue in USD (source of truth)
  sourceFile: string;
  importedAt: number;
}

export interface ImportedDistributorStatement {
  id: string;
  fileName: string;
  fileType: 'xlsx' | 'csv' | 'tsv';
  distributorFormat: string;   // "argonauta" | "distrokid" | "tunecore" | "generic"
  importedAt: number;
  entryCount: number;
  totalAmountUsd: number;
  dateRange: { from: string; to: string };
  warnings: string[];
}
