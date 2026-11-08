import { LOCALES, type Locale } from "./types";

const ALIASES: Record<string, Locale> = { bs: "bks", hr: "bks", sr: "bks", sh: "bks" };

function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export function detectLocale(languages: readonly string[]): Locale {
  for (const language of languages) {
    const primary = language.toLowerCase().split("-")[0];
    if (isLocale(primary)) return primary;
    if (Object.hasOwn(ALIASES, primary)) return ALIASES[primary];
  }
  return "de";
}

export function resolveInitialLocale(stored: string | null, languages: readonly string[]): Locale {
  return stored !== null && isLocale(stored) ? stored : detectLocale(languages);
}
