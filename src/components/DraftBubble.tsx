import type { StreamDraft } from "../hooks/useChat";
import { useT } from "../i18n/localeContext";
import { Markdown } from "./Markdown";
import styles from "./MessageBubble.module.css";
import { ThinkingDisclosure } from "./ThinkingDisclosure";

interface DraftBubbleProps {
  draft: StreamDraft;
}

export function DraftBubble({ draft }: DraftBubbleProps) {
  const t = useT();
  return (
    <article className={`${styles.bubble} ${styles.bot}`} aria-label={t.chat.bot} aria-busy="true">
      {draft.thinking.trim() && <ThinkingDisclosure text={draft.thinking} />}
      {draft.text ? <Markdown text={draft.text} /> : <p className={styles.writing}>{t.chat.writing}</p>}
    </article>
  );
}
