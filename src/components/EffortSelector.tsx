import { useId } from "react";
import { EFFORTS, type Effort } from "../domain/types";
import { useT } from "../i18n/localeContext";
import styles from "./EffortSelector.module.css";

interface EffortSelectorProps {
  value: Effort;
  onChange: (effort: Effort) => void;
}

export function EffortSelector({ value, onChange }: EffortSelectorProps) {
  const t = useT();
  const name = useId();
  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>{t.chat.effortLabel}</legend>
      <div className={styles.segments}>
        {EFFORTS.map((effort) => (
          <label key={effort} className={styles.segment}>
            <input
              className={styles.radio}
              type="radio"
              name={name}
              value={effort}
              checked={value === effort}
              onChange={() => onChange(effort)}
            />
            <span className={styles.text}>{effort}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
