import { useId } from "react";
import { useLocale } from "../i18n/localeContext";
import { TRANSLATIONS } from "../i18n/translations";
import { LOCALES, type Locale } from "../i18n/types";
import styles from "./LanguageSelector.module.css";

export function LanguageSelector() {
  const { locale, setLocale, t } = useLocale();
  const id = useId();
  return (
    <>
      <label htmlFor={id} className="visually-hidden">
        {t.languageLabel}
      </label>
      <select
        id={id}
        className={styles.select}
        value={locale}
        onChange={(event) => setLocale(event.target.value as Locale)}
      >
        {LOCALES.map((option) => (
          <option key={option} value={option} lang={TRANSLATIONS[option].htmlLang}>
            {TRANSLATIONS[option].languageName}
          </option>
        ))}
      </select>
    </>
  );
}
