import { describe, it, expect } from 'vitest';
import { formatSize } from '@/lib/formatSize';

describe('formatSize', () => {
  it('returns "0 B" for 0 bytes', () => {
    expect(formatSize(0)).toBe('0 B');
  });

  it('formats bytes correctly', () => {
    expect(formatSize(512)).toBe('512 B');
  });

  it('formats kilobytes correctly', () => {
    expect(formatSize(1024)).toBe('1 KB');
    expect(formatSize(1536)).toBe('2 KB'); // 1.5 rounds to 2
  });

  it('formats megabytes with one decimal', () => {
    expect(formatSize(1048576)).toBe('1.0 MB');
    expect(formatSize(1572864)).toBe('1.5 MB');
  });

  it('formats gigabytes with one decimal', () => {
    expect(formatSize(1073741824)).toBe('1.0 GB');
    expect(formatSize(2684354560)).toBe('2.5 GB');
  });

  it('handles small values in KB range', () => {
    expect(formatSize(2048)).toBe('2 KB');
    expect(formatSize(10240)).toBe('10 KB');
  });
});
