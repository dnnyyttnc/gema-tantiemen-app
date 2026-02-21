import type { CategoryGroup, SparteCode } from '@/types/gema';

export interface CategoryInfo {
  group: CategoryGroup;
  label: string;
  labelShort: string;
  color: string;
  icon: string;
}

// ============================================================================
// SPARTE → CATEGORY MAPPING
// Based on official GEMA Royalty Specifications v2.20 (01.11.2025)
// Source: segment_group mapping + category_code mapping
//
// Our CategoryGroup is more granular than GEMA's official segment_group:
//   - GEMA "Online" → we split into streaming / download / social_platforms
//   - GEMA "TV / Film" → we split into television / media_libraries
//   - GEMA "Tonträger" → physical
//   - GEMA "Live / Wiedergabe" → live
// ============================================================================

export const SPARTE_TO_CATEGORY: Record<string, CategoryGroup> = {
  // === Online: Streaming (GEMA segment_group: Online) ===
  'MOD S': 'streaming',       // Music on Demand Streaming
  'MOD S VR': 'streaming',    // Music on Demand Streaming VR
  'VOD S': 'streaming',       // Video on Demand Streaming
  'VOD S VR': 'streaming',    // Video on Demand Streaming VR

  // === Online: Download (GEMA segment_group: Online) ===
  'MOD D': 'download',        // Music on Demand Download
  'MOD D VR': 'download',     // Music on Demand Download VR
  'VOD D': 'download',        // Video on Demand Download
  'VOD D VR': 'download',     // Video on Demand Download VR
  'KMOD': 'download',         // Ruftonmelodien
  'KMOD VR': 'download',      // Ruftonmelodien VR

  // === Online: Social/Mixed Platforms (GEMA segment_group: Online) ===
  'GOP': 'social_platforms',   // Gemischte Online-Plattformen (YouTube, TikTok)
  'GOP VR': 'social_platforms',
  'WEB': 'social_platforms',   // Websites Streaming
  'WEB VR': 'social_platforms',

  // === Radio (GEMA segment_group: Radio) ===
  'R': 'radio',               // Radio
  'R VR': 'radio',            // Radio Vervielfältigungsrecht
  'R GR': 'radio',            // Radio Großes Recht
  'R GR VR': 'radio',         // Radio Großes Recht VR

  // === Fernsehen / TV / Film (GEMA segment_group: TV / Film) ===
  'FS': 'television',         // Fernsehen
  'FS VR': 'television',      // Fernsehen VR
  'FS GR': 'television',      // Fernsehen Großes Recht
  'FS GR VR': 'television',   // Fernsehen Großes Recht VR
  'T': 'television',          // Kino / Tonfilm
  'T FS': 'television',       // Tonfilm im Fernsehen
  'T FS VR': 'television',    // Tonfilm im Fernsehen VR
  'TD': 'television',         // Tonfilm Direktverteilung
  'TD VR': 'television',      // Tonfilm Direktverteilung VR

  // === Mediatheken (GEMA segment_group: TV / Film, but distinct for analysis) ===
  'MED': 'media_libraries',   // Mediatheken
  'MED VR': 'media_libraries', // Mediatheken VR

  // === Live / Wiedergabe (GEMA segment_group: Live / Wiedergabe) ===
  'U': 'live',                // Unterhaltungsmusik
  'UD': 'live',               // Unterhaltungsmusik Direktverteilung
  'M': 'live',                // Musikwiedergaben
  'M UD': 'live',             // Musikwiedergaben Unterhaltungsmusik Direktv.
  'MD': 'live',               // Musikwiedergaben Direktverteilung
  'E': 'live',                // Ernste Musik
  'ED': 'live',               // Ernste Musik Direktverteilung
  'EM': 'live',               // Ernste Musik Wiedergaben
  'BM': 'live',               // Bühnenmusik
  'DK': 'live',               // Diskotheken Wiedergaben
  'DK VR': 'live',            // Diskotheken Wiedergaben VR

  // === Physisch / Tonträger (GEMA segment_group: Tonträger) ===
  'PHONO VR': 'physical',     // Tonträger (CD, Vinyl etc.)
  'BT VR': 'physical',        // Bildtonträger (DVD, Blu-ray etc.)

  // === International / Ausland (GEMA segment_group: Ausland) ===
  'A': 'international',       // Ausland
  'A VR': 'international',    // Ausland Vervielfältigungsrecht

  // === Zuschläge → other (GEMA segment_group: Zuschläge) ===
  'ZSL': 'other',             // Zuschläge (Supplements)

  // =========================================================================
  // CATEGORY_CODE (numeric codes from KMP/compact_statement format)
  // Source: category_code mapping from GEMA specs v2.20
  // Note: DK is both a sparte name and category code (same value, mapped above)
  // =========================================================================

  // Live / Wiedergabe numeric codes
  'D2': 'live',               // DK VR
  'E1': 'live',               // E (Ernste Musik)
  'E2': 'live',               // BM (Bühnenmusik)
  'E7': 'live',               // EM (Ernste Musik Wiedergaben)
  'E8': 'live',               // ED (Ernste Musik Direktverteilung)
  'U1': 'live',               // U (Unterhaltungsmusik)
  'U2': 'live',               // M (Musikwiedergaben)
  'U7': 'live',               // M UD (Musikwiedergaben Unterhaltungsmusik DV)
  'U8': 'live',               // UD (Unterhaltungsmusik Direktverteilung)
  'M1': 'live',               // MD (Musikwiedergaben Direktverteilung)

  // Radio numeric codes
  'R1': 'radio',              // R (Radio)
  'R2': 'radio',              // R VR
  'R3': 'radio',              // R GR (Radio Großes Recht)
  'R4': 'radio',              // R GR VR

  // TV / Film numeric codes
  'R5': 'television',         // FS (Fernsehen)
  'R6': 'television',         // FS VR
  'R7': 'television',         // FS GR
  'R8': 'television',         // FS GR VR
  'T1': 'television',         // T (Tonfilm)
  'T2': 'television',         // TD (Tonfilm Direktverteilung)
  'T3': 'television',         // T FS (Tonfilm im Fernsehen)
  'T4': 'television',         // T FS VR
  'T7': 'television',         // TD VR

  // Mediatheken numeric codes
  'ME01': 'media_libraries',  // MED
  'ME02': 'media_libraries',  // MED VR

  // Online numeric codes
  '10': 'download',           // MOD D
  '11': 'download',           // MOD D VR
  '12': 'streaming',          // MOD S
  '13': 'streaming',          // MOD S VR
  '14': 'download',           // VOD D
  '15': 'download',           // VOD D VR
  '16': 'streaming',          // VOD S
  '17': 'streaming',          // VOD S VR
  '18': 'social_platforms',   // GOP
  '19': 'social_platforms',   // GOP VR
  '26': 'social_platforms',   // WEB
  '27': 'social_platforms',   // WEB VR
  '28': 'download',           // KMOD (Ruftonmelodien)
  '29': 'download',           // KMOD VR

  // Physical numeric codes
  '20': 'physical',           // PHONO VR
  '25': 'physical',           // BT VR

  // International numeric codes
  '30': 'international',      // A VR
  '40': 'international',      // A
};

// ============================================================================
// CATEGORY_CODE → SPARTE ABBREVIATION
// Maps the numeric/alphanumeric codes from KMP format back to human-readable
// Source: category_code mapping from GEMA specs v2.20
// ============================================================================
export const CATEGORY_CODE_TO_SPARTE: Record<string, string> = {
  'DK': 'DK', 'D2': 'DK VR',
  'E1': 'E', 'E2': 'BM', 'E7': 'EM', 'E8': 'ED',
  'R1': 'R', 'R2': 'R VR', 'R3': 'R GR', 'R4': 'R GR VR',
  'R5': 'FS', 'R6': 'FS VR', 'R7': 'FS GR', 'R8': 'FS GR VR',
  'T1': 'T', 'T2': 'TD', 'T3': 'T FS', 'T4': 'T FS VR', 'T7': 'TD VR',
  'U1': 'U', 'U2': 'M', 'U7': 'M UD', 'U8': 'UD',
  'M1': 'MD',
  '10': 'MOD D', '11': 'MOD D VR', '12': 'MOD S', '13': 'MOD S VR',
  '14': 'VOD D', '15': 'VOD D VR', '16': 'VOD S', '17': 'VOD S VR',
  '18': 'GOP', '19': 'GOP VR',
  '20': 'PHONO VR', '25': 'BT VR',
  '26': 'WEB', '27': 'WEB VR',
  '28': 'KMOD', '29': 'KMOD VR',
  '30': 'A VR', '40': 'A',
  'ME01': 'MED', 'ME02': 'MED VR',
};

// ============================================================================
// DISTRIBUTION_CATEGORY LABELS (official German labels)
// Source: distribution_category mapping from GEMA specs v2.20
// ============================================================================
export const DISTRIBUTION_CATEGORY_LABELS: Record<string, string> = {
  'SUM': 'Summenblatt (alle Sparten)',
  'ABR': 'Kompaktaufstellung (alle Sparten)',
  'KMP': 'Kompaktaufstellung (alle Sparten)',
  'E': 'Ernste Musik (E)',
  'BM': 'Bühnenmusik (BM)',
  'EM': 'Ernste Musik Wiedergaben (EM)',
  'ED': 'Ernste Musik Direktverteilung (ED)',
  'MD': 'Musikwiedergaben Direktverteilung (MD)',
  'U': 'Unterhaltungsmusik (U)',
  'M': 'Musikwiedergaben (M)',
  'UD': 'Unterhaltungsmusik Direktverteilung (UD)',
  'DK': 'Diskotheken Wiedergaben (DK)',
  'DK VR': 'Diskotheken Wiedergaben VR (DK VR)',
  'FS': 'Fernsehen (FS)',
  'FS VR': 'Fernsehen VR (FS VR)',
  'T FS': 'Tonfilm im Fernsehen (T FS)',
  'T FS VR': 'Tonfilm im Fernsehen VR (T FS VR)',
  'MED': 'Mediatheken (MED)',
  'MED VR': 'Mediatheken VR (MED VR)',
  'R': 'Radio (R)',
  'R VR': 'Radio VR (R VR)',
  'T': 'Kino / Tonfilm (T)',
  'TD': 'Tonfilm Direktverteilung (TD)',
  'TD VR': 'Tonfilm Direktverteilung VR (TD VR)',
  'A': 'Ausland (A)',
  'A VR': 'Ausland VR (A VR)',
  'PHONO VR': 'Tonträger (Phono VR)',
  'BT VR': 'Bildtonträger (BT VR)',
  'GOP': 'Gemischte Online-Plattformen (GOP)',
  'GOP VR': 'Gemischte Online-Plattformen VR (GOP VR)',
  'KMOD': 'Ruftonmelodien (KMOD)',
  'KMOD VR': 'Ruftonmelodien VR (KMOD VR)',
  'MOD D': 'Music on Demand Download (MOD D)',
  'MOD D VR': 'Music on Demand Download VR (MOD D VR)',
  'MOD S': 'Music on Demand Streaming (MOD S)',
  'MOD S VR': 'Music on Demand Streaming VR (MOD S VR)',
  'VOD D': 'Video on Demand Download (VOD D)',
  'VOD D VR': 'Video on Demand Download VR (VOD D VR)',
  'VOD S': 'Video on Demand Streaming (VOD S)',
  'VOD S VR': 'Video on Demand Streaming VR (VOD S VR)',
  'WEB': 'Websites Streaming (WEB)',
  'WEB VR': 'Websites Streaming VR (WEB VR)',
  'ZSL': 'Zuschläge',
};

export const CATEGORY_INFO: Record<CategoryGroup, CategoryInfo> = {
  streaming: {
    group: 'streaming',
    label: 'Streaming',
    labelShort: 'Stream',
    color: '#8b5cf6',
    icon: 'Headphones',
  },
  download: {
    group: 'download',
    label: 'Downloads',
    labelShort: 'DL',
    color: '#06b6d4',
    icon: 'Download',
  },
  social_platforms: {
    group: 'social_platforms',
    label: 'Social Platforms',
    labelShort: 'Social',
    color: '#f43f5e',
    icon: 'Share2',
  },
  radio: {
    group: 'radio',
    label: 'Radio',
    labelShort: 'Radio',
    color: '#f59e0b',
    icon: 'Radio',
  },
  television: {
    group: 'television',
    label: 'Fernsehen',
    labelShort: 'TV',
    color: '#3b82f6',
    icon: 'Tv',
  },
  live: {
    group: 'live',
    label: 'Live & Events',
    labelShort: 'Live',
    color: '#10b981',
    icon: 'Music',
  },
  media_libraries: {
    group: 'media_libraries',
    label: 'Mediatheken',
    labelShort: 'Media',
    color: '#ec4899',
    icon: 'PlaySquare',
  },
  physical: {
    group: 'physical',
    label: 'Physisch (CD/Vinyl)',
    labelShort: 'Phys.',
    color: '#a855f7',
    icon: 'Disc3',
  },
  international: {
    group: 'international',
    label: 'International',
    labelShort: 'Intl.',
    color: '#64748b',
    icon: 'Globe',
  },
  other: {
    group: 'other',
    label: 'Sonstige',
    labelShort: 'Sonst.',
    color: '#94a3b8',
    icon: 'MoreHorizontal',
  },
};

export function mapSparteToCategory(sparte: SparteCode): CategoryGroup {
  // Try exact match first, then uppercase (handles "Phono VR" → "PHONO VR" etc.)
  return SPARTE_TO_CATEGORY[sparte] || SPARTE_TO_CATEGORY[sparte.toUpperCase()] || 'other';
}

// ============================================================================
// ROLE MAPPINGS (official from professional_category + role specs v2.20)
// ============================================================================

// professional_category codes (0-9) used in KMP format
export const PROFESSIONAL_CATEGORY_MAP: Record<string, string> = {
  '0': 'VG',  // Verwertungsgesellschaft (Copyright Society)
  '1': 'K',   // Komponist (Composer)
  '2': 'B',   // Bearbeiter (Arranger)
  '3': 'T',   // Textdichter (Author)
  '4': 'V',   // Verleger (Publisher)
  '5': 'V',   // Bühnenverleger (Publisher for theatrical rights)
  '6': 'K',   // Komponist Sonderkonto (Composer Special Account)
  '7': 'B',   // Bearbeiter Sonderkonto (Arranger Special Account)
  '8': 'T',   // Textdichter Sonderkonto (Author Special Account)
  '9': 'V',   // Verleger Sonderkonto (Publisher Special Account)
};

// role codes (0-5) used in detail formats (Online, Radio, Live, TV, etc.)
export const ROLE_CODE_MAP: Record<string, string> = {
  '0': 'VG',  // Verwertungsgesellschaft
  '1': 'K',   // Komponist
  '2': 'B',   // Bearbeiter
  '3': 'T',   // Textdichter
  '4': 'V',   // Verleger
  '5': 'V',   // Bühnenverleger
};

export const ROLLE_LABELS: Record<string, string> = {
  K: 'Komponist',
  T: 'Textdichter',
  V: 'Verleger',
  B: 'Bearbeiter',
  VG: 'Verwertungsgesellschaft',
};

// ============================================================================
// DISTRIBUTION_TYPE (Verteilungsart)
// Source: distribution_type mapping from GEMA specs v2.20
// ============================================================================
export const DISTRIBUTION_TYPE_LABELS: Record<string, string> = {
  'HV': 'Hauptverteilung',
  'NV': 'Nachverteilung',
  'KV': 'Korrekturverteilung',
  'VV': 'Vorgezogene Verteilung',
  'FV': 'Festivalverteilung',
};

// ============================================================================
// DEBIT_CREDIT_ADJUSTMENT
// Source: debit_credit_adjustment mapping from GEMA specs v2.20
// ============================================================================
export const DEBIT_CREDIT_LABELS: Record<string, string> = {
  'RV': 'Rückverrechnung',
  'NV': 'Nachverrechnung',
  'KA': 'Korrekturaufstellung',
};

// ============================================================================
// REVENUE_TYPE
// ============================================================================
export const REVENUE_TYPE_LABELS: Record<string, string> = {
  'HK': 'Hauptkonto',
  'SK': 'Sonderkonto',
};

// ============================================================================
// DISTRIBUTION_CODE (for foreign/international distributions)
// Source: distribution_code mapping from GEMA specs v2.20
// ============================================================================
export const DISTRIBUTION_CODE_LABELS: Record<string, string> = {
  '0': '-',
  '10': 'Tonträger pauschal',
  '11': 'Bildtonträger pauschal',
  '12': 'Herstellungsrechte',
  '13': 'Tonträger',
  '14': 'Bildtonträger',
  '15': 'Video Streaming - not on demand',
  '16': 'Video on Demand Streaming',
  '20': 'Radio',
  '21': 'Fernsehen',
  '22': 'Satellitenradio',
  '30': 'Private Überspielungen',
  '31': 'Vermietung und Verleih',
  '40': 'Music on Demand Download',
  '41': 'Video on Demand Download',
  '42': 'Ruftonmelodien',
  '43': 'Download Sonstige',
  '44': 'Internetradio',
  '45': 'Music Streaming - not on demand',
  '46': 'Music on Demand Streaming',
  '47': 'Internetfernsehen',
  '48': 'User-Uploaded-Content (audio und audiovisuell)',
  '50': 'Live Aufführungen',
  '51': 'Großkonzerte',
  '60': 'Diskotheken',
  '70': 'Aufführungen mittels elektronischer Vorrichtungen',
  '71': 'Karaoke',
  '80': 'Kino',
  '90': 'Sonstige',
};
