// Self-declared DOB → age in whole years, anchored to a *server* clock.
// REGRESSION-GUARD: client-clock-derived age has been gamed many times.
//
// SECURITY: we accept an injectable `now` for testing — never call new Date()
// directly inside the function under test.
export function isAtLeastYearsOld(dob: Date, minYears: number, now: Date = new Date()): boolean {
  if (!Number.isFinite(dob.getTime())) return false;
  if (minYears < 0) return false;

  const cutoff = new Date(now);
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - minYears);
  // Born ON or BEFORE cutoff date → at least minYears old.
  return dob.getTime() <= cutoff.getTime();
}
