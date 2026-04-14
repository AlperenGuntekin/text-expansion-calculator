import {
  getLocale,
  classifyExpansionRisk,
  type ExpansionRisk,
  type Locale,
} from 'app-store-locales';

export type { ExpansionRisk } from 'app-store-locales';

export interface ExpansionResult {
  /** Target locale info (undefined if locale not found). */
  locale: Locale | undefined;

  /** Number of characters in the source text. */
  sourceChars: number;

  /**
   * Expected character count in the target language, computed from
   * the locale's expansion percentage. Rounded to nearest integer.
   */
  expectedChars: number;

  /**
   * Expected visual width multiplier vs the source rendering at the
   * same font size. 1.0 = same width, 1.35 = 35% wider, etc.
   */
  widthMultiplier: number;

  /**
   * Layout overflow risk classification.
   * - `shrinks`: translated text is noticeably shorter (CJK scenarios)
   * - `low`: manageable, small or no padding needed
   * - `medium`: likely needs 10–20% extra space in templates
   * - `high`: needs significant reflow or a shorter source copy
   */
  risk: ExpansionRisk;

  /**
   * Human-readable advice derived from the risk level.
   */
  advice: string;
}

const ADVICE: Record<ExpansionRisk, string> = {
  shrinks:
    'Text will be noticeably shorter than English. Avoid fixed-height layouts ' +
    'that assume English length — the result can look empty. Consider centering ' +
    'or using minimum-width containers.',
  low:
    'Minimal expansion. Most layouts designed for English should accommodate ' +
    'this without changes. Leave ~10% margin as a safety buffer.',
  medium:
    'Noticeable expansion. Design templates with 15–25% extra space in text ' +
    'regions. Test the longest expected translation before finalizing layout.',
  high:
    'Significant expansion. Consider shortening your source copy, using a ' +
    'smaller font size for this locale, or redesigning the layout to flex ' +
    'vertically. Never rely on English character-count limits.',
};

/**
 * Calculate how a piece of source text (assumed English) is expected to
 * grow or shrink when translated to a target locale.
 *
 * @example
 * const result = calculateExpansion('Design stunning screenshots', 'de');
 * // result.sourceChars = 28
 * // result.expectedChars = 38 (German is ~35% longer)
 * // result.risk = 'high'
 * // result.widthMultiplier = 1.35
 */
export function calculateExpansion(
  sourceText: string,
  targetLocale: string,
): ExpansionResult {
  const locale = getLocale(targetLocale);
  const sourceChars = [...sourceText].length; // code-point aware

  if (!locale) {
    return {
      locale: undefined,
      sourceChars,
      expectedChars: sourceChars,
      widthMultiplier: 1,
      risk: 'low',
      advice: 'Target locale not recognized — returning unchanged estimates.',
    };
  }

  const expansionFactor = 1 + locale.expansionPct / 100;
  const expectedChars = Math.round(sourceChars * expansionFactor);
  const widthMultiplier = 1 + locale.widthPct / 100;
  const risk = classifyExpansionRisk(locale.expansionPct);

  return {
    locale,
    sourceChars,
    expectedChars,
    widthMultiplier: Math.round(widthMultiplier * 100) / 100,
    risk,
    advice: ADVICE[risk],
  };
}

/**
 * Batch version: calculate expansion for multiple target locales at once.
 * Returns an array in the same order as the input locales.
 */
export function calculateExpansionBatch(
  sourceText: string,
  targetLocales: readonly string[],
): ExpansionResult[] {
  return targetLocales.map((l) => calculateExpansion(sourceText, l));
}

/**
 * Find the minimum space (in characters) required to fit a translation
 * across all target locales. Useful for sizing UI containers that must
 * support every locale you ship.
 */
export function maxExpectedChars(
  sourceText: string,
  targetLocales: readonly string[],
): number {
  const results = calculateExpansionBatch(sourceText, targetLocales);
  return results.reduce((max, r) => Math.max(max, r.expectedChars), 0);
}

/**
 * Recommend a character budget for the source copy so that even the
 * longest-expanding target language fits within a given character limit
 * (e.g. App Store subtitle max = 30 chars).
 *
 * @example
 * // App Store subtitle max is 30 chars. What's the safe English budget?
 * recommendSourceBudget(30, ['de', 'fi', 'pl']); // → 22 (German expands ~35%)
 */
export function recommendSourceBudget(
  targetLimitChars: number,
  targetLocales: readonly string[],
): number {
  let maxFactor = 1;
  for (const code of targetLocales) {
    const locale = getLocale(code);
    if (!locale) continue;
    const factor = 1 + locale.expansionPct / 100;
    if (factor > maxFactor) maxFactor = factor;
  }
  return Math.floor(targetLimitChars / maxFactor);
}
