import { useId } from "react";
import { useLocale } from "../i18n/localeContext";
import { TRANSLATIONS } from "../i18n/translations";
import { LOCALES } from "../i18n/types";
import styles from "./LanguageSelector.module.css";

export function LanguageSelector() {
  const { locale, setLocale, t } = useLocale();
  const id = useId();
  return (
    <>
      <label htmlFor={id} className="visually-hidden">
        {t.languageLabel}
      </label>
      <span className={styles.wrap}>
        <select
          id={id}
          className={styles.select}
          value={locale}
          onChange={(event) => {
            const next = LOCALES.find((option) => option === event.target.value);
            if (next) setLocale(next);
          }}
        >
          {LOCALES.map((option) => (
            <option key={option} value={option} lang={TRANSLATIONS[option].htmlLang}>
              {TRANSLATIONS[option].languageName}
            </option>
          ))}
        </select>
      </span>
    </>
  );
}
