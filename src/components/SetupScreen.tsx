import { useId, useState, type FormEvent } from "react";
import type { KeyProblem } from "../hooks/useApiKey";
import { useT } from "../i18n/localeContext";
import buttons from "../styles/buttons.module.css";
import styles from "./SetupScreen.module.css";

interface SetupScreenProps {
  checking: boolean;
  problem: KeyProblem | null;
  onSubmit: (key: string) => void;
  onCancel?: () => void;
}

export function SetupScreen({ checking, problem, onSubmit, onCancel }: SetupScreenProps) {
  const t = useT();
  const inputId = useId();
  const errorId = useId();
  const [key, setKey] = useState("");
  const [visible, setVisible] = useState(false);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!checking) onSubmit(key);
  };

  return (
    <main className={styles.screen}>
      <h2 className={styles.title}>{t.setup.title}</h2>
      <p className={styles.intro}>{t.setup.intro}</p>
      <form className={styles.form} onSubmit={submit}>
        <label htmlFor={inputId} className={styles.label}>
          {t.setup.keyLabel}
        </label>
        <div className={styles.inputRow}>
          <input
            id={inputId}
            className={styles.input}
            type={visible ? "text" : "password"}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder="sk-ant-…"
            value={key}
            onChange={(event) => setKey(event.target.value)}
            aria-invalid={problem !== null}
            aria-describedby={problem ? errorId : undefined}
          />
          <button
            type="button"
            className={buttons.secondary}
            aria-pressed={visible}
            onClick={() => setVisible((current) => !current)}
          >
            {t.setup.showKey}
          </button>
        </div>
        {problem && (
          <p id={errorId} role="alert" className={styles.error}>
            {problem === "invalidKey" ? t.setup.invalidKey : t.setup.checkFailed}
          </p>
        )}
        {checking && (
          <p role="status" className={styles.status}>
            {t.setup.checking}
          </p>
        )}
        <div className={styles.buttons}>
          <button type="submit" className={buttons.primary} disabled={checking || key.trim() === ""}>
            {t.setup.save}
          </button>
          {onCancel && (
            <button type="button" className={buttons.secondary} onClick={onCancel}>
              {t.setup.cancel}
            </button>
          )}
        </div>
      </form>
    </main>
  );
}
