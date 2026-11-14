import type { AssistantTurn, UserTurn } from "../domain/types";
import { useT } from "../i18n/localeContext";
import { BotAvatar } from "./BotAvatar";
import { Markdown } from "./Markdown";
import styles from "./MessageBubble.module.css";
import { ThinkingDisclosure } from "./ThinkingDisclosure";
import { UsagePanel } from "./UsagePanel";

interface MessageBubbleProps {
  turn: UserTurn | AssistantTurn;
}

function textOf(turn: AssistantTurn): string {
  return turn.content.flatMap((block) => (block.type === "text" ? [block.text] : [])).join("\n\n");
}

function thinkingOf(turn: AssistantTurn): string {
  return turn.content
    .flatMap((block) => (block.type === "thinking" && block.thinking.trim() ? [block.thinking] : []))
    .join("\n\n");
}

export function MessageBubble({ turn }: MessageBubbleProps) {
  const t = useT();
  if (turn.role === "user") {
    return (
      <article className={`${styles.bubble} ${styles.user}`} aria-label={t.chat.you}>
        <p className={styles.userText}>{turn.text}</p>
      </article>
    );
  }
  const thinking = thinkingOf(turn);
  return (
    <article className={styles.botRow} aria-label={t.chat.bot}>
      <BotAvatar />
      <div className={`${styles.bubble} ${styles.bot}`}>
        {thinking && <ThinkingDisclosure text={thinking} />}
        <Markdown text={textOf(turn)} />
        {turn.stopReason === "max_tokens" && <p className={styles.note}>{t.chat.truncated}</p>}
        <UsagePanel turn={turn} />
      </div>
    </article>
  );
}
