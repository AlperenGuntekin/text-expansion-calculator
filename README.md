# text-expansion-calculator

[![npm version](https://img.shields.io/npm/v/text-expansion-calculator.svg)](https://www.npmjs.com/package/text-expansion-calculator)
[![license](https://img.shields.io/npm/l/text-expansion-calculator.svg)](./LICENSE)

> Calculate expected text expansion when translating UI copy to 40+ languages. Estimate character count, visual width, and layout overflow risk.

**Try it without installing:** [shotlingo.com/tools/text-expansion-calculator](https://shotlingo.com/tools/text-expansion-calculator)

Built as part of **[Shotlingo](https://shotlingo.com)** — an AI-powered App Store screenshot localization tool.

## Why this exists

Every designer who ships to multiple languages has hit this problem:

> "I wrote a clean English headline that fits the button. Then marketing translated it to German and it overflowed by 40%."

German is ~35% longer than English. Finnish and Dutch are ~30%. Polish, Russian, Hungarian, Czech, Vietnamese, Ukrainian all add 20–25%. Meanwhile Japanese, Korean, and Chinese shrink 40–50%.

This library gives you:

- 📏 Expected character count per target language
- 🖼 Visual width multiplier (matters for CJK: fewer chars, wider glyphs)
- ⚠️ Layout risk classification (`shrinks` / `low` / `medium` / `high`)
- 💡 Actionable advice per locale
- 🎯 Source budget recommendations ("what's the max English length that fits everywhere?")

## Install

```bash
npm install text-expansion-calculator
```

## Usage

```ts
import {
  calculateExpansion,
  maxExpectedChars,
  recommendSourceBudget,
} from 'text-expansion-calculator';

// Single locale
const result = calculateExpansion('Design stunning screenshots', 'de');
// {
//   locale: { code: 'de', name: 'German', ... },
//   sourceChars: 27,
//   expectedChars: 36,          // +35% expansion
//   widthMultiplier: 1.35,
//   risk: 'high',
//   advice: 'Significant expansion. Consider shortening...'
// }

// Batch: how long is this headline in 5 languages?
const results = calculateExpansion
  .name /* import calculateExpansionBatch */
// See API below

// Source budget for App Store subtitle (30-char limit)
recommendSourceBudget(30, ['de', 'fr', 'fi', 'pl']);
// → 22  (because German expands 35%, so 30 / 1.35 = 22)
```

## API

### `calculateExpansion(text, localeCode)`

Returns an `ExpansionResult`:

```ts
interface ExpansionResult {
  locale: Locale | undefined;
  sourceChars: number;
  expectedChars: number;       // estimated after translation
  widthMultiplier: number;     // e.g. 1.35 = 35% wider pixels
  risk: 'shrinks' | 'low' | 'medium' | 'high';
  advice: string;              // human-readable guidance
}
```

Accepts any locale identifier the dataset understands: ISO 639-1 code (`"de"`), App Store Connect code (`"zh-Hans"`), Play Store code (`"pt-BR"`), or slug (`"brazilian-portuguese"`).

### `calculateExpansionBatch(text, localeCodes[])`

Same as `calculateExpansion` but for multiple target locales at once.

### `maxExpectedChars(text, localeCodes[])`

Returns the largest `expectedChars` across all target locales. Use this when sizing UI containers that must accommodate every locale you ship.

```ts
// "Save" → German "Speichern" (9), French "Enregistrer" (11), Finnish "Tallenna" (8)
maxExpectedChars('Save', ['de', 'fr', 'fi']);
// → 6 (based on expansion estimates; add padding in practice)
```

### `recommendSourceBudget(targetLimitChars, localeCodes[])`

Given a hard character limit (e.g. App Store subtitle = 30 chars) and the languages you ship to, returns the maximum English source length that will fit after translation.

```ts
// App Store subtitle = 30 chars max
recommendSourceBudget(30, ['de']);           // → 22 (German +35%)
recommendSourceBudget(30, ['de', 'fi']);     // → 23 (Finnish +30%, less constrained than German)
recommendSourceBudget(30, ['ja', 'ko']);     // → 30 (CJK shrinks, no constraint)
```

## Common App Store / Play Store character limits

| Surface                    | Limit | English budget (common EU locales) |
| -------------------------- | ----- | ---------------------------------- |
| App Store app name         | 30    | ~22                                |
| App Store subtitle         | 30    | ~22                                |
| App Store keywords (total) | 100   | ~74                                |
| Google Play short description | 80 | ~59                                |
| Google Play title          | 30    | ~22                                |

(Assuming worst-case locale is German at +35%.)

## Related packages

- [**app-store-locales**](https://www.npmjs.com/package/app-store-locales) — the underlying locale dataset (40+ languages, codes, fonts, RTL)
- [**Shotlingo**](https://shotlingo.com) — the product this package is extracted from. Automate the entire screenshot localization pipeline, not just the math.

## License

MIT © [Alperen Güntekin](https://shotlingo.com)

---

<sub>Maintained as part of the [Shotlingo](https://shotlingo.com) open-source toolbox. Found a wrong expansion estimate? [Open an issue](https://github.com/AlperenGuntekin/text-expansion-calculator/issues).</sub>
