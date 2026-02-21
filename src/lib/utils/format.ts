const eurFormatter = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const eurCompactFormatter = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  notation: 'compact',
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

const numberFormatter = new Intl.NumberFormat('de-DE');

export function formatEur(amount: number): string {
  return eurFormatter.format(amount);
}

export function formatEurCompact(amount: number): string {
  return eurCompactFormatter.format(amount);
}

export function formatNumber(num: number): string {
  return numberFormatter.format(num);
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatPerStreamRate(rate: number): string {
  if (rate === 0) return '–';
  if (rate < 0.001) return `${(rate * 100_000).toFixed(2)} Ct/100k`;
  if (rate < 0.01) return `${(rate * 1000).toFixed(2)} Ct/1k`;
  return `${(rate * 100).toFixed(2)} Ct`;
}
