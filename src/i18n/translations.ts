import { bks } from "./locales/bks";
import { cs } from "./locales/cs";
import { de } from "./locales/de";
import { en } from "./locales/en";
import { sk } from "./locales/sk";
import { sl } from "./locales/sl";
import { tr } from "./locales/tr";
import type { Locale, Translations } from "./types";

export const TRANSLATIONS: Record<Locale, Translations> = { de, en, bks, sl, tr, cs, sk };
