import type { ChatErrorKind } from "../hooks/useChat";
import { useT } from "../i18n/localeContext";
import buttons from "../styles/buttons.module.css";
import styles from "./ErrorNotice.module.css";

interface ErrorNoticeProps {
  kind: ChatErrorKind;
  detail: string;
  onRetry: () => void;
}

export function ErrorNotice({ kind, detail, onRetry }: ErrorNoticeProps) {
  const t = useT();
  const canRetry = kind === "temporary" || kind === "network";
  return (
    <div className={styles.notice} role="alert">
      <p className={styles.message}>{t.errors[kind]}</p>
      {kind === "badRequest" && <pre className={styles.detail}>{detail}</pre>}
      {canRetry && (
        <button type="button" className={buttons.secondary} onClick={onRetry}>
          {t.errors.retry}
        </button>
      )}
    </div>
  );
}
