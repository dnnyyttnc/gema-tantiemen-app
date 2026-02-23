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
};

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
