// SECURITY: format.ts is dumb-formatting only. Never trust the values it
// receives — they should already be zod-validated upstream.

export function formatCents(cents: number): string {
  // We don't use Intl.NumberFormat in RN (locale support is patchy on Android);
  // plain dollar formatting is good enough for v1.
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100);
  const remainder = abs % 100;
  return `${sign}$${dollars.toLocaleString('en-US')}.${remainder.toString().padStart(2, '0')}`;
}

export function formatTimeLeft(deadlineIso: string, now: Date = new Date()): string {
  const remainingMs = new Date(deadlineIso).getTime() - now.getTime();
  if (Number.isNaN(remainingMs) || remainingMs <= 0) return 'closed';
  const totalSeconds = Math.floor(remainingMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
