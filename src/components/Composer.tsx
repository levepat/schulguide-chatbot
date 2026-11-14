import { useId, useState, type FormEvent, type KeyboardEvent } from "react";
import { useT } from "../i18n/localeContext";
import buttons from "../styles/buttons.module.css";
import styles from "./Composer.module.css";

interface ComposerProps {
  busy: boolean;
  canReset: boolean;
  onSend: (text: string) => void;
  onReset: () => void;
}

export function Composer({ busy, canReset, onSend, onReset }: ComposerProps) {
  const t = useT();
  const inputId = useId();
  const [text, setText] = useState("");

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    if (busy || !text.trim()) return;
    onSend(text);
    setText("");
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <form className={styles.composer} onSubmit={submit}>
      <label htmlFor={inputId} className="visually-hidden">
        {t.chat.inputLabel}
      </label>
      <button
        type="button"
        className={styles.reset}
        disabled={!canReset}
        onClick={onReset}
        aria-label={t.chat.newConversation}
        title={t.chat.newConversation}
      >
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
          <path
            fill="currentColor"
            d="M12 5a7 7 0 1 1-6.93 8H3.05A9 9 0 1 0 6 5.3V3H4v6h6V7H7.35A6.97 6.97 0 0 1 12 5Zm-1 3h2v3h3v2h-3v3h-2v-3H8v-2h3V8Z"
          />
        </svg>
      </button>
      <textarea
        id={inputId}
        className={styles.input}
        rows={1}
        enterKeyHint="send"
        placeholder={t.chat.inputPlaceholder}
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={onKeyDown}
      />
      <button type="submit" className={`${buttons.primary} ${styles.send}`} disabled={busy || !text.trim()}>
        <span className={styles.sendLabel}>{t.chat.send}</span>
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
          <path fill="currentColor" d="M3.4 20.4 21 12 3.4 3.6l-.1 6.5L15 12 3.3 13.9l.1 6.5Z" />
        </svg>
      </button>
    </form>
  );
}
