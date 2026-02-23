import type { SalesType } from '@/types/distributor';

/** Map distributor sales descriptions → canonical SalesType */
const SALES_TYPE_MAP: Record<string, SalesType> = {
  'streaming (subscription)': 'streaming_subscription',
  'streaming (ad-supported)': 'streaming_ad',
  'streaming subscription': 'streaming_subscription',
  'streaming ad-supported': 'streaming_ad',
  'stream': 'streaming_subscription',
  'streaming': 'streaming_subscription',
  'download (track)': 'download_track',
  'download (album)': 'download_album',
  'download track': 'download_track',
  'download album': 'download_album',
  'download': 'download_track',
  'permanent download': 'download_track',
  'streaming (video)': 'streaming_video',
  'video': 'streaming_video',
  'music video': 'streaming_video',
  'ad-supported streaming': 'streaming_ad',
  'subscription streaming': 'streaming_subscription',
  'ringtone': 'other',
  'other': 'other',
};

export function classifySalesType(description: string): SalesType {
  if (!description) return 'other';
  const lower = description.toLowerCase().trim();

  // Exact match
  if (SALES_TYPE_MAP[lower]) return SALES_TYPE_MAP[lower];

  // Partial matching
  if (lower.includes('ad-supported') || lower.includes('ad supported') || lower.includes('free'))
    return 'streaming_ad';
  if (lower.includes('subscription') || lower.includes('premium'))
    return 'streaming_subscription';
  if (lower.includes('video')) return 'streaming_video';
  if (lower.includes('download') && lower.includes('album')) return 'download_album';
  if (lower.includes('download')) return 'download_track';
  if (lower.includes('stream')) return 'streaming_subscription';

  return 'other';
}

export const SALES_TYPE_INFO: Record<SalesType, { label: string; emoji: string }> = {
  streaming_subscription: { label: 'Streaming (Abo)', emoji: '🎧' },
  streaming_ad: { label: 'Streaming (Werbung)', emoji: '📢' },
  download_track: { label: 'Download (Track)', emoji: '⬇️' },
  download_album: { label: 'Download (Album)', emoji: '💿' },
  streaming_video: { label: 'Video-Streaming', emoji: '🎬' },
  other: { label: 'Sonstige', emoji: '📋' },
};
