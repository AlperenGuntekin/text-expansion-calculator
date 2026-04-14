import { describe, it, expect } from 'vitest';
import {
  calculateExpansion,
  calculateExpansionBatch,
  maxExpectedChars,
  recommendSourceBudget,
} from './index.js';

describe('calculateExpansion', () => {
  it('expands German text by ~35%', () => {
    const r = calculateExpansion('Design stunning screenshots', 'de');
    expect(r.sourceChars).toBe(27);
    expect(r.expectedChars).toBe(36); // 27 * 1.35
    expect(r.risk).toBe('high');
    expect(r.widthMultiplier).toBe(1.35);
  });

  it('shrinks Japanese text by ~45%', () => {
    const r = calculateExpansion('Hello world', 'ja');
    expect(r.sourceChars).toBe(11);
    expect(r.expectedChars).toBe(6); // 11 * 0.55
    expect(r.risk).toBe('shrinks');
  });

  it('handles unknown locales gracefully', () => {
    const r = calculateExpansion('abc', 'xx');
    expect(r.locale).toBeUndefined();
    expect(r.expectedChars).toBe(3);
    expect(r.risk).toBe('low');
  });

  it('is code-point aware (emoji counted as one char)', () => {
    const r = calculateExpansion('👋', 'de');
    expect(r.sourceChars).toBe(1);
  });

  it('attaches meaningful advice', () => {
    expect(calculateExpansion('test', 'de').advice).toContain('expansion');
    expect(calculateExpansion('test', 'ja').advice).toContain('shorter');
    expect(calculateExpansion('test', 'it').advice).toContain('Minimal');
  });

  it('accepts App Store or Play Store codes', () => {
    expect(calculateExpansion('hi', 'zh-Hans').locale?.name).toBe('Chinese (Simplified)');
    expect(calculateExpansion('hi', 'zh-CN').locale?.name).toBe('Chinese (Simplified)');
  });
});

describe('calculateExpansionBatch', () => {
  it('returns results in input order', () => {
    const results = calculateExpansionBatch('Hello', ['de', 'ja', 'es']);
    expect(results.map((r) => r.locale?.code)).toEqual(['de', 'ja', 'es']);
  });
});

describe('maxExpectedChars', () => {
  it('returns the max character count across locales', () => {
    // "Hello" (5 chars) → German ~35% = 7, Japanese ~-45% = 3, Spanish ~25% = 6
    expect(maxExpectedChars('Hello', ['de', 'ja', 'es'])).toBe(7);
  });
});

describe('recommendSourceBudget', () => {
  it('suggests a conservative English budget for App Store subtitle (30 chars)', () => {
    // With German (+35%), max source = floor(30 / 1.35) = 22
    const budget = recommendSourceBudget(30, ['de', 'fr', 'es']);
    expect(budget).toBe(22);
  });

  it('returns the limit when only shrinking languages are targeted', () => {
    // Japanese shrinks (factor 0.55). Max factor stays at 1.0 default.
    const budget = recommendSourceBudget(30, ['ja', 'ko']);
    expect(budget).toBe(30);
  });

  it('picks the longest-expanding language as constraint', () => {
    // Finnish (+30), German (+35), Italian (+15) → German wins
    const budget = recommendSourceBudget(100, ['fi', 'de', 'it']);
    expect(budget).toBe(74); // floor(100 / 1.35)
  });
});
