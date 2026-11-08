import { useEffect, useRef, type ReactNode } from "react";
import type { Turn } from "../domain/types";
import type { StreamDraft } from "../hooks/useChat";
import { useT } from "../i18n/localeContext";
import { DraftBubble } from "./DraftBubble";
import { MessageBubble } from "./MessageBubble";
import styles from "./MessageList.module.css";

interface MessageListProps {
  turns: Turn[];
  draft: StreamDraft | null;
  footer?: ReactNode;
}

export function MessageList({ turns, draft, footer }: MessageListProps) {
  const t = useT();
  const endRef = useRef<HTMLDivElement>(null);
  const draftLength = draft ? draft.text.length + draft.thinking.length : 0;

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [turns.length, draftLength]);

  return (
    <div className={styles.list} role="log" aria-live="polite" aria-label={t.chat.historyLabel}>
      {turns.map((turn) => (
        <MessageBubble key={turn.id} turn={turn} />
      ))}
      {draft && <DraftBubble draft={draft} />}
      {footer}
      <div ref={endRef} />
    </div>
  );
}
