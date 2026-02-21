import type { CategoryGroup, SparteCode } from '@/types/gema';

export interface CategoryInfo {
  group: CategoryGroup;
  label: string;
  labelShort: string;
  color: string;
  icon: string;
}

export const SPARTE_TO_CATEGORY: Record<string, CategoryGroup> = {
  'MOD S': 'streaming',
  'MOD S VR': 'streaming',
  'MOD D': 'download',
  'MOD D VR': 'download',
  'GOP': 'social_platforms',
  'GOP VR': 'social_platforms',
  'VOD S': 'streaming',
  'VOD S VR': 'streaming',
  'VOD D': 'download',
  'VOD D VR': 'download',
  'WEB': 'social_platforms',
  'WEB VR': 'social_platforms',
  'KMOD': 'download',
  'KMOD VR': 'download',
  'IR': 'radio',
  'IFS': 'television',
  'R': 'radio',
  'R VR': 'radio',
  'FS': 'television',
  'FS VR': 'television',
  'T': 'television',
  'T FS': 'television',
  'T FS VR': 'television',
  'TD': 'television',
  'TD VR': 'television',
  'MED': 'media_libraries',
  'MED VR': 'media_libraries',
  'U': 'live',
  'UD': 'live',
  'E': 'live',
  'ED': 'live',
  'EM': 'live',
  'BM': 'live',
  'KI': 'live',
  'DK': 'live',
  'DK VR': 'live',
  'PHONO VR': 'physical',
  'BT VR': 'physical',
  'MT VR': 'physical',
  'GT VR': 'physical',
  'A': 'international',
  'A AR': 'international',
  'A VR': 'international',
  // Official GEMA Spartennummer codes (2-char from Datensatzbeschreibung)
  'GP': 'social_platforms', // GOP
  'MD': 'media_libraries',  // MED/Mediatheken
  '12': 'streaming',   // MOD S
  '13': 'streaming',   // MOD S VR
  '10': 'download',    // MOD D
  '11': 'download',    // MOD D VR
  '16': 'streaming',   // VOD S
  '17': 'streaming',   // VOD S VR
  '14': 'download',    // VOD D
  '15': 'download',    // VOD D VR
  '20': 'physical',    // PHO VR (Phono)
  '25': 'physical',    // BT VR (Bildtonträger)
  '26': 'social_platforms', // WEB
  '27': 'social_platforms', // WEB VR
  '28': 'download',    // KMOD (Ruftonmelodien)
  '29': 'download',    // KMOD VR
  '30': 'international', // Ausland VR
  '40': 'international', // Ausland AR
  'R1': 'radio',       // R (Tonrundfunk)
  'R2': 'radio',       // R VR
  'R3': 'radio',       // R GR
  'R4': 'radio',       // R VR GR
  'R5': 'television',  // FS (Fernsehen)
  'R6': 'television',  // FS VR
  'R7': 'television',  // FS GR
  'T1': 'television',  // T (Tonfilm)
  'T2': 'television',  // TD
  'T3': 'television',  // T FS
  'T4': 'television',  // T FS VR
  'T7': 'television',  // TD VR
  'U1': 'live',        // U (Unterhaltungsmusik)
  'U2': 'live',        // M (Tonträgerwiedergabe)
  'U8': 'live',        // UD (Direktverrechnung)
  'E1': 'live',        // E (Ernste Musik)
  'E2': 'live',        // BM (Bühnenmusik)
  'E7': 'live',        // EM
  'E8': 'live',        // ED
  'D2': 'live',        // DK VR
  'K1': 'live',        // KI EK
  'K2': 'live',        // KI KK
  'K3': 'live',        // FKI EK
  'K4': 'live',        // FKI KK
  'K5': 'live',        // KI NA
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
  return SPARTE_TO_CATEGORY[sparte] || 'other';
}

export const ROLLE_LABELS: Record<string, string> = {
  K: 'Komponist',
  T: 'Textdichter',
  V: 'Verlag',
  B: 'Bearbeiter',
};
