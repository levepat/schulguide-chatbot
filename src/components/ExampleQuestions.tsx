import { useT } from "../i18n/localeContext";
import { EXAMPLE_QUESTION_KEYS } from "../i18n/types";
import styles from "./ExampleQuestions.module.css";

interface ExampleQuestionsProps {
  onPick: (question: string) => void;
  disabled: boolean;
}

export function ExampleQuestions({ onPick, disabled }: ExampleQuestionsProps) {
  const t = useT();
  return (
    <section className={styles.empty}>
      <h2 className={styles.title}>{t.chat.emptyTitle}</h2>
      <p className={styles.intro}>{t.chat.emptyIntro}</p>
      <ul className={styles.chips} aria-label={t.chat.examplesLabel}>
        {EXAMPLE_QUESTION_KEYS.map((key) => (
          <li key={key}>
            <button type="button" className={styles.chip} disabled={disabled} onClick={() => onPick(t.chat.examples[key])}>
              {t.chat.examples[key]}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
