/** Parse German-locale number: 1.234,56 → 1234.56 (v1.0 format with comma decimals) */
export function parseGermanNumber(value: string): number {
  if (!value || value.trim() === '') return 0;
  const cleaned = value.trim().replace(/\./g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/** Parse international number: 1234.5678 → 1234.5678 (v2.0+ format with period decimals) */
export function parseNumber(value: string): number {
  if (!value || value.trim() === '') return 0;
  const num = parseFloat(value.trim());
  return isNaN(num) ? 0 : num;
}

/** Parse share fraction like "5/12" → 0.4167 */
export function parseAnteil(value: string): number {
  if (!value) return 1;
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (match) {
    const num = parseInt(match[1], 10);
    const den = parseInt(match[2], 10);
    return den > 0 ? num / den : 1;
  }
  // Try parsing as decimal
  const decimal = parseGermanNumber(trimmed);
  return decimal > 0 && decimal <= 1 ? decimal : 1;
}

/** Generate a deterministic ID for deduplication */
export function generateEntryId(
  werknummer: string,
  sparte: string,
  nutzer: string,
  periode: string,
  betrag: string
): string {
  const raw = `${werknummer}|${sparte}|${nutzer}|${periode}|${betrag}`;
  // Simple hash for uniqueness
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36) + '_' + Date.now().toString(36);
}

/** Strip BOM from file content */
export function stripBOM(text: string): string {
  return text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text;
}

export function detectFileFormat(file: File): 'csv' | 'pdf' {
  if (file.name.toLowerCase().endsWith('.pdf')) return 'pdf';
  if (file.name.toLowerCase().endsWith('.csv')) return 'csv';
  if (file.type === 'application/pdf') return 'pdf';
  return 'csv';
}
