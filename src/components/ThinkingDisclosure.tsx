import { useT } from "../i18n/localeContext";
import styles from "./ThinkingDisclosure.module.css";

interface ThinkingDisclosureProps {
  text: string;
}

export function ThinkingDisclosure({ text }: ThinkingDisclosureProps) {
  const t = useT();
  return (
    <details className={styles.details}>
      <summary className={styles.summary}>{t.chat.thinkingSummary}</summary>
      <p className={styles.text}>{text}</p>
    </details>
  );
}
