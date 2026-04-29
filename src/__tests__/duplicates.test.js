import { describe, it, expect } from 'vitest';

// Inline copy of hammingDistance for isolated testing
// (original is not exported from Duplicates.jsx)
function hammingDistance(a, b) {
  if (!a || !b || a.length !== b.length) return Infinity;
  let distance = 0;
  for (let i = 0; i < a.length; i++) distance += Math.abs(a[i] - b[i]);
  return distance / a.length;
}

describe('hammingDistance (duplicate detection)', () => {
  it('returns 0 for identical fingerprints', () => {
    const fp = [1, 2, 3, 4, 5];
    expect(hammingDistance(fp, fp)).toBe(0);
  });

  it('returns Infinity for null inputs', () => {
    expect(hammingDistance(null, [1, 2])).toBe(Infinity);
    expect(hammingDistance([1, 2], null)).toBe(Infinity);
  });

  it('returns Infinity for different length arrays', () => {
    expect(hammingDistance([1, 2], [1, 2, 3])).toBe(Infinity);
  });

  it('calculates normalized distance correctly', () => {
    const a = [0, 0, 0, 0];
    const b = [2, 2, 2, 2];
    expect(hammingDistance(a, b)).toBe(2);
  });

  it('similar fingerprints have low distance', () => {
    const a = [1, 2, 3, 4, 5, 6, 7, 8];
    const b = [1, 2, 3, 4, 5, 6, 7, 9];
    expect(hammingDistance(a, b)).toBeLessThan(1.2);
  });

  it('different fingerprints have high distance', () => {
    const a = [0, 0, 0, 0, 0, 0, 0, 0];
    const b = [7, 7, 7, 7, 7, 7, 7, 7];
    expect(hammingDistance(a, b)).toBeGreaterThan(1.2);
  });
});
