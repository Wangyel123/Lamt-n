// Class names are Roman numerals (IV … XII), so sort them by value, not alphabetically
// (alphabetically "IX" < "V" and "XII" < "XI" would read wrongly).

const ROMAN: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100 };

export function romanToNumber(roman: string): number {
  let total = 0;
  for (let i = 0; i < roman.length; i++) {
    const value = ROMAN[roman[i]] ?? NaN;
    const next = ROMAN[roman[i + 1]] ?? 0;
    total += value < next ? -value : value;
  }
  return total;
}

/** Sort comparator: IV, V, …, XI, XII. Unknown names fall back to alphabetical. */
export const compareClasses = (a: string, b: string) => romanToNumber(a) - romanToNumber(b) || a.localeCompare(b);
