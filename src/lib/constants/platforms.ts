export interface PlatformInfo {
  name: string;
  color: string;
  category: 'streaming' | 'social' | 'radio' | 'download' | 'other';
}

// Known platform name patterns mapped to display info
const PLATFORM_MAP: Record<string, PlatformInfo> = {
  spotify: { name: 'Spotify', color: '#1DB954', category: 'streaming' },
  'apple music': { name: 'Apple Music', color: '#FC3C44', category: 'streaming' },
  'apple_music': { name: 'Apple Music', color: '#FC3C44', category: 'streaming' },
  deezer: { name: 'Deezer', color: '#A238FF', category: 'streaming' },
  tidal: { name: 'Tidal', color: '#000000', category: 'streaming' },
  'amazon music': { name: 'Amazon Music', color: '#25D1DA', category: 'streaming' },
  'amazon_music': { name: 'Amazon Music', color: '#25D1DA', category: 'streaming' },
  amazon: { name: 'Amazon Music', color: '#25D1DA', category: 'streaming' },
  youtube: { name: 'YouTube', color: '#FF0000', category: 'social' },
  'youtube music': { name: 'YouTube Music', color: '#FF0000', category: 'streaming' },
  tiktok: { name: 'TikTok', color: '#010101', category: 'social' },
  instagram: { name: 'Instagram', color: '#E4405F', category: 'social' },
  facebook: { name: 'Facebook', color: '#1877F2', category: 'social' },
  meta: { name: 'Meta', color: '#1877F2', category: 'social' },
  google: { name: 'Google', color: '#4285F4', category: 'social' },
  xandrie: { name: 'Qobuz', color: '#1A8FE3', category: 'streaming' },
  qobuz: { name: 'Qobuz', color: '#1A8FE3', category: 'streaming' },
  soundcloud: { name: 'SoundCloud', color: '#FF5500', category: 'streaming' },
  netflix: { name: 'Netflix', color: '#E50914', category: 'streaming' },
  itunes: { name: 'iTunes', color: '#FB5BC5', category: 'download' },
  'itunes store': { name: 'iTunes Store', color: '#FB5BC5', category: 'download' },
  pandora: { name: 'Pandora', color: '#005483', category: 'streaming' },
  shazam: { name: 'Shazam', color: '#0088FF', category: 'other' },
  napster: { name: 'Napster', color: '#000000', category: 'streaming' },
  awa: { name: 'AWA', color: '#FC4E51', category: 'streaming' },
  anghami: { name: 'Anghami', color: '#7B2BFC', category: 'streaming' },
  'youtube red': { name: 'YouTube Premium', color: '#FF0000', category: 'streaming' },
  'youtube premium': { name: 'YouTube Premium', color: '#FF0000', category: 'streaming' },
  'amazon unlimited': { name: 'Amazon Music', color: '#25D1DA', category: 'streaming' },
  'amazon prime': { name: 'Amazon Music', color: '#25D1DA', category: 'streaming' },
  'amazon ad': { name: 'Amazon Music', color: '#25D1DA', category: 'streaming' },
  peloton: { name: 'Peloton', color: '#D42A2A', category: 'other' },
  snap: { name: 'Snapchat', color: '#FFFC00', category: 'social' },
  snapchat: { name: 'Snapchat', color: '#FFFC00', category: 'social' },
  audiomack: { name: 'Audiomack', color: '#FAA61A', category: 'streaming' },
  'media net': { name: 'MediaNet', color: '#333333', category: 'streaming' },
  medianet: { name: 'MediaNet', color: '#333333', category: 'streaming' },
  iheartradio: { name: 'iHeartRadio', color: '#C6002B', category: 'radio' },
  iheart: { name: 'iHeartRadio', color: '#C6002B', category: 'radio' },
  'touchtunes': { name: 'TouchTunes', color: '#FF6B35', category: 'other' },
  saavn: { name: 'JioSaavn', color: '#2BC5B4', category: 'streaming' },
  jiosaavn: { name: 'JioSaavn', color: '#2BC5B4', category: 'streaming' },
  boomplay: { name: 'Boomplay', color: '#F24C27', category: 'streaming' },
  'netease': { name: 'NetEase', color: '#C20C0C', category: 'streaming' },
  tencent: { name: 'Tencent Music', color: '#1DB954', category: 'streaming' },
  rhapsody: { name: 'Napster', color: '#000000', category: 'streaming' },
  hoopla: { name: 'Hoopla', color: '#E8541E', category: 'streaming' },
  resso: { name: 'Resso', color: '#25F4EE', category: 'streaming' },
};

/** Distributor retailer names → canonical platform key for cross-matching */
const DISTRIBUTOR_RETAILER_MAP: Record<string, string> = {
  'spotify': 'spotify',
  'apple music': 'apple music',
  'itunes': 'itunes',
  'itunes store': 'itunes',
  'itunes & apple music': 'apple music',
  'deezer': 'deezer',
  'tidal': 'tidal',
  'amazon music unlimited': 'amazon',
  'amazon music': 'amazon',
  'amazon ad supported': 'amazon',
  'amazon ad-supported': 'amazon',
  'amazon prime': 'amazon',
  'amazon': 'amazon',
  'youtube': 'youtube',
  'youtube premium': 'youtube music',
  'youtube music': 'youtube music',
  'youtube red': 'youtube music',
  'youtube ad supported': 'youtube',
  'youtube ad-supported': 'youtube',
  'youtube music premium': 'youtube music',
  'tiktok': 'tiktok',
  'facebook': 'facebook',
  'instagram': 'instagram',
  'meta': 'meta',
  'google play': 'google',
  'google': 'google',
  'soundcloud': 'soundcloud',
  'pandora': 'pandora',
  'shazam': 'shazam',
  'napster': 'napster',
  'qobuz': 'qobuz',
  'xandrie': 'qobuz',
  'audiomack': 'audiomack',
  'anghami': 'anghami',
  'boomplay': 'boomplay',
  'jiosaavn': 'jiosaavn',
  'saavn': 'jiosaavn',
  'netease': 'netease',
  'tencent': 'tencent',
  'iheartradio': 'iheartradio',
  'iheart': 'iheartradio',
  'awa': 'awa',
  'snap': 'snapchat',
  'snapchat': 'snapchat',
  'peloton': 'peloton',
  'media net': 'medianet',
  'medianet': 'medianet',
  'netflix': 'netflix',
  'rhapsody': 'napster',
  'hoopla': 'hoopla',
  'resso': 'resso',
};

/** Normalize a distributor retailer name to canonical platform key */
export function normalizeRetailerName(retailer: string): string {
  if (!retailer) return 'unknown';
  const lower = retailer.toLowerCase().trim();

  // Exact match first
  if (DISTRIBUTOR_RETAILER_MAP[lower]) return DISTRIBUTOR_RETAILER_MAP[lower];

  // Partial match
  for (const [key, canonical] of Object.entries(DISTRIBUTOR_RETAILER_MAP)) {
    if (lower.includes(key) || key.includes(lower)) return canonical;
  }

  return lower;
}

/** Get canonical platform key from GEMA nutzer field */
export function getCanonicalPlatformKey(nutzer: string): string {
  const platform = identifyPlatform(nutzer);
  if (!platform) return nutzer.toLowerCase().trim();
  // Find which PLATFORM_MAP key resolved
  const lower = nutzer.toLowerCase().trim();
  for (const key of Object.keys(PLATFORM_MAP)) {
    if (lower.includes(key)) return key;
  }
  return lower;
}

export function identifyPlatform(nutzer: string): PlatformInfo | null {
  if (!nutzer) return null;
  const lower = nutzer.toLowerCase().trim();
  for (const [key, info] of Object.entries(PLATFORM_MAP)) {
    if (lower.includes(key)) return info;
  }
  return null;
}

export function getPlatformColor(nutzer: string): string {
  const platform = identifyPlatform(nutzer);
  return platform?.color || '#6b7280';
}

export function getPlatformName(nutzer: string): string {
  const platform = identifyPlatform(nutzer);
  return platform?.name || nutzer;
}
