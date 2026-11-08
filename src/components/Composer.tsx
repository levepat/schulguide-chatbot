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
      <div className={styles.buttons}>
        <button type="submit" className={buttons.primary} disabled={busy || !text.trim()}>
          {t.chat.send}
        </button>
        <button type="button" className={buttons.secondary} disabled={!canReset} onClick={onReset}>
          {t.chat.newConversation}
        </button>
      </div>
    </form>
  );
}
