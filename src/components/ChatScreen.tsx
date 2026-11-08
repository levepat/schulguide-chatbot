import type { AssistantTurn } from "../domain/types";
import { useChat } from "../hooks/useChat";
import styles from "./ChatScreen.module.css";
import { Composer } from "./Composer";
import { ConversationTotals } from "./ConversationTotals";
import { EffortSelector } from "./EffortSelector";
import { ErrorNotice } from "./ErrorNotice";
import { ExampleQuestions } from "./ExampleQuestions";
import { MessageList } from "./MessageList";

interface ChatScreenProps {
  apiKey: string;
  onInvalidKey: () => void;
}

export function ChatScreen({ apiKey, onInvalidKey }: ChatScreenProps) {
  const chat = useChat({ apiKey, onInvalidKey });
  const { turns } = chat.conversation;
  const answers = turns.filter((turn): turn is AssistantTurn => turn.role === "assistant");
  const streaming = chat.status === "streaming";
  const isEmpty = turns.length === 0 && !chat.draft;

  return (
    <main className={styles.screen}>
      <div className={styles.scroll}>
        {isEmpty ? (
          <ExampleQuestions onPick={chat.send} disabled={streaming} />
        ) : (
          <MessageList
            turns={turns}
            draft={chat.draft}
            footer={
              <>
                {chat.error && <ErrorNotice kind={chat.error.kind} detail={chat.error.detail} onRetry={chat.retry} />}
                {answers.length > 0 && !streaming && <ConversationTotals answers={answers} />}
              </>
            }
          />
        )}
      </div>
      <div className={styles.bottom}>
        <EffortSelector value={chat.effort} onChange={chat.setEffort} />
        <Composer busy={streaming} canReset={!isEmpty || chat.error !== null} onSend={chat.send} onReset={chat.reset} />
      </div>
    </main>
  );
}
