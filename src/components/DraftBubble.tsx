import type { StreamDraft } from "../hooks/useChat";
import { useT } from "../i18n/localeContext";
import { BotAvatar } from "./BotAvatar";
import { Markdown } from "./Markdown";
import styles from "./MessageBubble.module.css";
import { ThinkingDisclosure } from "./ThinkingDisclosure";

interface DraftBubbleProps {
  draft: StreamDraft;
}

export function DraftBubble({ draft }: DraftBubbleProps) {
  const t = useT();
  return (
    <article className={styles.botRow} aria-label={t.chat.bot} aria-busy="true">
      <BotAvatar />
      <div className={`${styles.bubble} ${styles.bot}`}>
        {draft.thinking.trim() && <ThinkingDisclosure text={draft.thinking} />}
        {draft.text ? (
          <Markdown text={draft.text} />
        ) : (
          <p className={styles.writing}>
            <span className={styles.dots} aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            {t.chat.writing}
          </p>
        )}
      </div>
    </article>
  );
}
