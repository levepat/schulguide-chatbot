import { useEffect, useMemo, useState, type ReactNode } from "react";
import { readStorage, writeStorage } from "../storage";
import { resolveInitialLocale } from "./detectLocale";
import { LocaleContext } from "./localeContext";
import { TRANSLATIONS } from "./translations";
import type { Locale } from "./types";

const STORAGE_KEY = "schulguide.locale";

interface LocaleProviderProps {
  children: ReactNode;
}

export function LocaleProvider({ children }: LocaleProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(() =>
    resolveInitialLocale(readStorage(STORAGE_KEY), navigator.languages ?? [navigator.language]),
  );

  useEffect(() => {
    document.documentElement.lang = TRANSLATIONS[locale].htmlLang;
  }, [locale]);

  const value = useMemo(
    () => ({
      locale,
      t: TRANSLATIONS[locale],
      setLocale: (next: Locale) => {
        writeStorage(STORAGE_KEY, next);
        setLocaleState(next);
      },
    }),
    [locale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}
